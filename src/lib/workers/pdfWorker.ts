import { Worker } from "bullmq";
import dbConnect from "../dbConnect";
import axios from "axios";
import { FileModel, FolderModel } from "@/model";
import * as Y from "yjs";
import { parsePDFStructure, StructuralBlock } from "@/utils/pdf/pdf-structural-parser";
import { redisConnection } from "../bullmq/redis-connection";
import { sanitizeLosslessText } from "@/utils/pdf/pdf-sanitizer";
import { splitIntoTopicChunks } from "@/utils/pdf/pdf-chunker";
import crypto from "crypto";
import { estimateReadingTime } from "@/utils/intelligence/study-planner";
import { buildFolderConceptGraph } from "@/utils/intelligence/concept-graph-builder";
import { detectFilePrerequisites } from "@/utils/intelligence/prerequisite-detector";
import { callGeminiText } from "../ai/flashcards/gemini-client";
import { extractTermsFromBlocks } from "@/utils/intelligence/term-extractor";
import { markTermIndexStale } from "@/lib/workers/workspace-term-index";
import { deriveFilePlainText } from "@/utils/intelligence/plain-text";

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Now that the Python extractor handles CID decoding and sanitization,
 * buildCleanContent is much simpler — it only handles block-type-specific
 * formatting (table markdown, code fences, math wrappers) and YJS assembly.
 *
 * The Python extractor already:
 * - Decoded (cid:N) codes to proper Unicode
 * - Dropped noise lines (page numbers, copyright, etc.)
 * - Detected headings, bullets, numbered lists, code blocks
 * - Merged sentence fragments split by PDF line breaks
 *
 * So we do NOT call sanitizeLosslessText on text content here —
 * doing so would strip valid Unicode math symbols the Python already decoded.
 * We only call it on table cells where raw strings come from string[][] content.
 */

/**
 * buildCleanContent — converts a StructuralBlock into the string content
 * and BlockNote type used for YJS assembly.
 *
 * image  → type "image",     content = data URI (base64)
 * table  → type "paragraph", content = markdown pipe table
 * others → type matches block type, content = plain text
 */
const buildCleanContent = (
    blocks: StructuralBlock[],
): {
    cleanContent: string;
    blockNoteType: string;
} => {
    const blockNoteType = blocks.length === 1 ? blocks[0].type : "paragraph";
    const cleanContent = blocks.map(block => {

        // ── Image block ──────────────────────────────────────────────────────
        if (block.type === "image") {
            // Return data URI so BlockNote can render it inline.
            // The data field holds the raw base64; prepend the mime prefix.
            const mime = block.mimeType ?? "image/png";
            return `data:${mime};base64,${block.data ?? ""}`;
        }

        // ── Table block ──────────────────────────────────────────────────────
        if (block.type === "table") {
            const rows = block.content as string[][];
            if (!rows?.length) return "";
            // Markdown pipe table — header row + separator + data rows
            const header = `| ${rows[0].map(c => sanitizeLosslessText(c || "")).join(" | ")} |`;
            const sep    = `| ${rows[0].map(() => "---").join(" | ")} |`;
            const data   = rows.slice(1)
                .map(row => `| ${row.map(c => sanitizeLosslessText(c || "")).join(" | ")} |`)
                .join("\n");
            return [header, sep, data].filter(Boolean).join("\n");
        }

        // ── Text blocks ──────────────────────────────────────────────────────
        const content = block.content as string;

        if (block.type === "heading") {
            const level = block.props?.level ?? 1;
            return `${"#".repeat(level)} ${content}\n\n`;
        }
        if (block.type === "bulletListItem") return `* ${content}`;
        if (block.props?.isMath) return `$$${content}$$\n\n`;

        return `${content}\n\n`;

    }).join("").trim();

    return { cleanContent, blockNoteType };
};
// ── WORKER ────────────────────────────────────────────────────────────────────

