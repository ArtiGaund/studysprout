#!/usr/bin/env python3
"""
pdf_extractor.py — Universal PDF content extractor.

Extracts ALL content from any digital PDF between start_page and end_page:
  • Text — paragraphs, headings, lists, code blocks
  • Images — embedded JPEG/PNG photos at full quality
  • Diagrams & vector graphics — rasterized from page
  • Display equations & tables — rasterized from non-text regions
  • Charts & graphs — rasterized from non-text regions

TWO-PASS STRATEGY
─────────────────
Pass 1  TEXT  (pdfplumber)
  Extract characters with font/position metadata.
  Apply per-font corrections for MathTime 2 and other common encoding
  issues (only activates when those fonts are actually present).
  Classify lines as heading / paragraph / list / code.
  Store per-line bounding boxes (top, bottom, x0, x1).

Pass 2  VISUAL  (pdftoppm + gap detection)
  Rasterize each page at 150 DPI.
  Build a "text coverage map" from Pass 1 bounding boxes.
  Detect two kinds of uncovered regions:

    A) Vertical gaps  — horizontal bands with no text > MIN_GAP_PX tall.
       These are: standalone figures, large display math, section breaks
       with decorative elements, full-width tables.

    B) Horizontal gaps — for rows where text only occupies the left
       portion of the page, the blank right portion is a visual column.
       These are: sidebar diagrams, inline figures, marginal notes images.

  For each detected region, crop from the rasterized page and check
  whether it contains non-white content. If yes → emit as image block.

  This approach captures everything pdfplumber's text extraction misses:
  vector drawings (PDF path commands), complex multi-line equations,
  tables, chart objects — anything rendered visually rather than as text.

EMBEDDED IMAGES (pikepdf)
  Embedded JPEG/PNG objects are extracted at full quality directly from
  the PDF binary stream, bypassing rasterization entirely. This gives
  crisp photos at their native resolution instead of 150 DPI screenshots.
  Falls back gracefully if pikepdf is unavailable.

WORKS FOR
  Any digital PDF: textbooks, research papers, lecture notes, slides.
  Font corrections only activate for MathTime 2 fonts — ignored otherwise.

INSTALL
  pip install pdfplumber pikepdf pillow --break-system-packages

USAGE
  python pdf_extractor.py <pdf_path> <start_page> <end_page>

OUTPUT
  JSON array of StructuralBlock-compatible dicts.
  Text block fields:  id, type, content, pageNumber, props
  Image block fields: id, type, pageNumber, x0, y0, x1, y1, mimeType, data, props
"""

import sys, json, re, uuid, subprocess, tempfile, os, base64, io
from collections import Counter

# ── Required: pdfplumber ──────────────────────────────────────────────────────
try:
    import pdfplumber
except ImportError:
    print(json.dumps({"error": "pdfplumber not installed. Run: pip install pdfplumber --break-system-packages"}))
    sys.exit(1)

# ── Optional: PIL (needed for visual extraction and image conversion) ─────────
try:
    from PIL import Image as PILImage
    import numpy as _np
    _PIL_OK = True
except ImportError:
    _PIL_OK = False

# ── Optional: pikepdf (for embedded image extraction at full quality) ─────────
try:
    import pikepdf
    _PIKEPDF_OK = True
except ImportError:
    _PIKEPDF_OK = False

# ── Optional: pdftoppm CLI (for page rasterization) ───────────────────────────
_PDFTOPPM_OK = (subprocess.run(['which', 'pdftoppm'], capture_output=True).returncode == 0)


# ═══════════════════════════════════════════════════════════════════════════════
# FONT ENCODING CORRECTIONS (MathTime 2)
# ═══════════════════════════════════════════════════════════════════════════════
# These only activate when MT2* fontnames are detected in the PDF.
# For any other PDF they are completely ignored.

MT2_FAMILIES = ('MT2MIT', 'MT2SYT', 'MT2SYS', 'MT2MIS', 'MT2BMIS', 'MT2EXA')

# ── Symbol / ZapfDingbats font corrections ────────────────────────────────────
# pdfplumber has no ToUnicode for these Type1 fonts and uses glyph name heuristics
# that produce wrong Unicode. Map the wrong codepoints → correct ones.
# Detected by fontname containing 'Symbol' or 'ZapfDingbats'.
SYMBOL_FONT_FIXES: dict = {
    '\uFB01': '→',   # ﬁ  (code 0xAE arrowright)
    '\uFB02': '⟶',  # ﬂ  (code 0xBE arrowdblright)
    '\u00C6': '∅',   # Æ  (code 0xC6 emptyset)
    '\u00D0': '∂',   # Ð  (code 0xD0 partialdiff)
    '\u00E6': '∈',   # æ  (code 0xCE element)
    '\u00F8': '∅',   # ø  (code 0xD6 emptyset alt)
    '\u00AC': '¬',   # logicalnot — already correct but included for clarity
}
# ZapfDingbats bullet markers that come through correctly or need mapping
ZAPF_FONT_FIXES: dict = {
    '\u2022': '•',   # bullet — correct passthrough
    '\u274F': '▪',   # already correct
}

def get_font_family(fontname: str) -> str:
    short = fontname.split('+')[-1] if '+' in fontname else fontname
    for fam in MT2_FAMILIES:
        if fam in short:
            return fam
    if 'Mathematica' in short:
        return '__DROP__'
    return ''

def is_symbol_font(fontname: str) -> bool:
    """True for Adobe Symbol and ZapfDingbats — both have wrong Unicode mappings."""
    fn = fontname.split('+')[-1] if '+' in fontname else fontname
    return 'Symbol' in fn or 'Zapf' in fn or 'Wingdings' in fn

def correct_symbol_char(ch: str, fontname: str) -> str:
    """Apply per-font correction for Symbol/ZapfDingbats wrong Unicode mappings."""
    if not is_symbol_font(fontname):
        return ch
    if 'Zapf' in fontname or 'Wingdings' in fontname:
        return ZAPF_FONT_FIXES.get(ch, ch)
    return SYMBOL_FONT_FIXES.get(ch, ch)

