
// // import path from "path";

// // // Manually point to the legacy worker file for the Node.js environment
// // // const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');

// // // Assign the worker
// // // pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// // // @ts-ignore
// // const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// // /**
// //  * CONFIGURATION FOR NODE.JS WORKER
// //  * We point directly to the physical file in node_modules
// //  */
// // if (typeof window === "undefined") {
// //     const path = require("path");
// //     // Resolve the absolute path to the worker file
// //     const workerPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.js");
// //     pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
// // }
// // export interface StructuralBlock {
// //     id: string;
// //     type: "heading" | "paragraph" | "bulletListItem" | "codeBlock" | "image" | "table";
// //     content: string | string[][];
// //     fontSize?: number;
// //     props?: any;
// // }

// // export const parsePDFStructure = async (
// //     buffer: Buffer,
// //     startPage: number,
// //     endPage: number
// // ): Promise<StructuralBlock[]> => {
// //     const data = new Uint8Array(buffer);
// //     const loadingTask = pdfjs.getDocument({ 
// //         data,
// //         cMapUrl: path.join(
// //             process.cwd(),
// //             "node_modules/pdfjs-dist/cmaps/"
// //         ),
// //         cMapPacked: true,
// //     });
// //     const pdfDoc = await loadingTask.promise;

// //     let finalBlocks: StructuralBlock[] = [];
// //     // let finalBlocks: any = null;

// //     // Iterate only through the assigned 20-page window
// //     for(let i = startPage; i <= Math.min(endPage, pdfDoc.numPages); i++){
// //         const page = await pdfDoc.getPage(i);
        
// //         // 1. IMAGE EXTRACTION
// //         const ops = await page.getOperatorList();
// //         for(let j = 0;j < ops.fnArray.length; j++){
// //             if(ops.fnArray[j] === pdfjs.OPS.paintImageXObject){
// //                 finalBlocks.push({
// //                     id: crypto.randomUUID(),
// //                     type: "image",
// //                     content: "Embedded Image",
// //                     props: { imageKey: ops.argsArray[j][0]},
// //                 });
// //             }
// //         }

// //         // 2. TEXT & TABLE RECONSTRUCTION
// //         const textContent = await page.getTextContent();
// //         const rows: Record<number, any[]> = {};

// //         // Grouping logic (using Y-coordinate)
// //         textContent.items.forEach((item: any) => {
// //             const y = Math.round(item.transform[5]);
// //             if(!rows[y]) rows[y] = [];
// //             rows[y].push(item);
// //         });

// //         const sortedY = Object.keys(rows).map(Number).sort((a,b) => b-a);
// //         let rowIdx = 0;
// //         while(rowIdx < sortedY.length){
// //             const y = sortedY[rowIdx];
// //             const items = rows[y].sort((a,b) => a.transform[4] - b.transform[4]);

// //             // check for tables using X- Gap logic
// //             if(items.length > 1 && hasLargeXGaps(items)){
// //                 const tableData: string[][] = [];
// //                 while(rowIdx < sortedY.length && hasLargeXGaps(rows[sortedY[rowIdx]])){
// //                     const rItems = rows[sortedY[rowIdx]].sort((a,b) => a.transform[4] - b.transform[4]);
// //                     tableData.push(rItems.map(it => it.str.trim()));
// //                     rowIdx++;
// //                 }
// //                 finalBlocks.push({
// //                     id: crypto.randomUUID(),
// //                     type: "table",
// //                     content: tableData,
// //                     props: {
// //                         rows:  tableData.length,
// //                         cols: tableData[0].length || 0,
// //                     }
// //                 });
// //             }else{
// //                 // Classify Text using Font/Indentation logic
// //                 const fullText = items.map(it => it.str).join(" ").trim();
// //                 if(fullText){
// //                     finalBlocks.push(classifyBlock(items[0], fullText));
// //                 }
// //                 rowIdx++;
// //             }
// //         }
// //     }
// //     return finalBlocks;
// // }

// // function hasLargeXGaps(items: any[]){
// //     if(!items || items.length < 2) return false;
// //     for(let i = 1;i < items.length; i++){
// //         const gap = items[i].transform[4] - (items[i-1].transform[4] + (items[i-1].width || 20));
// //         if(gap > 25) return true;
// //     }
// //     return false;
// // }

// // function classifyBlock(firstItem: any, text: string): StructuralBlock{
// //     const fontSize = Math.round(firstItem.transform[0]);
// //     const fontName = (firstItem.fontName || "").toLowerCase();
// //     const xPos = firstItem.transform[4];

// //     let type: any = "paragraph";
// //     if(fontName.includes("mono") || fontName.includes("courier") || fontName.includes("consola")){ 
// //        return {
// //         id: crypto.randomUUID(),
// //         type: "codeBlock",
// //         content: text,
// //         fontSize,
// //        }
// //     }
// //     else if(fontSize > 13){
// //        return {
// //         id: crypto.randomUUID(),
// //         type: "heading",
// //         content: text,
// //         props: {
// //             level: fontSize > 18 ? 1 : 2
// //         }
// //        };

// //     }
   
// //     // Detect Math formula
// //     const isMath = fontName.includes("math") || fontName.includes("cmsy") || fontName.includes("cmmi");
// //     if(isMath || (xPos > 100 && text.length < 50)){
// //         // Treating as a paragraph   
// //         return {
// //             id: crypto.randomUUID(),
// //             type: "paragraph",
// //             content: text,
// //             props: {
// //                 isMath: true,
// //             }
// //         };
// //     }

// //     // Default to Paragraph or Bullet
// //     const isBullet = text.match(/^(\d+\.|•|-|\*)/) || xPos > 85;

// //     return {
// //         id: crypto.randomUUID(),
// //         type: isBullet ? "bulletListItem" : "paragraph",
// //         content: text,
// //     };
// // } 

