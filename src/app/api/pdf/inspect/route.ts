/**
 * RESOURCE: PDF Inspector
 * -----------------------
 * Endpoint: POST /api/pdf/inspect
 * Role: Fast-scans a PDF to extract metadata for the upload form preview.
 * This runs immediately when user selects a file - before they click Generate.
 * 
 * WHAT IT RETURNS:
 * - isDigital: false if scanned image PDF (unsupported)
 * - totalPages, startOffset, endOffset: page range for real content
 * - suggestedFileCount: ~estimate shown in UI as "up to X files"
 * - pdfTypes: book/research/slides/notes - used by generate route
 * - title, author: from PDF metadata
 * 
 * NOTE: suggestedFileCount is delibrately an estimate based on page count. The real file count
 * is determined during generation by topic-aware chunking.
 */

import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

// @ts-ignore
import pdf from 'pdf-parse-fork';
import { findDocumentBoundaries } from "@/utils/pdf/pdf-finder";
import { detectPDFType } from "@/utils/pdf/pdf-type-detector";

export const runtime = 'nodejs';

export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        // Toggle value
        const excludeIntro = formData.get("excludeIntro") === "true";

        if(!file){
            return errorResponse(
                "No file uploaded",
                400,
                400,
            );
        }

        // Convert File to Buffer for pdf-parse
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Robust calling: Check if it's a function or nested in .default
        const parsePdf = typeof pdf === 'function' ? pdf : (pdf as any).default;


        /**
         * DIGITAL VS SCANNED DETECTION 
         * We scan upto 200 pages in one go to handle both Digital detection and Boundary 
         * detection without double-processing the buffer.
         */

        const inspectionData = await parsePdf(buffer, {
            max: 100,
            pagerender: (pageData: any) => {
                return pageData.getTextContent().then((textContent: any) => {
                    let text = textContent.items.map((item: any) => item.str).join(' ');

                    return `---PAGE SPLIT---${text}`;
                });
            }
        });

        const totalPages = inspectionData.numpages;
        const firstPagesText = inspectionData.text.substring(0, 2000); //sample for digital pdf

        // If the first 5 pages have almost no text, it's likely a scanned image PDF
        const isDigital = firstPagesText.trim().length > 50;

        if(!isDigital){
            const data = {
                isDigital: false,
            }
            return successResponse(
                "Scanned PDF detected",
                data,
                200,
                200,
            );
        }

        /**
         * OFFSET Calculation (if toggle is ON)
         */
        

        let startOffset = 1;
        let endOffset = totalPages;

        if(excludeIntro){
           const boundaries = findDocumentBoundaries(
                inspectionData.text,
                totalPages
            );
            startOffset = boundaries.startOffset;
            endOffset = boundaries.endOffset;
        }
        
        const activePageCount = endOffset - startOffset + 1;
        
        const metadata = inspectionData.info;

        // ---- PDF TYPE DETECTION -----
        // Detect book/research/slides/notes so generate route can store it
        const avgCharsPerPage = inspectionData.text.length / totalPages;
        const pdfTypeResult = detectPDFType(
            totalPages,
            inspectionData.text,
            avgCharsPerPage
        );

        let divider = 20;
        if(pdfTypeResult.type === "book") divider = 20;
        if(pdfTypeResult.type === "slides") divider = 40;
        const suggestedFileCount = Math.ceil(activePageCount / divider);
        // Calculate suggested files (e.g. 1 File per 20 pages)
    
        const data = {
           isDigital: true,
           title: metadata.title || file.name.replace(".pdf", ""),
           author: metadata.author || "Unknown",
           totalPages: totalPages,       //Raw PDF
           activePageCount: activePageCount, //Count after exclusion
           startOffset: startOffset,
           endOffset: endOffset,
           suggestedFileCount: suggestedFileCount, 
           fileSize: file.size,
           pdfType: pdfTypeResult.type,
           pdfTypeConfidence: pdfTypeResult.confidence
        };
        return successResponse(
            "Successfully parsed the pdf",
            data,
            200,
            200
        )
    } catch (error: any) {
        console.error("[PDF INSPECT ERROR]: ",error);
        return errorResponse(
            "Failed to parse PDF metadata",
            500,
            500,
        );
    }
}