FONT_CORRECTIONS: dict = {
    'MT2MIT': {'.':'(', '/':')', ';':',', '=':'/', 'Œ':'[', 'Š':']', '˛':'α', 'ˇ':'β'},
    'MT2MIS': {'.':'(', '/':')', ';':',', 'Œ':'[', 'Š':']'},
    'MT2SYT': {
        '!':' → ', 'C':' + ', 'D':' = ', 'W':' | ', '2':' ∈ ',
        'f':'{', 'g':'}', 'h':'⟨', 'i':'⟩', 'j':'|', 'k':'‖',
        'N':'|', 'p':'√', '¤':' ≠ ', '˚':' ⊕ ', 'I':'; ', 'ı':'',
    },
    'MT2SYS': {'C':'+', 'D':'=', '2':'∈', '1':'∞', '?':''},
    'MT2EXA':   '__DROP_ALL__',
    '__DROP__': '__DROP_ALL__',
}

FONT_CID_MAPS: dict = {
    'MT2MIT':  {2:'λ', 4:']'},
    'MT2MIS':  {2:']', 4:']'},
    'MT2BMIS': {2:']', 4:']'},
    'MT2SYT':  {2:'•', 4:'·'},
    'MT2SYS':  {2:'−', 4:'·'},
    'MT2EXA':  {},
    '__DROP__':{},
}

_DEFAULT_CID = {2:'λ', 3:'−', 4:'·', 5:'≥', 6:'≤', 7:'⊆',
                8:'∈', 9:'∉', 10:'→', 11:'⇒', 12:'⟺', 13:'≠',
                25:'', 127:'•'}

def correct_char(ch: str, fam: str) -> str | None:
    if not fam: return ch
    rule = FONT_CORRECTIONS.get(fam)
    if rule is None: return ch
    if rule == '__DROP_ALL__': return None
    repl = rule.get(ch)
    if repl is None: return ch
    return repl if repl != '' else None

def decode_cid(cid_str: str, fam: str) -> str | None:
    m = re.match(r'\(cid:(\d+)\)', cid_str)
    if not m: return cid_str
    n = int(m.group(1))
    if fam in ('MT2EXA', '__DROP__'): return None
    fmap = FONT_CID_MAPS.get(fam, _DEFAULT_CID)
    repl = fmap.get(n, _DEFAULT_CID.get(n, ''))
    return repl if repl != '' else None


# ═══════════════════════════════════════════════════════════════════════════════
# LINE BUILDING
# ═══════════════════════════════════════════════════════════════════════════════

def build_line_text(chars: list, x_tol: float = 2.0) -> tuple:
    """
    Build corrected Unicode text from a sorted list of pdfplumber char dicts.
    Returns (text, is_decorative, ornament_loss, math_chars, total_chars).

    ornament_loss  – count of MT2EXA chars that were dropped (equation structure lost)
    math_chars     – count of chars from math italic/symbol fonts
    total_chars    – total raw chars on this line
    These three values drive display-math-zone detection in extract_blocks.
    """
    if not chars:
        return '', False, 0, 0, 0

    parts: list[str] = []
    last_x1: float = -1.0
    total = dropped = ornament_loss = math_chars = 0
    i = 0
    MATH_FAMS = ('MT2MIT', 'MT2SYT', 'MT2SYS', 'MT2MIS', 'MT2BMIS')

    while i < len(chars):
        c   = chars[i]
        raw = c.get('text', '')
        fam = get_font_family(c.get('fontname', ''))
        x0  = c.get('x0', 0.0)
        x1  = c.get('x1', x0 + c.get('width', 4.0))
        total += 1
        if fam in MATH_FAMS:
            math_chars += 1

        if raw.startswith('(cid:'):
            if (raw == '(cid:4)' and i+2 < len(chars)
                    and chars[i+1].get('text') == '(cid:4)'
                    and chars[i+2].get('text') == '(cid:4)'):
                if last_x1 >= 0 and x0 - last_x1 > x_tol:
                    parts.append(' ')
                parts.append('⋯')
                last_x1 = chars[i+2].get('x1', x0)
                i += 3
                continue
            decoded = decode_cid(raw, fam)
            if decoded is None:
                dropped += 1
                if fam == 'MT2EXA': ornament_loss += 1
                i += 1; continue
            if decoded:
                if last_x1 >= 0 and x0 - last_x1 > x_tol:
                    parts.append(' ')
                parts.append(decoded)
                last_x1 = x1
            i += 1; continue

        if fam in ('MT2EXA', '__DROP__'):
            dropped += 1
            if fam == 'MT2EXA': ornament_loss += 1
            i += 1; continue

        corrected = correct_char(raw, fam)
        if corrected is None:
            i += 1; continue

        # Apply Symbol/ZapfDingbats correction after MT2 correction
        corrected = correct_symbol_char(corrected, c.get('fontname', ''))

        if last_x1 >= 0 and x0 - last_x1 > x_tol:
            parts.append(' ')
        if corrected:
            parts.append(corrected)
        last_x1 = x1
        i += 1

    text = re.sub(r'  +', ' ', ''.join(parts).strip())

    # Fix mid-word √ artifacts and ::: → ⋯
    text = text.replace(':::', '⋯')
    text = re.sub(r'(?<=[a-zA-Z])√(?=[a-zA-Z])', '', text)
    # Fix "f | R → R" function colon
    text = re.sub(r'(\b\w{1,3}) \| ([A-ZFRCVWPa-z]+ → )', r'\1 : \2', text)

    is_decorative = (dropped / max(total, 1)) > 0.40
    return text, is_decorative, ornament_loss, math_chars, total


# ═══════════════════════════════════════════════════════════════════════════════
# SUPERSCRIPT ORPHAN MERGER
# ═══════════════════════════════════════════════════════════════════════════════