// import path, { join } from "path";
// import { detectColumnBoundary } from "./pdf-column-detector";
// // @ts-ignore
// import pdfParse from "pdf-parse-fork";

// const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// if(typeof window === "undefined"){
//     const workerPath = path.join(
//         process.cwd(),
//         "node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
//     );
//     pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
// }

// export interface StructuralBlock{
//     id: string;
//     type: "heading" | "paragraph" | "bulletListItem" | "numberedListItem" | "codeBlock" | "image" | "table";
//     content: string | string[][];
//     fontSize?: number;
//     props?: Record<string, any>;
//     pageNumber?: number;
// }

// interface RawItem {
//     str: string;
//     transform: number[];
//     width: number;
//     fontName: string;
//     height: number;
// }

// // --- FONT SIZE ---
// // transform = [a,b,c,d,x,y]
// // Rendered font size = sqrt(a² + b²).
// function getFontSize(item: RawItem): number{
//     const a = item.transform[0];
//     const b = item.transform[1];
//     return Math.round(Math.sqrt( a*a + b*b ));
// }

// // --- BODY FONT SIZE DETECTION ---
// // The body font size is the MODE (most frequent) font size on the page.
// // This let heading detection work relatively, not with a hardcoded threshold.
// function detectBodyFontSize(items: RawItem[]): number{
//     const freq: Record<number, number> = {};
//     for(const item of items){
//         const fs = getFontSize(item);
//         freq[fs] = (freq[fs] || 0) + 1;
//     }

//     let maxCount = 0;
//     let bodySize = 11; //fallback
//     for(const [ size, count] of Object.entries(freq)){
//         if(count > maxCount){
//             maxCount = count;
//             bodySize = Number(size);
//         }
//     }
//     return bodySize;
// }

// // --- RUNNING HEADER/FOOTER DETECTION ---
// // Collect all Y-positions across all pages
// // If the same Y (±2px) appears on 3+ pages -> it's a running header or footer
// async function detectRepeatedYPosition(
//     pdfDoc: any,
//     startPage: number,
//     endPage: number
// ): Promise<Set<number>>{
//     const yFrequency: Record<number, number> = {};
//     const pageCount = Math.min(endPage, pdfDoc.numPages);

//     for(let i = startPage; i <= pageCount; i++){
//         const page = await pdfDoc.getPage(i);
//         const textContent = await page.getTextContent();
//         const seenOnThisPage = new Set<number>();

//         for(const item of textContent.items as RawItem[]){
//             const y = Math.round(item.transform[5]);

//             // Only count once per page
//             if(!seenOnThisPage.has(y)){
//                 seenOnThisPage.add(y);
//                 yFrequency[y] = (yFrequency[y] || 0) + 1;
//             }
//         }
//     }

//     // Any Y that appears on 3+ pages = repeated element (header/footer)
//     const totalPages = pageCount - startPage + 1;
//     const threshold = Math.min(3, Math.ceil(totalPages * 0.4));
//     const repeatedY = new Set<number>();

//     for(const [ y, count ] of Object.entries(yFrequency)){
//         if(count >= threshold){
//             // Mark a ±3px band around this Y
//             const yNum = Number(y);
//             for(let delta = -3; delta <= 3; delta++){
//                 repeatedY.add(yNum + delta);
//             }
//         }
//     }

//     return repeatedY;
// }


// // --- TABLE DETECTION
// // A real table row needs: 
// // 1. 3+ items (not just 2 words with a space)
// // 2. Large X-gaps between them
// // 3. At least 2 consecutive rows that match this pattern
// function hasLargeXGaps(items: RawItem[]):boolean{
//     if(!items || items.length < 3) return false; //raised from 2 to 3
//     let gapCount = 0;
//     for(let i = 1; i < items.length; i++){
//         const prevEnd = items[i - 1].transform[4] + (items[i - 1].width || 20);
//         const gap = items[i].transform[4] - prevEnd;
//         if(gap > 30) gapCount++; //tightened from 25 to 30
//     }

//     return gapCount >= 2; //need at least 2 large gaps (3+ columns)
// }


// // --- NOISE LINES ---
// // Drop lines that are clearly noise regardless of position:
// // - Pure page numbers
// // - Copyright lines
// // - DOI strings
// // - Lines that are only whitespaces/punctuation
// function isNoiseLine(text: string):boolean{
//     const t = text.trim();
//     if(t.length === 0) return true;
//     if(t.length < 3) return true;                               // single char/symbol orphan
//     if (/^\d+$/.test(t)) return true;                         // standalone page number
//     if (/^[ivxlcdmIVXLCDM]+$/.test(t)) return true;          // roman numeral page number
//     if (/©|copyright|all rights reserved/i.test(t)) return true;
//     if (/^doi\s*:/i.test(t)) return true;
//     if (/^(isbn|issn)\s*[\d\-]+/i.test(t)) return true;
//      // Short * prefixed lines are figure caption fragments or math display items
//     if (/^\*\s*.{0,40}$/.test(t)) return true;
//     return false; 
// }

// // --- Drop decorative/divider lines ---
// function isDividerLine(text: string): boolean{
//     const t = text.trim();
//     // Lines that are only dashes, asterisks, dots, or underscores
//     return /^[-─═*•·\._ ]{3,}$/.test(t);
// }

// // --- BLOCK CLASSIFICATION ---
// function classifyBlock(
//     items: RawItem[],
//     fullText: string,
//     bodyFontSize: number, //median font size of the page, passed in
// ):StructuralBlock{
//     const firstItem = items[0];
//     const fontSize = getFontSize(firstItem);
//     const fontName = (firstItem.fontName || "").toLowerCase();
//     const xPos = firstItem.transform[4];

