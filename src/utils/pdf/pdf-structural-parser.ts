import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface StructuralBlock {
    id: string;
    type: "heading" | "paragraph" | "bulletListItem" | "numberedListItem" | "codeBlock" | "image" | "table";
    content?: string | string[][];
    data?: string;
    mimeType?: string;
    fontSize?: number;
    props?: Record<string, any>;
    pageNumber?: number;
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
}

/**
 * Extracts structural blocks using an external Python script (pdfplumber).
 *
 * Large page ranges are split into smaller chunks before being handed to the
 * Python subprocess. pdf_extractor.py does heavy per-page work (rasterization,
 * char-level font correction, table/image/math-zone detection), and free-tier
 * Render instances only have 0.1 CPU -- a single call covering 300+ pages
 * reliably blows past any reasonable timeout. Chunking keeps each subprocess
 * call fast and means a slow/failing page range doesn't sink the whole job.
 */

// Max pages processed per subprocess call.
const PAGES_PER_CHUNK = 20;
const CHUNK_TIMEOUT_MS = 120_000; // 2 min per chunk is plenty for ~20 pages

export const parsePDFStructure = async (
    buffer: Buffer,
    startPage: number,
    endPage: number,
): Promise<StructuralBlock[]> => {

    const tmpDir = os.tmpdir();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpPdf = path.join(tmpDir, `input_${uid}.pdf`);

    const scriptPath = path.join(
        process.cwd(),
        "scripts",
        "pdf_extractor.py"
    );
    const pythonPath = path.join(
        process.cwd(),
        "venv",
        "bin",
        "python3"
    );

    const runChunk = (chunkStart: number, chunkEnd: number): StructuralBlock[] => {
        const stdout = execSync(
            `"${pythonPath}" "${scriptPath}" "${tmpPdf}" "${chunkStart}" "${chunkEnd}"`,
            {
                maxBuffer: 100 * 1024 * 1024,
                timeout: CHUNK_TIMEOUT_MS,
                encoding: "utf8",
                stdio: ['pipe', 'pipe', 'inherit'],
            }
        );

        if (!stdout || stdout.trim() === "") {
            throw new Error(`Python script returned empty output for pages ${chunkStart}-${chunkEnd}.`);
        }

        const parsed = JSON.parse(stdout);

        if (parsed?.error) {
            throw new Error(`${parsed.error} (pages ${chunkStart}-${chunkEnd})`);
        }

        return parsed as StructuralBlock[];
    };

    try {
        fs.writeFileSync(tmpPdf, buffer);

        const allBlocks: StructuralBlock[] = [];

        for (let chunkStart = startPage; chunkStart <= endPage; chunkStart += PAGES_PER_CHUNK) {
            const chunkEnd = Math.min(chunkStart + PAGES_PER_CHUNK - 1, endPage);
            console.log(`[PDF Worker] Processing pages ${chunkStart}-${chunkEnd} of ${startPage}-${endPage}...`);
            const chunkBlocks = runChunk(chunkStart, chunkEnd);
            allBlocks.push(...chunkBlocks);
        }

        return allBlocks;
    } catch (error: any) {
        console.error(`[PDF STRUCTURAL PARSER ERROR] error ${startPage} - ${endPage}: `, error);
        throw new Error(`parsePDFStructured: ${error.message}`);
    } finally {
        // cleanup the temporary PDF file
        try {
            if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
        } catch {}
    }
};