def merge_superscript_orphans(raw_lines: dict, body_size: float) -> dict:
    """
    Merge standalone superscript/subscript lines (≤4 chars, all tiny font)
    into the nearest adjacent host line within 10px.
    e.g.  'n' floating above 'F'  →  merged into 'Fn'.
    """
    DIST = 10
    sorted_ys = sorted(raw_lines.keys())
    to_drop: set = set()

    for y in sorted_ys:
        chars = raw_lines[y]
        if not chars: continue
        raw_txt = ''.join(c.get('text','') for c in chars).strip()
        if len(raw_txt) > 4: continue

        all_sub = all(
            get_font_family(c.get('fontname','')) in ('MT2MIS','MT2BMIS')
            or c.get('size', body_size) <= body_size * 0.82
            for c in chars if c.get('text','').strip()
        )
        if not all_sub: continue

        ox0 = min(c.get('x0',0) for c in chars)
        ox1 = max(c.get('x1', c.get('x0',0)) for c in chars)
        best_host, best_dist = None, DIST + 1

        for hy in sorted_ys:
            if hy == y or hy in to_drop: continue
            dist = abs(hy - y)
            if dist > DIST or dist >= best_dist: continue
            hc = raw_lines[hy]
            hx0 = min(c.get('x0',0) for c in hc)
            hx1 = max(c.get('x1', c.get('x0',0)) for c in hc)
            if ox0 <= hx1 + 30 and ox1 >= hx0 - 30:
                best_host, best_dist = hy, dist

        if best_host is not None:
            raw_lines[best_host] = sorted(
                raw_lines[best_host] + chars, key=lambda c: c.get('x0',0))
            to_drop.add(y)
        else:
            to_drop.add(y)

    for y in to_drop:
        del raw_lines[y]
    return raw_lines


# ═══════════════════════════════════════════════════════════════════════════════
# NOISE / FILTER HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

_COPYRIGHT_RE = re.compile(r'copyright|all rights reserved', re.I)
_DOI_RE       = re.compile(r'doi\s*[\s:]?\s*10\.\d{4}', re.I)
_WWW_RE       = re.compile(r'^\s*www\.', re.I)
_SPRINGER_RE  = re.compile(r'©|springer\s+(international|texts|link)|axler,\s+linear', re.I)
_RUN_HEAD_RE  = re.compile(r'(SECTION|CHAPTER|section|chapter|PREFACE|EXERCISES?)\s*\d*', re.I)

def is_global_noise(text: str) -> bool:
    return bool(_COPYRIGHT_RE.search(text) or _DOI_RE.search(text)
                or _WWW_RE.search(text) or _SPRINGER_RE.search(text))

def is_running_header(text: str) -> bool:
    return bool(_RUN_HEAD_RE.search(text))

def is_standalone_page_number(text: str) -> bool:
    t = text.strip()
    return bool(re.fullmatch(r'\d+', t) or re.fullmatch(r'[ivxlcdmIVXLCDM]{1,6}', t))

def is_divider(text: str) -> bool:
    return bool(re.match(r'^[-─═*·_.\s]{3,}$', text.strip()))


# ═══════════════════════════════════════════════════════════════════════════════
# HEADING COLOR DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

_NEAR_BLACK = 0.18

def get_line_color(line_chars: list):
    for c in line_chars:
        if get_font_family(c.get('fontname','')) in ('MT2EXA','__DROP__'):
            continue
        col = c.get('non_stroking_color')
        if col is not None:
            return col
    return None

def is_colored_line(color) -> bool:
    if color is None: return False
    if isinstance(color, (int, float)):
        return float(color) < 0.85
    if hasattr(color, '__len__') and len(color) == 1:
        return float(color[0]) < 0.85
    if len(color) < 3: return False
    r, g, b = float(color[0]), float(color[1]), float(color[2])
    if r < _NEAR_BLACK and g < _NEAR_BLACK and b < _NEAR_BLACK: return False
    return max(r, g, b) > 0.25


# ═══════════════════════════════════════════════════════════════════════════════
# COLUMN GAP SPLITTER
# ═══════════════════════════════════════════════════════════════════════════════

def split_at_column_gaps(sorted_chars: list, gap: float = 30.0) -> list:
    if not sorted_chars: return []
    segments, current = [], [sorted_chars[0]]
    for i in range(1, len(sorted_chars)):
        prev_x1 = sorted_chars[i-1].get('x1', sorted_chars[i-1].get('x0',0) + 8)
        curr_x0 = sorted_chars[i].get('x0', 0)
        if curr_x0 - prev_x1 > gap:
            segments.append(current); current = [sorted_chars[i]]
        else:
            current.append(sorted_chars[i])
    if current: segments.append(current)
    return segments


# ═══════════════════════════════════════════════════════════════════════════════
# FRAGMENT MERGER
# ═══════════════════════════════════════════════════════════════════════════════

_MAX_MERGE_GAP = 15  # px; body text line-wrap ≤15px; list items >15px = separate

def _is_subsection_title(text: str) -> bool:
    t = text.strip()
    if not t or re.search(r'[.!?:;,]\s*$', t): return False
    words = t.split()
    if not 1 <= len(words) <= 6: return False
    return all(w[0].isupper() or not w[0].isalpha() for w in words if w)

def _looks_like_label(text: str) -> bool:
    t = text.strip()
    if re.match(r'^\d+\.\d+\s+[A-Z]', t): return True
    if re.match(r'^(SECTION|CHAPTER|EXERCISES?)\b', t, re.I): return True
    if re.match(r'^(Proof|Example|Defi?nition|Theorem|Lemma|Corollary|Remark|Note|Proposition)\s*[.:]?\s*$', t): return True
    return False