//     // Code block: monospace font
//     if(
//         fontName.includes("mono") ||
//         fontName.includes("courier") ||
//         fontName.includes("consol") ||
//         fontName.includes("lucida console") ||
//         fontName.includes("inconsolata")
//     ){
//         return {
//             id: crypto.randomUUID(),
//             type: "codeBlock",
//             content: fullText,
//             fontSize,
//         };
//     }

//     // Heading: font meaningfully larger than body text
//     // using relative threshold instead of fixed > 13 so it worked across PDFs
//     if(fontSize > bodyFontSize * 1.2){
//         return {
//             id: crypto.randomUUID(),
//             type: "heading",
//             content: fullText,
//             fontSize,
//             props: {
//                 level: fontSize > bodyFontSize * 1.6 
//                 ? 1 : fontSize > bodyFontSize * 1.3 ? 2 : 3,
//             },
//         };
//     }

//     // Math: detected by font name
//     const isMathFont = 
//         fontName.includes("math") || 
//         fontName.includes("cmsy") ||
//         fontName.includes("cmmi") ||
//         fontName.includes("cmr") ||
//         fontName.includes("stix") ||
//         fontName.includes("mtmi");

//     if(isMathFont){
//         return {
//             id: crypto.randomUUID(),
//             type: "paragraph",
//             content: fullText,
//             fontSize,
//             props:{
//                 isMath: true
//             },
//         };
//     }

//     //  Numbered list: "1. text" or "1) text"  
//     if (/^\d+[\.\)]\s+\S/.test(fullText)) {
//         return {
//              id: crypto.randomUUID(), 
//              type: "numberedListItem", 
//              content: fullText, 
//              fontSize 
//         };
//     }

//     // Bullet list: ONLY explicit bullet chars — NOT * because that's also math/footnote
//     if (/^[•▪▸◦]\s+/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "bulletListItem", 
//             content: fullText, 
//             fontSize 
//         };
//     }

//     // Dash bullets are ok but only if followed by a space and word character
//     if (/^[-–]\s+\w/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "bulletListItem", 
//             content: fullText, 
//             fontSize 
//         };
//     }

//     // Drop * prefixed short lines — these are almost always math fragments or captions
//     // NOT real bullet points
//     if (/^\*\s*/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "paragraph", 
//             content: fullText.replace(/^\*\s*/, "").trim(), 
//             fontSize 
//         };
//     }

//     // Indented short line without sentence-ending punctuation = sub-item
//     if(xPos > 90 && fullText.length < 120 && !/[.!?]\s*$/.test(fullText)){
//         return {
//             id: crypto.randomUUID(),
//             type: "bulletListItem",
//             content: fullText,
//             fontSize,
//         };
//     }
//     return {
//         id: crypto.randomUUID(),
//         type: "paragraph",
//         content: fullText,
//         fontSize
//     }
// }



// function mergeFragmentedParagraph(
//     blocks: StructuralBlock[]
// ): StructuralBlock[]{
//     const merged: StructuralBlock[] = [];
    
//     for(const block of blocks){
//         const prev = merged[merged.length - 1];

//         const isFragment = 
//             block.type === "paragraph" &&
//             typeof block.content === "string" &&
//             block.content.length < 120 &&                          // short line
//             !/[.!?]\s*$/.test(block.content);                   // doesn't end a sentence

//         const prevIsMergeable =
//             prev &&
//             prev.type === "paragraph" &&
//             typeof prev.content === "string" &&
//             !/[.!?:]\s*$/.test(prev.content);    

//         if(isFragment && prevIsMergeable){
//             // Merge into previous block - remove trailing hyphen if word was hyphenated
//             const prevText = (prev.content as string).replace(/-\s*$/, "");
//             const joined = prevText.endsWith("-")
//                 ? prevText + block.content
//                 : prevText + " " + block.content;
//             prev.content = joined;
//         }else{
//             merged.push({ ...block});
//         }
//     }
//     return merged;
// }



// // --- MAIN EXPORT ---
// export const parsePDFStructure = async (
//     buffer: Buffer,
//     startPage: number,
//     endPage: number,
// ): Promise<StructuralBlock[]> => {
//      const seenImageKeys = new Set<string>();
//     const data = new Uint8Array(buffer);
//     const loadingTask = pdfjs.getDocument({
//         data,
//         cMapUrl: path.join(process.cwd(), "node_modules/pdfjs-dist/cmaps/"),
//         cMapPacked: true,
//     });

//     const pdfDoc = await loadingTask.promise;

//     // Pass 1: detect running headers/footers across the page range
//     const repeatedY = await detectRepeatedYPosition(pdfDoc, startPage, endPage);

//     const finalBlocks: StructuralBlock[] = [];

//     // Pass 2: extract and classify content
//     for(let i = startPage; i <= Math.min(endPage, pdfDoc.numPages); i++ ){
//         const page = await pdfDoc.getPage(i);
//         const rawPageBlocks: StructuralBlock[] = [];
        
//         // Image 
       
//         const ops = await page.getOperatorList();
//         for(let j = 0; j < ops.fnArray.length; j++){
//             if(ops.fnArray[j] === pdfjs.OPS.paintImageXObject){
//                 const imageKey = ops.argsArray[j][0];

//                 // Skip image we've already seen - they're header/footer logos
//                 if(seenImageKeys.has(imageKey)) continue;
//                 seenImageKeys.add(imageKey);
//                 rawPageBlocks.push({
//                     id: crypto.randomUUID(),
//                     type: "image",
//                     content: "Embedded Image",
//                     props: {
//                         imageKey,
//                     },
//                     pageNumber: i,
//                 });
//             }
//         }

//         // Text
//         const textContent = await page.getTextContent();
//         const allItems = textContent.items as RawItem[];

//         // Detect body font size for this page
//         const bodyFontSize = detectBodyFontSize(allItems);
//         const columnInfo = detectColumnBoundary(allItems);

//         // Group items by Y-coordinates (same row = same Y ±1px)
//         const rows: Record<number, RawItem[]> = {};
//         for(const item of allItems){
//             const y = Math.round(item.transform[5]);