export const initPDFWorker = () => {
    const worker = new Worker(
        "pdf-processing",
        async (job) => {
            const {
                folderId,
                pdfUrl,
                startOffset,
                endOffset,
                title,
            } = job.data;

            await dbConnect();

            try {
                // Validate Cloudinary URL is still reachable before downloading
                try {
                    await axios.head(pdfUrl, { timeout: 5000 });
                } catch {
                    throw new Error(`PDF URL unreachable: ${pdfUrl}`);
                }

                // Cleanup any partial files from a previous failed attempt
                await FileModel.deleteMany({ folderId });
                await FolderModel.findByIdAndUpdate(folderId, {
                    $set: { status: "processing", currentFileCount: 0 },
                });

                // ── 1. Download PDF ───────────────────────────────────────────
                const response = await axios.get(pdfUrl, {
                    responseType: "arraybuffer",
                    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/pdf" },
                });
                const buffer = Buffer.from(response.data);

                // ── 2. Parse all pages via Python extractor ───────────────────
                // Single call for the full startOffset→endOffset range.
                // The Python script batches pdftoppm internally (one subprocess
                // for all pages) so splitting into windows here only adds
                // overhead without any memory benefit.
                const allBlocks: StructuralBlock[] = [];
                const blockPageMap = new Map<string, number>();

                const pageBlocks = await parsePDFStructure(buffer, startOffset, endOffset);
                for (const block of pageBlocks) {
                    blockPageMap.set(block.id, block.pageNumber ?? startOffset);
                    allBlocks.push(block);
                }

                // Notify UI that parsing is complete
                await axios.post(
                    `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/socket/emit`,
                    {
                        workspaceId: job.data.workspaceId,
                        type: "pdf_parse_progress",
                        payload: {
                            folderId,
                            parsedPages:  endOffset - startOffset + 1,
                            totalPages:   endOffset - startOffset + 1,
                            percent:      100,
                        },
                    }
                ).catch(() => {});

                // ── 3. Split into topic chunks ────────────────────────────────
                // startOffset/endOffset already define the content window —
                // no second front-matter filter needed.
                const contentBlocks = allBlocks;
                const chunks = splitIntoTopicChunks(contentBlocks, blockPageMap);

                await FolderModel.findByIdAndUpdate(folderId, {
                    $set: { totalFileCount: chunks.length },
                });

                // Notify UI of actual file count immediately
                await axios.post(
                    `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/socket/emit`,
                    {
                        workspaceId: job.data.workspaceId,
                        type: "pdf_total_files_update",
                        payload: { workspaceId: job.data.workspaceId, folderId, totalFileCount: chunks.length },
                    }
                ).catch(() => {});

                // ── 5. Create one BlockNote file per chunk ────────────────────
                const fileIds: string[] = [];

                for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
                    const chunk = chunks[chunkIdx];

                    const tempDoc = new Y.Doc();
                    const tempFragment = tempDoc.getXmlFragment("document-content");
                    const blockMap: Record<string, any> = {};
                    const blockOrder: string[] = [];

                    for (const sb of chunk.blocks) {

                        const { cleanContent, blockNoteType } = buildCleanContent([sb]);

                        // Skip truly empty blocks
                        if (!cleanContent.trim()) continue;

                        const blockContainer = new Y.XmlElement("blockContainer");
                        blockContainer.setAttribute("id", sb.id);

                        // ── Image block ───────────────────────────────────────
                        if (sb.type === "image") {
                            const innerElt = new Y.XmlElement("image");
                            blockContainer.setAttribute("type", "image");
                            innerElt.setAttribute("url", cleanContent); // data URI
                            innerElt.setAttribute(
                                "caption",
                                `Figure (page ${sb.pageNumber ?? "?"}, source: ${sb.props?.source ?? "unknown"})`
                            );
                            innerElt.setAttribute("showPreview", "true");
                            blockContainer.insert(0, [innerElt]);
                            tempFragment.push([blockContainer]);
                            blockOrder.push(sb.id);

                            const imageLabel = `[Image: page ${sb.pageNumber}, source=${sb.props?.source ?? "unknown"}]`;
                            blockMap[sb.id] = {
                                id:             sb.id,
                                type:           "image",
                                props:          { ...sb.props, url: cleanContent },
                                plainText:      imageLabel,
                                structuredText: imageLabel,
                                updatedAt:      new Date(),
                                contentHash:    crypto
                                    .createHash("sha256")
                                    .update(sb.id)
                                    .digest("hex")
                                    .slice(0, 16),
                            };
                            continue;
                        }

                        // ── Table and all text blocks ─────────────────────────
                        // Tables are rendered as markdown pipe-table inside a paragraph.
                        const resolvedType: string =
                            blockNoteType === "heading"          ? "heading" :
                            blockNoteType === "codeBlock"        ? "codeBlock" :
                            blockNoteType === "bulletListItem"   ? "bulletListItem" :
                            blockNoteType === "numberedListItem" ? "numberedListItem" :
                            "paragraph";

                        const innerElt = new Y.XmlElement(resolvedType);
                        blockContainer.setAttribute("type", resolvedType);

                        if (resolvedType === "heading") {
                            innerElt.setAttribute("level", sb.props?.level?.toString() ?? "2");
                        }
                        if (resolvedType === "codeBlock") {
                            innerElt.setAttribute("language", "text");
                        }

                        innerElt.insert(0, [new Y.XmlText(cleanContent)]);
                        blockContainer.insert(0, [innerElt]);
                        tempFragment.push([blockContainer]);
                        blockOrder.push(sb.id);

                        // AI text: tables → pipe-delimited, math → raw, others → cleanContent
                        const aiText =
                            sb.type === "table"
                                ? (sb.content as string[][])
                                    .map(r => r.join(" | "))
                                    .join("\n")
                                : sb.props?.isMath
                                    ? (sb.content as string)
                                    : cleanContent;

                        blockMap[sb.id] = {
                            id:             sb.id,
                            type:           resolvedType,
                            props:          sb.props ?? {},
                            plainText:      aiText,
                            structuredText: aiText,
                            updatedAt:      new Date(),
                            contentHash:    crypto
                                .createHash("sha256")
                                .update(aiText)
                                .digest("hex")
                                .slice(0, 16),
                        };
                    }

                    // File-level content hash for PDF version diffing
                    const fileContentHashInput = chunk.blocks
                        .map(b => typeof b.content === "string" ? b.content : JSON.stringify(b.content))
                        .join("|");
                    const fileContentHash = crypto
                        .createHash("sha256")
                        .update(fileContentHashInput)
                        .digest("hex")
                        .slice(0, 16);

                    const binaryUpdate = Y.encodeStateAsUpdate(tempDoc);
                    const readingTime = estimateReadingTime(chunk.blocks);

                    const newFile = await FileModel.create({
                        title: chunk.title,
                        folderId,
                        workspaceId: job.data.workspaceId,
                        contentBinary: Buffer.from(binaryUpdate),
                        blocks: blockMap,
                        blockOrder,
                        plainText: deriveFilePlainText(blockMap, blockOrder),
                        iconId: "📄",
                        createdAt: new Date(),
                        lastUpdated: new Date(),
                        contentLastModified: new Date(),
                        contentHash: fileContentHash,
                        readingTimeMinutes: readingTime,
                        source: "pdf",
                    });

                    const terms = extractTermsFromBlocks(blockMap, blockOrder);
                    await FileModel.findByIdAndUpdate(newFile._id, {
                        $set: { terms }
                    });

                    await markTermIndexStale(job.data.workspaceId);
                    fileIds.push(String(newFile._id));

                    await FolderModel.findByIdAndUpdate(folderId, {
                        $push: { files: newFile._id },
                        $set: { currentFileCount: chunkIdx + 1 },
                    });

                    await axios.post(
                        `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/socket/emit`,
                        {
                            workspaceId: job.data.workspaceId,
                            type: "pdf_file_created",
                            payload: {
                                workspaceId: job.data.workspaceId,
                                folderId,
                                _id: newFile._id,
                                title: newFile.title,
                                iconId: "📄",
                                status: "completed",
                                currentFileCount: chunkIdx + 1,
                                totalFiles: chunks.length,
                            },
                        }
                    ).catch((err: any) =>
                        console.error("[PDF Worker] File emit failed:", err.message)
                    );
                }

                // ── 6. Intelligence layer (non-fatal) ─────────────────────────

                try {
                    const graph = await buildFolderConceptGraph(
                        fileIds, 
                        job.data.workspaceId,
                        2,
                        folderId,
                        title,
                    );
                    await FolderModel.findByIdAndUpdate(folderId, { $set: { conceptGraph: graph } });
                } catch (err) {
                    console.error("[PDF Worker] Concept graph failed (non-fatal):", err);
                }

                try {
                    const prereqs = await detectFilePrerequisites(fileIds, job.data.workspaceId);
                    await Promise.all(
                        prereqs.map(({ fileId, prerequisites }) =>
                            FileModel.findByIdAndUpdate(fileId, { $set: { prerequisites } })
                        )
                    );
                } catch (err) {
                    console.error("[PDF Worker] Prerequisites failed (non-fatal):", err);
                }

                // ── 7. Finalize folder ─────────────────────────────────────────
                await FolderModel.findByIdAndUpdate(folderId, {
                    $set: { status: "completed", files: fileIds },
                });

                await axios.post(
                    `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/socket/emit`,
                    {
                        workspaceId: job.data.workspaceId,
                        type: "pdf_folder_completed",
                        payload: { workspaceId: job.data.workspaceId, folderId },
                    }
                );
            } catch (error) {
                console.error("[PDF Worker] Error:", error);

                await FolderModel.findByIdAndUpdate(folderId, { $set: { status: "error" } });

                await axios.post(
                    `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/socket/emit`,
                    {
                        workspaceId: job.data.workspaceId,
                        type: "pdf_folder_error",
                        payload: { folderId },
                    }
                ).catch(() => {});

                throw error;
            }
        },
        {
            connection: redisConnection,
            lockDuration: 300000,  // 5 minutes max per job
            lockRenewTime: 60000,  // renew lock every minute
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        }
    );

    worker.on("completed", job => console.log(`[PDF Worker] Job ${job.id} completed`));
    worker.on("failed", (job, err) => console.error(`[PDF Worker] Job failed:`, err));
};