def merge_fragments(blocks: list) -> list:
    merged: list = []
    for block in blocks:
        # Never merge image or table blocks
        if block.get('type') in ('image', 'table'):
            merged.append(block)
            continue

        if (block.get('type') == 'paragraph'
                and merged and merged[-1].get('type') == 'paragraph'):
            prev, curr = merged[-1], block
            pt, ct = prev.get('content',''), curr.get('content','')

            if (_looks_like_label(ct) or _looks_like_label(pt)
                    or _is_subsection_title(pt)):
                merged.append(block); continue

            same_page = prev.get('pageNumber') == curr.get('pageNumber')
            if same_page:
                y_gap = abs(curr.get('_y',0) - prev.get('_y',0))
                if y_gap > _MAX_MERGE_GAP:
                    merged.append(block); continue

            incomplete = bool(pt) and not re.search(r'[.!?:;]\s*$', pt)
            cross_cont = (not same_page and incomplete
                          and (ct[:1].islower() or pt.endswith('-')))

            if (same_page and incomplete and
                    (pt.endswith('-') or ct[:1].islower())) or cross_cont:
                sep = '' if pt.endswith('-') else ' '
                prev['content'] = (pt[:-1] if pt.endswith('-') else pt) + sep + ct
                continue

        merged.append(block)
    return merged


# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDED IMAGE EXTRACTION  (pikepdf — full quality JPEG/PNG)
# ═══════════════════════════════════════════════════════════════════════════════

def _walk_xobjects(xobjs: dict, visited: set) -> list:
    """
    Recursively collect image data from XObject resources.
    Returns list of (raw_bytes, filter, w, h, colorspace, xobj_ref).
    xobj_ref is the pikepdf object — used for decoded bytes fallback.
    """
    results = []
    for key, xobj in xobjs.items():
        try:
            ref = xobj.objgen
            if ref in visited: continue
            visited.add(ref)
            sub = str(xobj.get('/Subtype',''))
            if sub == '/Image':
                filt = str(xobj.get('/Filter',''))
                w    = int(xobj.get('/Width', 0))
                h    = int(xobj.get('/Height', 0))
                cs   = str(xobj.get('/ColorSpace', '/DeviceRGB'))
                raw  = bytes(xobj.read_raw_bytes())
                results.append((raw, filt, w, h, cs, xobj))
            elif sub == '/Form':
                inner = xobj.get('/Resources', {})
                ix    = inner.get('/XObject', {}) if inner else {}
                if ix: results.extend(_walk_xobjects(ix, visited))
        except Exception:
            continue
    return results

def _raw_to_b64(raw: bytes, filt: str, w: int, h: int, cs: str,
                xobj=None) -> tuple | None:
    """
    Convert raw PDF image bytes to (mime_type, base64_string).
    xobj: pikepdf XObject — used to get decoded bytes for non-JPEG formats.
    Returns None on failure.
    """
    if not _PIL_OK: return None
    try:
        if 'DCTDecode' in filt:
            # JPEG — raw bytes are already a valid JPEG file
            return ('image/jpeg', base64.b64encode(raw).decode())

        mode = 'L'    if ('Gray' in cs or 'DeviceGray' in cs) else \
               'CMYK' if ('CMYK' in cs or 'DeviceCMYK' in cs) else 'RGB'

        # Try PIL.open on raw bytes first (works for PNG/TIFF/BMP in PDF)
        try:
            img = PILImage.open(io.BytesIO(raw))
            img.load()
        except Exception:
            # Fallback: get decompressed pixel stream from pikepdf
            if xobj is None:
                return None
            try:
                decoded = bytes(xobj.read_bytes())
            except Exception:
                return None
            bytes_per_px = 1 if mode == 'L' else 4 if mode == 'CMYK' else 3
            if w > 0 and h > 0 and len(decoded) >= w * h * bytes_per_px:
                try:
                    img = PILImage.frombytes(mode, (w, h), decoded)
                except Exception:
                    return None
            else:
                try:
                    img = PILImage.open(io.BytesIO(decoded))
                    img.load()
                except Exception:
                    return None

        if img.mode == 'CMYK':
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return ('image/png', base64.b64encode(buf.getvalue()).decode())

    except Exception:
        return None

def extract_embedded_images(page_plumber, page_pike, page_num: int) -> list:
    """Extract embedded JPEG/PNG images from the PDF binary stream (full quality)."""
    if not (_PIKEPDF_OK and _PIL_OK): return []
    blocks = []
    plumber_imgs = page_plumber.images or []
    try:
        res   = page_pike.Resources
        xobjs = res.get('/XObject', {}) if res else {}
    except Exception:
        return []

    raw_imgs = _walk_xobjects(xobjs, set())

    for idx, img_info in enumerate(plumber_imgs):
        if idx >= len(raw_imgs): break
        raw, filt, w, h, cs, xobj = raw_imgs[idx]
        result = _raw_to_b64(raw, filt, w, h, cs, xobj)
        if result is None: continue
        mime, b64 = result
        x0, y0 = img_info.get('x0',0), img_info.get('y0',0)
        x1, y1 = img_info.get('x1',0), img_info.get('y1',0)
        if (x1-x0) < 20 or (y1-y0) < 20: continue
        blocks.append({
            'id': str(uuid.uuid4()), 'type': 'image', 'pageNumber': page_num,
            'x0': round(x0,1), 'y0': round(y0,1),
            'x1': round(x1,1), 'y1': round(y1,1),
            'mimeType': mime, 'data': b64,
            '_y': round(page_plumber.height - y1),
            'props': {'source': 'embedded'},
        })
    return blocks


# ═══════════════════════════════════════════════════════════════════════════════
# VISUAL REGION EXTRACTION  (pdftoppm rasterization)
# ═══════════════════════════════════════════════════════════════════════════════

DPI = 150   # rasterization resolution

# ── Page rasterization cache ──────────────────────────────────────────────────
# pdftoppm is called once per BATCH (the full start_page→end_page range),
# not once per page. This avoids 350 subprocess launches for a 350-page book.
# The cache maps page_num → PIL Image for the current extraction job.
_page_image_cache: dict = {}