//             // Drop items at repeated Y position (headers/footers)
//             if(repeatedY.has(y)) continue;

//             // For multi-column pages, encode column into the key
//             // Left coulmn uses y as-is, right column uses y + 100000 as key
//             // This ensures left and right column rows never merge
//             let rowKey: number;
//             if(columnInfo.isMultiColumn && columnInfo.splitX){
//                 const isRightColumn = item.transform[4] > columnInfo.splitX;
//                 rowKey = isRightColumn ? y + 100000 : y;
//             }else{
//                 rowKey = y;
//             }

//             const matchingY = Object.keys(rows)
//                 .map(Number)
//                 .find(key => Math.abs(key - rowKey) <= 3);

//             const key = matchingY !== undefined ? matchingY : rowKey;
//             if(!rows[key]) rows[key] = [];
//             rows[key].push(item);
//         }

//         const sortedY = Object.keys(rows)
//             .map(Number)
//             .sort((a,b) => {
//                 const aCol = a >= 100000 ? 1 : 0;
//                 const bCol = b >= 100000 ? 1 : 0;
//                 if(aCol !== bCol) return aCol - bCol;   //left column first
//                 const aY = a >= 100000 ? a - 100000 : a;
//                 const bY = b >= 100000 ? b - 100000 : b;
//                 return bY - aY;                          //top to bottom within column
//             })

//         let rowIdx = 0;
//         while(rowIdx < sortedY.length){
//             const y = sortedY[rowIdx];
//             const items = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);

//             // Table detection: need current AND next row to both look like table rows
//             if(
//                 hasLargeXGaps(items) &&
//                 rowIdx + 1 < sortedY.length &&
//                 hasLargeXGaps(rows[sortedY[rowIdx + 1]])
//             ){
//                 const tableData: string[][] = [];
//                 while(
//                     rowIdx < sortedY.length &&
//                     hasLargeXGaps(rows[sortedY[rowIdx]])
//                 ){
//                     const rItems = rows[sortedY[rowIdx]].sort(
//                         (a, b) => a.transform[4] - b.transform[4]
//                     );
//                     tableData.push(rItems.map((it) => it.str.trim()).filter(Boolean));
//                     rowIdx++;
//                 }

//                 if(tableData.length >= 2){
//                     rawPageBlocks.push({
//                         id: crypto.randomUUID(),
//                         type: "table",
//                         content: tableData,
//                         props: {
//                             rows: tableData.length,
//                             cols: tableData[0].length || 0,
//                         },
//                     });
//                 }
//             }else{
//                 // const fullText = items.map((it) => it.str).join(" ").trim();
//                 const fullText = items.map((it) => {
//                     return it.str;
//                 }).join(" ").trim();
//                 if(fullText && !isNoiseLine(fullText)){
//                     rawPageBlocks.push({
//                         ...classifyBlock(items, fullText, bodyFontSize),
//                         pageNumber: i,
//                     });
//                 }
//                 rowIdx++;
//             }
//         }

//         // --- POST PROCESSING PER PAGE ---

//         // 1. Drop decorative divider lines
//         let pageBlocks = rawPageBlocks.filter((b) =>{
//             if(typeof b.content !== "string") return true; //always keep tables
//             return !isDividerLine(b.content as string);
//         });

//         // 2. Merge fragmented lines back into full paragraphs
//         pageBlocks = mergeFragmentedParagraph(pageBlocks);

//         finalBlocks.push(...pageBlocks);
//     }

//     return finalBlocks;
// }

// export async function extractPageTextWithCIDs(
//     buffer: Buffer,
//     pageNum: number,
// ): Promise<string>{
//     const result = await pdfParse(buffer, {
//         max: pageNum,
//         pageRender: (pageData: any) => {
//             return pageData.getTextContent({
//                 normalizeWhitespace: false,
//                 disableCombineTextItems: false
//             }).then((textContent: any) => {
//                 // Use x-position gaps to infer word space
//                 const items = textContent.items;
//                 if(!items || items.length === 0) return "\f";

//                 let text = "";
//                 let lastX1 = -1;
//                 let lastY = -1;

//                 for(const item of items){
//                     const x0 = item.transform[4];
//                     const y = Math.round(item.transform[5]);

//                     if(lastY !== -1 && Math.abs(y - lastY) > 5){
//                         text += "\n";
//                         lastX1 = -1;
//                     }

//                     // Insert space if gap between previous item end and this item start > 2px
//                     if(lastX1 >= 0 && x0 - lastX1 > 2.0){
//                         text += " ";
//                     }

//                     text += item.str;
//                     lastX1 = x0 + (item.width || 0);
//                     lastY = y;
//                 }

//                 return text + "\f";
//             });
//         },
//     });

//     // Get only the last page's text (pages are separated by \f)
//     const pages = result.text.split("\f").filter((p: string) => p.trim().length > 0);
//     return pages[pages.length - 1] || "";
// }

// // import path from "path";

// // // Manually point to the legacy worker file for the Node.js environment
// // // const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');

// // // Assign the worker
// // // pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// // // @ts-ignore
// // const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// // /**
// //  * CONFIGURATION FOR NODE.JS WORKER
// //  * We point directly to the physical file in node_modules
// //  */
// // if (typeof window === "undefined") {
// //     const path = require("path");
// //     // Resolve the absolute path to the worker file
// //     const workerPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.js");
// //     pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
// // }
// // export interface StructuralBlock {
// //     id: string;
// //     type: "heading" | "paragraph" | "bulletListItem" | "codeBlock" | "image" | "table";
// //     content: string | string[][];
// //     fontSize?: number;
// //     props?: any;
// // }

// // export const parsePDFStructure = async (
// //     buffer: Buffer,
// //     startPage: number,
// //     endPage: number
// // ): Promise<StructuralBlock[]> => {
// //     const data = new Uint8Array(buffer);
// //     const loadingTask = pdfjs.getDocument({ 
// //         data,
// //         cMapUrl: path.join(
// //             process.cwd(),
// //             "node_modules/pdfjs-dist/cmaps/"
// //         ),
// //         cMapPacked: true,
// //     });
// //     const pdfDoc = await loadingTask.promise;

// //     let finalBlocks: StructuralBlock[] = [];
// //     // let finalBlocks: any = null;

// //     // Iterate only through the assigned 20-page window
// //     for(let i = startPage; i <= Math.min(endPage, pdfDoc.numPages); i++){
// //         const page = await pdfDoc.getPage(i);
        
// //         // 1. IMAGE EXTRACTION
// //         const ops = await page.getOperatorList();
// //         for(let j = 0;j < ops.fnArray.length; j++){
// //             if(ops.fnArray[j] === pdfjs.OPS.paintImageXObject){
// //                 finalBlocks.push({
// //                     id: crypto.randomUUID(),
// //                     type: "image",
// //                     content: "Embedded Image",
// //                     props: { imageKey: ops.argsArray[j][0]},
// //                 });
// //             }
// //         }

// //         // 2. TEXT & TABLE RECONSTRUCTION
// //         const textContent = await page.getTextContent();
// //         const rows: Record<number, any[]> = {};

// //         // Grouping logic (using Y-coordinate)
// //         textContent.items.forEach((item: any) => {
// //             const y = Math.round(item.transform[5]);
// //             if(!rows[y]) rows[y] = [];
// //             rows[y].push(item);
// //         });

// //         const sortedY = Object.keys(rows).map(Number).sort((a,b) => b-a);
// //         let rowIdx = 0;
// //         while(rowIdx < sortedY.length){
// //             const y = sortedY[rowIdx];
// //             const items = rows[y].sort((a,b) => a.transform[4] - b.transform[4]);

// //             // check for tables using X- Gap logic
// //             if(items.length > 1 && hasLargeXGaps(items)){
// //                 const tableData: string[][] = [];
// //                 while(rowIdx < sortedY.length && hasLargeXGaps(rows[sortedY[rowIdx]])){
// //                     const rItems = rows[sortedY[rowIdx]].sort((a,b) => a.transform[4] - b.transform[4]);
// //                     tableData.push(rItems.map(it => it.str.trim()));
// //                     rowIdx++;
// //                 }
// //                 finalBlocks.push({
// //                     id: crypto.randomUUID(),
// //                     type: "table",
// //                     content: tableData,
// //                     props: {
// //                         rows:  tableData.length,
// //                         cols: tableData[0].length || 0,
// //                     }
// //                 });
// //             }else{
// //                 // Classify Text using Font/Indentation logic
// //                 const fullText = items.map(it => it.str).join(" ").trim();
// //                 if(fullText){
// //                     finalBlocks.push(classifyBlock(items[0], fullText));
// //                 }
// //                 rowIdx++;
// //             }
// //         }
// //     }
// //     return finalBlocks;
// // }

// // function hasLargeXGaps(items: any[]){
// //     if(!items || items.length < 2) return false;
// //     for(let i = 1;i < items.length; i++){
// //         const gap = items[i].transform[4] - (items[i-1].transform[4] + (items[i-1].width || 20));
// //         if(gap > 25) return true;
// //     }
// //     return false;
// // }

// // function classifyBlock(firstItem: any, text: string): StructuralBlock{
// //     const fontSize = Math.round(firstItem.transform[0]);
// //     const fontName = (firstItem.fontName || "").toLowerCase();
// //     const xPos = firstItem.transform[4];

// //     let type: any = "paragraph";
// //     if(fontName.includes("mono") || fontName.includes("courier") || fontName.includes("consola")){ 
// //        return {
// //         id: crypto.randomUUID(),
// //         type: "codeBlock",
// //         content: text,
// //         fontSize,
// //        }
// //     }
// //     else if(fontSize > 13){
// //        return {
// //         id: crypto.randomUUID(),
// //         type: "heading",
// //         content: text,
// //         props: {
// //             level: fontSize > 18 ? 1 : 2
// //         }
// //        };

// //     }
   
// //     // Detect Math formula
// //     const isMath = fontName.includes("math") || fontName.includes("cmsy") || fontName.includes("cmmi");
// //     if(isMath || (xPos > 100 && text.length < 50)){
// //         // Treating as a paragraph   
// //         return {
// //             id: crypto.randomUUID(),
// //             type: "paragraph",
// //             content: text,
// //             props: {
// //                 isMath: true,
// //             }
// //         };
// //     }

// //     // Default to Paragraph or Bullet
// //     const isBullet = text.match(/^(\d+\.|•|-|\*)/) || xPos > 85;

// //     return {
// //         id: crypto.randomUUID(),
// //         type: isBullet ? "bulletListItem" : "paragraph",
// //         content: text,
// //     };
// // } 

// import path, { join } from "path";
// import { detectColumnBoundary } from "./pdf-column-detector";
// // @ts-ignore
// import pdfParse from "pdf-parse-fork";

// const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// if(typeof window === "undefined"){
//     const workerPath = path.join(
//         process.cwd(),
//         "node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
//     );
//     pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
// }

// export interface StructuralBlock{
//     id: string;
//     type: "heading" | "paragraph" | "bulletListItem" | "numberedListItem" | "codeBlock" | "image" | "table";
//     content: string | string[][];
//     fontSize?: number;
//     props?: Record<string, any>;
//     pageNumber?: number;
// }

// interface RawItem {
//     str: string;
//     transform: number[];
//     width: number;
//     fontName: string;
//     height: number;
// }

// // --- FONT SIZE ---
// // transform = [a,b,c,d,x,y]
// // Rendered font size = sqrt(a² + b²).
// function getFontSize(item: RawItem): number{
//     const a = item.transform[0];
//     const b = item.transform[1];
//     return Math.round(Math.sqrt( a*a + b*b ));
// }