def preload_page_images(pdf_path: str, start_page: int, end_page: int) -> None:
    """
    Rasterize all pages in [start_page, end_page] in a single pdftoppm call.
    Results stored in _page_image_cache[page_num].
    """
    global _page_image_cache
    _page_image_cache = {}
    if not (_PDFTOPPM_OK and _PIL_OK):
        return
    try:
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, 'p')
            r = subprocess.run(
                ['pdftoppm', '-r', str(DPI),
                 '-f', str(start_page), '-l', str(end_page),
                 '-png', pdf_path, out],
                capture_output=True, timeout=300
            )
            if r.returncode != 0:
                return
            files = sorted(os.listdir(d))
            for fname in files:
                if not fname.endswith('.png'):
                    continue
                # pdftoppm names files like "p-000001.png"
                # extract the page number from the filename
                stem = fname.replace('.png', '')
                num_part = stem.split('-')[-1].lstrip('0') or '0'
                try:
                    pg_num = int(num_part)
                except ValueError:
                    continue
                img = PILImage.open(os.path.join(d, fname)).convert('RGB')
                img.load()
                _page_image_cache[pg_num] = img
    except Exception:
        pass

def _get_page_image(page_num: int) -> 'PILImage.Image | None':
    """Return cached rasterized page image, or None if not available."""
    return _page_image_cache.get(page_num)

def _has_content(img: 'PILImage.Image',
                 white_thresh: int = 245,
                 min_ratio: float = 0.008) -> bool:
    """True if the image region has enough non-white pixels to be meaningful."""
    if not _PIL_OK: return False
    try:
        arr = _np.array(img.convert('RGB'))
        non_white = _np.sum(_np.any(arr < white_thresh, axis=2))
        return float(non_white) / arr.size * 3 > min_ratio
    except Exception:
        return False

def _pts_to_px(pts: float, page_height_pts: float = None) -> int:
    """Convert PDF points to pixels at DPI."""
    return int(pts * DPI / 72)

def _find_vertical_gaps(line_spans: list, page_height: float,
                        min_gap: float = 28.0,
                        top_margin: float = 25.0,
                        bot_margin: float = 25.0) -> list:
    """
    Find horizontal bands (y ranges in screen coords) not covered by any text.
    line_spans: list of (top, bottom) in screen coords (top < bottom).
    Returns list of (gap_top, gap_bot) in screen coords.
    """
    if not line_spans:
        return [(top_margin, page_height - bot_margin)]
    spans = sorted(line_spans)
    gaps  = []
    prev_bot = top_margin
    for (top, bot) in spans:
        if top - prev_bot >= min_gap:
            gaps.append((prev_bot, top))
        prev_bot = max(prev_bot, bot)
    if page_height - bot_margin - prev_bot >= min_gap:
        gaps.append((prev_bot, page_height - bot_margin))
    return gaps

def _find_right_column_regions(line_spans_with_x: list,
                               page_width: float,
                               page_height: float,
                               min_right_gap: float = 70.0,
                               min_height: float = 25.0) -> list:
    """
    Find Y bands where text only covers the left portion of the page.
    The right portion (> min_right_gap blank) is a visual column region.
    Returns list of (top, bot, x_start, x_end) in screen coords.
    """
    # Group into 20pt bands
    band_size = 20.0
    bands: dict = {}
    for (top, bot, x0, x1) in line_spans_with_x:
        band = int(top / band_size) * band_size
        entry = bands.get(band)
        if entry is None:
            bands[band] = [top, bot, x0, x1]
        else:
            bands[band][0] = min(entry[0], top)
            bands[band][1] = max(entry[1], bot)
            bands[band][2] = min(entry[2], x0)
            bands[band][3] = max(entry[3], x1)

    # Find bands where right margin > min_right_gap
    visual_bands = []
    for band, (top, bot, x0, x1) in sorted(bands.items()):
        right_gap = page_width - x1
        if right_gap >= min_right_gap and (bot - top) >= min_height:
            # The visual column starts at x1 (right edge of text)
            visual_bands.append((top, bot, x1, page_width))

    # Merge contiguous bands
    if not visual_bands: return []
    merged = [list(visual_bands[0])]
    for (top, bot, xs, xe) in visual_bands[1:]:
        prev = merged[-1]
        if top - prev[1] <= band_size * 1.5 and abs(xs - prev[2]) < 30:
            prev[1] = max(prev[1], bot)
            prev[2] = min(prev[2], xs)
            prev[3] = max(prev[3], xe)
        else:
            merged.append([top, bot, xs, xe])

    return [tuple(r) for r in merged if r[1] - r[0] >= min_height]

def extract_visual_regions(
        pdf_path: str,
        page_num: int,
        page_height_pts: float,
        page_width_pts: float,
        text_line_spans: list,       # list of (top, bottom) screen coords
        text_line_spans_with_x: list, # list of (top, bottom, x0, x1)
        embedded_image_boxes: list,  # list of (y_top, y_bot) screen coords — skip overlap
) -> list:
    """
    Rasterize the page and extract visual content regions as image blocks.
    Detects both vertical gaps and right-column visual areas.
    """
    if not (_PDFTOPPM_OK and _PIL_OK): return []

    page_img = _get_page_image(page_num)
    if page_img is None: return []

    scale     = DPI / 72.0
    img_w, img_h = page_img.size

    def crop_and_encode(top_pts, bot_pts, x0_pts, x1_pts) -> dict | None:
        """Crop region, check for content, return image block or None."""
        px_top  = max(0, int(top_pts  * scale) - 4)
        px_bot  = min(img_h, int(bot_pts * scale) + 4)
        px_left = max(0, int(x0_pts * scale))
        px_right = min(img_w, int(x1_pts * scale))
        if px_bot - px_top < 8 or px_right - px_left < 8: return None

        region = page_img.crop((px_left, px_top, px_right, px_bot))
        if not _has_content(region): return None

        # Skip if this region is already covered by a skip box
        # (embedded image or already-rasterized math zone)
        for (ey_top, ey_bot) in embedded_image_boxes:
            overlap = min(bot_pts, ey_bot) - max(top_pts, ey_top)
            if overlap > (bot_pts - top_pts) * 0.5:
                return None

        buf = io.BytesIO()
        region.save(buf, format='PNG', optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            'id': str(uuid.uuid4()), 'type': 'image', 'pageNumber': page_num,
            'x0': round(x0_pts, 1), 'y0': round(top_pts, 1),
            'x1': round(x1_pts, 1), 'y1': round(bot_pts, 1),
            'mimeType': 'image/png', 'data': b64,
            '_y': round(top_pts),
            'props': {'source': 'visual'},
        }

    blocks = []

    # ── A) Vertical gaps (full-width non-text regions) ────────────────────────
    v_gaps = _find_vertical_gaps(text_line_spans, page_height_pts)
    for (gap_top, gap_bot) in v_gaps:
        blk = crop_and_encode(gap_top, gap_bot, 0, page_width_pts)
        if blk: blocks.append(blk)

    # ── B) Horizontal visual columns (right side of two-column rows) ──────────
    h_regions = _find_right_column_regions(
        text_line_spans_with_x, page_width_pts, page_height_pts)
    for (top, bot, xs, xe) in h_regions:
        # Don't double-extract if this Y range was already in a vertical gap
        already = any(gt <= top and bot <= gb for (gt, gb) in v_gaps)
        if already: continue
        blk = crop_and_encode(top, bot, xs, xe)
        if blk: blocks.append(blk)

    return blocks


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