// // --- BODY FONT SIZE DETECTION ---
// // The body font size is the MODE (most frequent) font size on the page.
// // This let heading detection work relatively, not with a hardcoded threshold.
// function detectBodyFontSize(items: RawItem[]): number{
//     const freq: Record<number, number> = {};
//     for(const item of items){
//         const fs = getFontSize(item);
//         freq[fs] = (freq[fs] || 0) + 1;
//     }

//     let maxCount = 0;
//     let bodySize = 11; //fallback
//     for(const [ size, count] of Object.entries(freq)){
//         if(count > maxCount){
//             maxCount = count;
//             bodySize = Number(size);
//         }
//     }
//     return bodySize;
// }

// // --- RUNNING HEADER/FOOTER DETECTION ---
// // Collect all Y-positions across all pages
// // If the same Y (±2px) appears on 3+ pages -> it's a running header or footer
// async function detectRepeatedYPosition(
//     pdfDoc: any,
//     startPage: number,
//     endPage: number
// ): Promise<Set<number>>{
//     const yFrequency: Record<number, number> = {};
//     const pageCount = Math.min(endPage, pdfDoc.numPages);

//     for(let i = startPage; i <= pageCount; i++){
//         const page = await pdfDoc.getPage(i);
//         const textContent = await page.getTextContent();
//         const seenOnThisPage = new Set<number>();

//         for(const item of textContent.items as RawItem[]){
//             const y = Math.round(item.transform[5]);

//             // Only count once per page
//             if(!seenOnThisPage.has(y)){
//                 seenOnThisPage.add(y);
//                 yFrequency[y] = (yFrequency[y] || 0) + 1;
//             }
//         }
//     }

//     // Any Y that appears on 3+ pages = repeated element (header/footer)
//     const totalPages = pageCount - startPage + 1;
//     const threshold = Math.min(3, Math.ceil(totalPages * 0.4));
//     const repeatedY = new Set<number>();

//     for(const [ y, count ] of Object.entries(yFrequency)){
//         if(count >= threshold){
//             // Mark a ±3px band around this Y
//             const yNum = Number(y);
//             for(let delta = -3; delta <= 3; delta++){
//                 repeatedY.add(yNum + delta);
//             }
//         }
//     }

//     return repeatedY;
// }


// // --- TABLE DETECTION
// // A real table row needs: 
// // 1. 3+ items (not just 2 words with a space)
// // 2. Large X-gaps between them
// // 3. At least 2 consecutive rows that match this pattern
// function hasLargeXGaps(items: RawItem[]):boolean{
//     if(!items || items.length < 3) return false; //raised from 2 to 3
//     let gapCount = 0;
//     for(let i = 1; i < items.length; i++){
//         const prevEnd = items[i - 1].transform[4] + (items[i - 1].width || 20);
//         const gap = items[i].transform[4] - prevEnd;
//         if(gap > 30) gapCount++; //tightened from 25 to 30
//     }

//     return gapCount >= 2; //need at least 2 large gaps (3+ columns)
// }


// // --- NOISE LINES ---
// // Drop lines that are clearly noise regardless of position:
// // - Pure page numbers
// // - Copyright lines
// // - DOI strings
// // - Lines that are only whitespaces/punctuation
// function isNoiseLine(text: string):boolean{
//     const t = text.trim();
//     if(t.length === 0) return true;
//     if(t.length < 3) return true;                               // single char/symbol orphan
//     if (/^\d+$/.test(t)) return true;                         // standalone page number
//     if (/^[ivxlcdmIVXLCDM]+$/.test(t)) return true;          // roman numeral page number
//     if (/©|copyright|all rights reserved/i.test(t)) return true;
//     if (/^doi\s*:/i.test(t)) return true;
//     if (/^(isbn|issn)\s*[\d\-]+/i.test(t)) return true;
//      // Short * prefixed lines are figure caption fragments or math display items
//     if (/^\*\s*.{0,40}$/.test(t)) return true;
//     return false; 
// }

// // --- Drop decorative/divider lines ---
// function isDividerLine(text: string): boolean{
//     const t = text.trim();
//     // Lines that are only dashes, asterisks, dots, or underscores
//     return /^[-─═*•·\._ ]{3,}$/.test(t);
// }

// // --- BLOCK CLASSIFICATION ---
// function classifyBlock(
//     items: RawItem[],
//     fullText: string,
//     bodyFontSize: number, //median font size of the page, passed in
// ):StructuralBlock{
//     const firstItem = items[0];
//     const fontSize = getFontSize(firstItem);
//     const fontName = (firstItem.fontName || "").toLowerCase();
//     const xPos = firstItem.transform[4];

//     // Code block: monospace font
//     if(
//         fontName.includes("mono") ||
//         fontName.includes("courier") ||
//         fontName.includes("consol") ||
//         fontName.includes("lucida console") ||
//         fontName.includes("inconsolata")
//     ){
//         return {
//             id: crypto.randomUUID(),
//             type: "codeBlock",
//             content: fullText,
//             fontSize,
//         };
//     }

//     // Heading: font meaningfully larger than body text
//     // using relative threshold instead of fixed > 13 so it worked across PDFs
//     if(fontSize > bodyFontSize * 1.2){
//         return {
//             id: crypto.randomUUID(),
//             type: "heading",
//             content: fullText,
//             fontSize,
//             props: {
//                 level: fontSize > bodyFontSize * 1.6 
//                 ? 1 : fontSize > bodyFontSize * 1.3 ? 2 : 3,
//             },
//         };
//     }

//     // Math: detected by font name
//     const isMathFont = 
//         fontName.includes("math") || 
//         fontName.includes("cmsy") ||
//         fontName.includes("cmmi") ||
//         fontName.includes("cmr") ||
//         fontName.includes("stix") ||
//         fontName.includes("mtmi");