MONO_KWS = ['mono','courier','cour','consol','inconsolata',
            'lucidaconsole','code','fixed']

# ═══════════════════════════════════════════════════════════════════════════════
# DISPLAY MATH ZONE DETECTION & RASTERIZATION
# ═══════════════════════════════════════════════════════════════════════════════

# A line is "math-lossy" if:
#   - It has ornament chars dropped (MT2EXA fraction bars, underbraces, etc.)
#   - OR it is >70% math-font chars with essentially no body text
#     (pure display equation like "= (ac − bd) + (ad + bc)i")
#
# Consecutive lossy lines within MATH_ZONE_GAP points form one display-math zone.
# That zone is rasterized as a single image block.
# The garbled text version is discarded and replaced by the image.

_ORNAMENT_LOSS_RATIO = 0.05    # ≥5% ornament chars dropped → lossy line
_PURE_MATH_RATIO     = 0.80    # ≥80% math-font chars AND no body text → pure math
_MATH_ZONE_GAP       = 6.0     # points; gap between lossy lines to still merge
_MIN_MATH_ZONE_H     = 8.0     # points; minimum zone height to bother rasterizing


def _is_lossy_line(ornament_loss: int, math_ch: int, total: int,
                   text: str) -> bool:
    """True if this line has structural math information that text cannot carry."""
    if total == 0:
        return False
    if ornament_loss / total >= _ORNAMENT_LOSS_RATIO:
        return True
    # Pure math line with almost no alphabetic body text
    if math_ch / total >= _PURE_MATH_RATIO:
        body_letters = sum(1 for c in text if c.isalpha() and c.islower())
        if body_letters < 3:
            return True
    return False


def build_display_math_zones(
        line_records: list,   # list of (top, bot, x0, x1, is_lossy)
        page_width: float,
) -> list:
    """
    Group consecutive lossy lines into display-math zones.
    Returns list of (zone_top, zone_bot, x0, x1, [contained_line_records]).

    Each zone will be rasterized; the text blocks from those lines
    are discarded and replaced by the image.
    """
    zones = []
    current: list = []

    for rec in sorted(line_records, key=lambda r: r[0]):
        top, bot, x0, x1, is_lossy = rec
        if not is_lossy:
            if current:
                zones.append(current)
                current = []
            continue

        if current:
            prev_bot = current[-1][1]
            if top - prev_bot > _MATH_ZONE_GAP:
                zones.append(current)
                current = []

        current.append(rec)

    if current:
        zones.append(current)

    result = []
    for zone in zones:
        zt = min(r[0] for r in zone)
        zb = max(r[1] for r in zone)
        zx0 = min(r[2] for r in zone)
        zx1 = max(r[3] for r in zone)
        if zb - zt < _MIN_MATH_ZONE_H:
            continue
        # Extend slightly beyond the text bounding box for proper visual margin
        result.append((
            max(0, zt - 4),
            min(page_width * 10, zb + 6),   # page_width*10 is just a large sentinel
            max(0, zx0 - 8),
            min(page_width, zx1 + 8),
            zone,
        ))
    return result