//     if(isMathFont){
//         return {
//             id: crypto.randomUUID(),
//             type: "paragraph",
//             content: fullText,
//             fontSize,
//             props:{
//                 isMath: true
//             },
//         };
//     }

//     //  Numbered list: "1. text" or "1) text"  
//     if (/^\d+[\.\)]\s+\S/.test(fullText)) {
//         return {
//              id: crypto.randomUUID(), 
//              type: "numberedListItem", 
//              content: fullText, 
//              fontSize 
//         };
//     }

//     // Bullet list: ONLY explicit bullet chars — NOT * because that's also math/footnote
//     if (/^[•▪▸◦]\s+/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "bulletListItem", 
//             content: fullText, 
//             fontSize 
//         };
//     }

//     // Dash bullets are ok but only if followed by a space and word character
//     if (/^[-–]\s+\w/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "bulletListItem", 
//             content: fullText, 
//             fontSize 
//         };
//     }

//     // Drop * prefixed short lines — these are almost always math fragments or captions
//     // NOT real bullet points
//     if (/^\*\s*/.test(fullText)) {
//         return { 
//             id: crypto.randomUUID(), 
//             type: "paragraph", 
//             content: fullText.replace(/^\*\s*/, "").trim(), 
//             fontSize 
//         };
//     }

//     // Indented short line without sentence-ending punctuation = sub-item
//     if(xPos > 90 && fullText.length < 120 && !/[.!?]\s*$/.test(fullText)){
//         return {
//             id: crypto.randomUUID(),
//             type: "bulletListItem",
//             content: fullText,
//             fontSize,
//         };
//     }
//     return {
//         id: crypto.randomUUID(),
//         type: "paragraph",
//         content: fullText,
//         fontSize
//     }
// }



// function mergeFragmentedParagraph(
//     blocks: StructuralBlock[]
// ): StructuralBlock[]{
//     const merged: StructuralBlock[] = [];
    
//     for(const block of blocks){
//         const prev = merged[merged.length - 1];

//         const isFragment = 
//             block.type === "paragraph" &&
//             typeof block.content === "string" &&
//             block.content.length < 120 &&                          // short line
//             !/[.!?]\s*$/.test(block.content);                   // doesn't end a sentence

//         const prevIsMergeable =
//             prev &&
//             prev.type === "paragraph" &&
//             typeof prev.content === "string" &&
//             !/[.!?:]\s*$/.test(prev.content);    

//         if(isFragment && prevIsMergeable){
//             // Merge into previous block - remove trailing hyphen if word was hyphenated
//             const prevText = (prev.content as string).replace(/-\s*$/, "");
//             const joined = prevText.endsWith("-")
//                 ? prevText + block.content
//                 : prevText + " " + block.content;
//             prev.content = joined;
//         }else{
//             merged.push({ ...block});
//         }
//     }
//     return merged;
// }



// // --- MAIN EXPORT ---
// export const parsePDFStructure = async (
//     buffer: Buffer,
//     startPage: number,
//     endPage: number,
// ): Promise<StructuralBlock[]> => {
//      const seenImageKeys = new Set<string>();
//     const data = new Uint8Array(buffer);
//     const loadingTask = pdfjs.getDocument({
//         data,
//         cMapUrl: path.join(process.cwd(), "node_modules/pdfjs-dist/cmaps/"),
//         cMapPacked: true,
//     });

//     const pdfDoc = await loadingTask.promise;

//     // Pass 1: detect running headers/footers across the page range
//     const repeatedY = await detectRepeatedYPosition(pdfDoc, startPage, endPage);

//     const finalBlocks: StructuralBlock[] = [];

//     // Pass 2: extract and classify content
//     for(let i = startPage; i <= Math.min(endPage, pdfDoc.numPages); i++ ){
//         const page = await pdfDoc.getPage(i);
//         const rawPageBlocks: StructuralBlock[] = [];
        
//         // Image 
       
//         const ops = await page.getOperatorList();
//         for(let j = 0; j < ops.fnArray.length; j++){
//             if(ops.fnArray[j] === pdfjs.OPS.paintImageXObject){
//                 const imageKey = ops.argsArray[j][0];

//                 // Skip image we've already seen - they're header/footer logos
//                 if(seenImageKeys.has(imageKey)) continue;
//                 seenImageKeys.add(imageKey);
//                 rawPageBlocks.push({
//                     id: crypto.randomUUID(),
//                     type: "image",
//                     content: "Embedded Image",
//                     props: {
//                         imageKey,
//                     },
//                     pageNumber: i,
//                 });
//             }
//         }

//         // Text
//         const textContent = await page.getTextContent();
//         const allItems = textContent.items as RawItem[];

//         // Detect body font size for this page
//         const bodyFontSize = detectBodyFontSize(allItems);
//         const columnInfo = detectColumnBoundary(allItems);

//         // Group items by Y-coordinates (same row = same Y ±1px)
//         const rows: Record<number, RawItem[]> = {};
//         for(const item of allItems){
//             const y = Math.round(item.transform[5]);

//             // Drop items at repeated Y position (headers/footers)
//             if(repeatedY.has(y)) continue;

//             // For multi-column pages, encode column into the key
//             // Left coulmn uses y as-is, right column uses y + 100000 as key
//             // This ensures left and right column rows never merge
//             let rowKey: number;
//             if(columnInfo.isMultiColumn && columnInfo.splitX){
//                 const isRightColumn = item.transform[4] > columnInfo.splitX;
//                 rowKey = isRightColumn ? y + 100000 : y;
//             }else{
//                 rowKey = y;
//             }

//             const matchingY = Object.keys(rows)
//                 .map(Number)
//                 .find(key => Math.abs(key - rowKey) <= 3);