def extract_tables_from_page(page, page_num: int) -> tuple[list, set]:
    """
    Detect and extract tables using pdfplumber's table finder.

    Returns:
      (table_blocks, excluded_char_tops)

      table_blocks       — list of block dicts (type='table' or type='image')
      excluded_char_tops — set of char 'top' values (rounded) that fall inside
                           a detected table bbox; these should be SKIPPED during
                           normal text extraction so table cells don't also appear
                           as fragmented text blocks.
    """
    table_blocks: list = []
    excluded_tops: set = set()

    try:
        # Only use lines-based detection. The text-alignment strategy is too
        # aggressive — it classifies entire pages as "tables" when content
        # happens to be column-aligned (slides, two-column layouts, LADR).
        # Borderless tables without rules are safely captured by the visual
        # region pass (rasterized as images) — no data is lost.
        tables = page.find_tables({
            "vertical_strategy":   "lines",
            "horizontal_strategy": "lines",
        })
    except Exception:
        return [], set()

    for tbl in tables:
        try:
            x0, top, x1, bottom = tbl.bbox

            # Mark all chars inside this bbox as excluded from text extraction
            for c in (page.chars or []):
                ct = c.get('top', 0)
                cx = c.get('x0', 0)
                if top <= ct <= bottom and x0 <= cx <= x1:
                    excluded_tops.add(round(ct))

            # Extract structured table data
            rows = tbl.extract()
            if not rows:
                continue

            # Clean cells: None → '', strip whitespace
            cleaned_rows = []
            for row in rows:
                cleaned_rows.append([
                    (cell or '').strip().replace('\n', ' ')
                    for cell in row
                ])

            # Quality check: if >30% of cells are empty it's probably
            # a layout artifact, not a real table — rasterize instead
            total_cells = sum(len(r) for r in cleaned_rows)
            empty_cells = sum(1 for r in cleaned_rows for c in r if not c)
            is_clean = total_cells > 0 and empty_cells / total_cells < 0.30

            if is_clean:
                table_blocks.append({
                    'id':         str(uuid.uuid4()),
                    'type':       'table',
                    'pageNumber': page_num,
                    'content':    cleaned_rows,   # list of lists of strings
                    'x0': round(x0, 1), 'y0': round(top, 1),
                    'x1': round(x1, 1), 'y1': round(bottom, 1),
                    '_y': round(top),
                    'props': {'rows': len(cleaned_rows),
                              'cols': len(cleaned_rows[0]) if cleaned_rows else 0},
                })
            else:
                # Messy table (too many empty cells) — let the visual region
                # pass rasterize it. We still exclude its chars from text extraction
                # to prevent garbled column text appearing as headings/paragraphs.
                pass
        except Exception:
            continue

    return table_blocks, excluded_tops


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_blocks(pdf_path: str, start_page: int, end_page: int) -> list:
    all_blocks: list = []

    # Rasterize all pages in one batched pdftoppm call (avoids N subprocess launches)
    preload_page_images(pdf_path, start_page, end_page)

    pike_doc = pikepdf.open(pdf_path) if _PIKEPDF_OK else None

    with pdfplumber.open(pdf_path) as doc:
        total    = len(doc.pages)
        end_page = min(end_page, total)

        for pg_idx in range(start_page - 1, end_page):
            page        = doc.pages[pg_idx]
            page_num    = pg_idx + 1
            page_h      = page.height or 792
            page_w      = page.width  or 612

            # ── 1. Embedded images (full quality via pikepdf) ─────────────────
            embedded: list = []
            if pike_doc is not None:
                try:
                    embedded = extract_embedded_images(
                        page, pike_doc.pages[pg_idx], page_num)
                    all_blocks.extend(embedded)
                except Exception:
                    pass

            # ── 2. Table extraction ───────────────────────────────────────────
            # Run BEFORE text processing. Tables are extracted as structured
            # blocks, and their chars are excluded from the text pass so they
            # don't also appear as fragmented heading/paragraph blocks.
            table_blocks, excluded_tops = extract_tables_from_page(page, page_num)
            all_blocks.extend(table_blocks)

            # ── 3. Text extraction ────────────────────────────────────────────
            text_chars = [
                c for c in (page.chars or [])
                if c.get('text','').strip()
                and round(c.get('top',0)) not in excluded_tops
            ]

            if not text_chars:
                # Page has no text (e.g. scanned page) — rasterize whole page
                if _PDFTOPPM_OK and _PIL_OK:
                    img = _get_page_image(page_num)
                    if img and _has_content(img, min_ratio=0.02):
                        buf = io.BytesIO()
                        img.save(buf, format='PNG', optimize=True)
                        b64 = base64.b64encode(buf.getvalue()).decode()
                        all_blocks.append({
                            'id': str(uuid.uuid4()), 'type': 'image',
                            'pageNumber': page_num,
                            'x0': 0, 'y0': 0, 'x1': page_w, 'y1': page_h,
                            'mimeType': 'image/png', 'data': b64,
                            '_y': 0,
                            'props': {'source': 'full_page'},
                        })
                continue

            # ── Body font size (mode, weighted, ignoring ornament fonts) ──────
            size_counts: Counter = Counter()
            for c in text_chars:
                fam = get_font_family(c.get('fontname',''))
                if fam not in ('MT2EXA','__DROP__'):
                    sz = round(c.get('size', 10.0), 1)
                    if sz > 0: size_counts[sz] += 1
            body_size: float = (
                size_counts.most_common(1)[0][0] if size_counts else 10.9)

            # ── Group chars by bottom Y (4px tolerance) ───────────────────────
            # Use 'bottom' not 'top' — tall math symbols (√ etc.) have correct
            # bottom coords even when their top coord is displaced.
            raw_lines: dict = {}
            for c in text_chars:
                y = round(c.get('bottom', c.get('top', 0)))
                matched = next((ey for ey in raw_lines if abs(ey-y)<=4), None)
                raw_lines.setdefault(
                    matched if matched is not None else y, []).append(c)

            # ── Merge superscript orphans (standalone 'n', '2', 'S' etc.) ─────
            raw_lines = merge_superscript_orphans(raw_lines, body_size)

            sorted_ys = sorted(raw_lines.keys())
            first_y   = sorted_ys[0]  if sorted_ys else -1
            last_y    = sorted_ys[-1] if sorted_ys else -1

            # ── Collect line spans for visual gap detection ───────────────────
            line_spans: list         = []   # (top, bottom)
            line_spans_with_x: list  = []   # (top, bottom, x0, x1)
            lossy_line_records: list = []   # (top, bottom, x0, x1, is_lossy)

            # ── Process each line → collect metadata + text blocks ────────────
            col_gap = page_w * 0.05  # ~30px column gap threshold
            pending_text_blocks: list = []  # (block_dict, top, bot)

            for y in sorted_ys:
                all_lc = sorted(raw_lines[y], key=lambda c: c.get('x0',0))
                if not all_lc: continue

                for seg_idx, line_chars in enumerate(
                        split_at_column_gaps(all_lc, col_gap)):
                    if not line_chars: continue

                    text, is_deco, orn_loss, math_ch, n_total = \
                        build_line_text(line_chars, x_tol=2.0)

                    if is_deco: continue

                    top_val = min(c.get('top', y) for c in line_chars)
                    bot_val = max(c.get('bottom', y) for c in line_chars)
                    x0_val  = min(c.get('x0', 0) for c in line_chars)
                    x1_val  = max(c.get('x1', c.get('x0',0)) for c in line_chars)

                    # Always record for span/gap detection even if line is lossy
                    line_spans.append((top_val, bot_val))
                    line_spans_with_x.append((top_val, bot_val, x0_val, x1_val))

                    lossy = _is_lossy_line(orn_loss, math_ch, n_total, text)
                    lossy_line_records.append(
                        (top_val, bot_val, x0_val, x1_val, lossy))

                    # Skip text block for lossy lines — they'll be rasterized
                    if lossy:
                        continue

                    if not text: continue

                    # Header/footer removal
                    if y == first_y and is_running_header(text): continue
                    if y in (first_y, last_y) and is_standalone_page_number(text): continue
                    if is_global_noise(text): continue
                    if is_divider(text): continue

                    # ── Classify block ────────────────────────────────────────
                    content_chars = [
                        c for c in line_chars
                        if get_font_family(c.get('fontname',''))
                           not in ('MT2EXA','__DROP__')
                    ]
                    if not content_chars: continue

                    main_chars = [
                        c for c in content_chars
                        if c.get('size',0) >= body_size * 0.80
                    ] or content_chars

                    main_avg = sum(c.get('size', body_size) for c in main_chars) / len(main_chars)
                    fn_lower = ' '.join(c.get('fontname','').lower() for c in content_chars)
                    is_bold  = any(kw in fn_lower for kw in ('medi','bold','black'))
                    is_mono  = any(kw in fn_lower for kw in MONO_KWS)
                    line_color = get_line_color(line_chars)
                    colored    = is_colored_line(line_color)
                    first_x    = line_chars[0].get('x0', 0)

                    block: dict = {
                        'id':         str(uuid.uuid4()),
                        'fontSize':   round(main_avg, 2),
                        'pageNumber': page_num,
                        '_y':         y + seg_idx * 10000,
                        'props':      {},
                    }

                    if is_mono:
                        block.update({'type':'codeBlock', 'content':text})
                    elif colored or main_avg > body_size*1.35 or (
                            is_bold and main_avg > body_size*1.20):
                        level = (1 if main_avg > 14 else 2 if main_avg > 10 else 3) \
                                if colored else \
                                (1 if main_avg > body_size*1.55 else
                                 2 if main_avg > body_size*1.40 else 3)
                        block.update({'type':'heading','content':text,'props':{'level':level}})
                    elif text.startswith('λ ') and first_x < page_w * 0.15:
                        block.update({'type':'bulletListItem','content':text[2:].strip()})
                    elif text.startswith('•') and len(text) > 1:
                        block.update({'type':'bulletListItem','content':text[1:].strip()})
                    elif re.match(r'^[▪▸◦]\s+', text):
                        block.update({'type':'bulletListItem',
                                      'content':re.sub(r'^.\s+','',text).strip()})
                    elif re.match(r'^\d+[.)]\s+\S', text):
                        block.update({'type':'numberedListItem','content':text})
                    else:
                        block.update({'type':'paragraph','content':text})

                    pending_text_blocks.append((block, top_val, bot_val))

            # ── 3. Rasterize display-math zones ──────────────────────────────
            # Group lossy lines into zones, rasterize each zone, then add
            # the non-overlapping text blocks.
            math_zones = build_display_math_zones(lossy_line_records, page_w)

            def _zone_covers(top, bot) -> bool:
                """True if this Y range is inside a math zone (already rasterized)."""
                for (zt, zb, *_) in math_zones:
                    overlap = min(bot, zb) - max(top, zt)
                    if overlap > (bot - top) * 0.4:
                        return True
                return False

            # Emit text blocks that are NOT inside a math zone
            for (blk, top, bot) in pending_text_blocks:
                if not _zone_covers(top, bot):
                    all_blocks.append(blk)

            # Rasterize each math zone
            if math_zones and _PDFTOPPM_OK and _PIL_OK:
                page_img = _get_page_image(page_num)
                if page_img is not None:
                    scale = DPI / 72.0
                    img_w, img_h = page_img.size
                    for (zt, zb, zx0, zx1, _zone_recs) in math_zones:
                        px_top   = max(0, int(zt   * scale) - 4)
                        px_bot   = min(img_h, int(zb  * scale) + 4)
                        px_left  = max(0, int(zx0  * scale) - 4)
                        px_right = min(img_w, int(zx1 * scale) + 4)
                        if px_bot - px_top < 6 or px_right - px_left < 6:
                            continue
                        region = page_img.crop((px_left, px_top, px_right, px_bot))
                        if not _has_content(region, min_ratio=0.003):
                            continue
                        buf = io.BytesIO()
                        region.save(buf, format='PNG', optimize=True)
                        b64 = base64.b64encode(buf.getvalue()).decode()
                        all_blocks.append({
                            'id': str(uuid.uuid4()), 'type': 'image',
                            'pageNumber': page_num,
                            'x0': round(zx0, 1), 'y0': round(zt, 1),
                            'x1': round(zx1, 1), 'y1': round(zb, 1),
                            'mimeType': 'image/png', 'data': b64,
                            '_y': round(zt),
                            'props': {'source': 'math'},
                        })

            # ── 4. Visual region extraction (diagrams, full figures, tables) ──
            # Skip ranges already covered by math zones or embedded images
            math_zone_boxes  = [(zt, zb) for (zt, zb, *_) in math_zones]
            embedded_boxes   = [(page_h - b['y1'], page_h - b['y0'])
                                for b in embedded]
            table_boxes      = [(b['y0'], b['y1']) for b in table_blocks]
            all_skip_boxes   = math_zone_boxes + embedded_boxes + table_boxes

            visual = extract_visual_regions(
                pdf_path, page_num, page_h, page_w,
                line_spans, line_spans_with_x, all_skip_boxes
            )
            all_blocks.extend(visual)

    if pike_doc is not None:
        pike_doc.close()

    # Sort all blocks (text + images) by page then Y position
    all_blocks.sort(key=lambda b: (b.get('pageNumber',0), b.get('_y',0)))

    return merge_fragments(all_blocks)


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({'error': 'Usage: pdf_extractor.py <pdf_path> <start_page> <end_page>'}))
        sys.exit(1)
    try:
        result = extract_blocks(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
        for b in result:
            b.pop('_y', None)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        import traceback
        print(json.dumps({'error': str(exc), 'trace': traceback.format_exc()}))
        sys.exit(1)