//             const key = matchingY !== undefined ? matchingY : rowKey;
//             if(!rows[key]) rows[key] = [];
//             rows[key].push(item);
//         }

//         const sortedY = Object.keys(rows)
//             .map(Number)
//             .sort((a,b) => {
//                 const aCol = a >= 100000 ? 1 : 0;
//                 const bCol = b >= 100000 ? 1 : 0;
//                 if(aCol !== bCol) return aCol - bCol;   //left column first
//                 const aY = a >= 100000 ? a - 100000 : a;
//                 const bY = b >= 100000 ? b - 100000 : b;
//                 return bY - aY;                          //top to bottom within column
//             })

//         let rowIdx = 0;
//         while(rowIdx < sortedY.length){
//             const y = sortedY[rowIdx];
//             const items = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);

//             // Table detection: need current AND next row to both look like table rows
//             if(
//                 hasLargeXGaps(items) &&
//                 rowIdx + 1 < sortedY.length &&
//                 hasLargeXGaps(rows[sortedY[rowIdx + 1]])
//             ){
//                 const tableData: string[][] = [];
//                 while(
//                     rowIdx < sortedY.length &&
//                     hasLargeXGaps(rows[sortedY[rowIdx]])
//                 ){
//                     const rItems = rows[sortedY[rowIdx]].sort(
//                         (a, b) => a.transform[4] - b.transform[4]
//                     );
//                     tableData.push(rItems.map((it) => it.str.trim()).filter(Boolean));
//                     rowIdx++;
//                 }

//                 if(tableData.length >= 2){
//                     rawPageBlocks.push({
//                         id: crypto.randomUUID(),
//                         type: "table",
//                         content: tableData,
//                         props: {
//                             rows: tableData.length,
//                             cols: tableData[0].length || 0,
//                         },
//                     });
//                 }
//             }else{
//                 // const fullText = items.map((it) => it.str).join(" ").trim();
//                 const fullText = items.map((it) => {
//                     return it.str;
//                 }).join(" ").trim();
//                 if(fullText && !isNoiseLine(fullText)){
//                     rawPageBlocks.push({
//                         ...classifyBlock(items, fullText, bodyFontSize),
//                         pageNumber: i,
//                     });
//                 }
//                 rowIdx++;
//             }
//         }

//         // --- POST PROCESSING PER PAGE ---

//         // 1. Drop decorative divider lines
//         let pageBlocks = rawPageBlocks.filter((b) =>{
//             if(typeof b.content !== "string") return true; //always keep tables
//             return !isDividerLine(b.content as string);
//         });

//         // 2. Merge fragmented lines back into full paragraphs
//         pageBlocks = mergeFragmentedParagraph(pageBlocks);

//         finalBlocks.push(...pageBlocks);
//     }

//     return finalBlocks;
// }

// export async function extractPageTextWithCIDs(
//     buffer: Buffer,
//     pageNum: number,
// ): Promise<string>{
//     const result = await pdfParse(buffer, {
//         max: pageNum,
//         pageRender: (pageData: any) => {
//             return pageData.getTextContent({
//                 normalizeWhitespace: false,
//                 disableCombineTextItems: false
//             }).then((textContent: any) => {
//                 // Use x-position gaps to infer word space
//                 const items = textContent.items;
//                 if(!items || items.length === 0) return "\f";

//                 let text = "";
//                 let lastX1 = -1;
//                 let lastY = -1;

//                 for(const item of items){
//                     const x0 = item.transform[4];
//                     const y = Math.round(item.transform[5]);

//                     if(lastY !== -1 && Math.abs(y - lastY) > 5){
//                         text += "\n";
//                         lastX1 = -1;
//                     }

//                     // Insert space if gap between previous item end and this item start > 2px
//                     if(lastX1 >= 0 && x0 - lastX1 > 2.0){
//                         text += " ";
//                     }

//                     text += item.str;
//                     lastX1 = x0 + (item.width || 0);
//                     lastY = y;
//                 }

//                 return text + "\f";
//             });
//         },
//     });

//     // Get only the last page's text (pages are separated by \f)
//     const pages = result.text.split("\f").filter((p: string) => p.trim().length > 0);
//     return pages[pages.length - 1] || "";
// }

import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface StructuralBlock {
    id: string;
    type: "heading" | "paragraph" | "bulletListItem" | "numberedListItem" | "codeBlock" | "image" | "table";
    // text blocks: string, table blocks: string[][], image blocks: undefined
    content?: string | string[][];
    // image blocks only: base64-encoded image bytes
    data?: string;
    // image blocks only: "image/jpeg" | "image/png"
    mimeType?: string;
    fontSize?: number;
    props?: Record<string, any>;
    pageNumber?: number;
    // bounding box on page (PDF coordinates)
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
}

/**
 * Extracts structural blocks using an external Python script (pdfplumber).
 */

export const parsePDFStructure = async(
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

    try {
        fs.writeFileSync(tmpPdf, buffer);

        const stdout = execSync(
            `"${pythonPath}" "${scriptPath}" "${tmpPdf}" "${startPage}" "${endPage}"`,
            {
                maxBuffer: 100 * 1024 * 1024,    //100MB buffer for large book pdfs
                timeout: 180_000,
                encoding: "utf8",
                stdio: [ 'pipe', 'pipe', 'inherit'],
            }
        );

        if(!stdout || stdout.trim() === ""){
            throw new Error("Python script returned empty output.");
        }

        const parsed = JSON.parse(stdout);

        if(parsed?.error){
            throw new Error(parsed.error);
        }

        return parsed as StructuralBlock[];
    } catch (error: any) {
        console.error(`[PDF STRUCTURAL PARSER ERROR] error ${startPage} - ${endPage}: `, error);
        throw new Error(`parsePDFStructured: ${error.message}`);
    }finally{
        // cleanup the temporary PDF file
        try {
            if(fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
        } catch {}
    }
};