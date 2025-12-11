import { normalizeNotes, normalizeNotesWithMapping } from "./normalizeNotes";

const THROTTLE_THRESHOLD_MS = 5000;
export async function refreshPlainTextContent(file: any){
    try {
        if(!file || !file.data){
            console.log("[FileProcessingUtils] No file or file.data provided.");
            return file;
        }
        const currentTime = new Date().getTime();
        const lastGenerated = file?.plainTextLastGenerated 
        ? new Date(file.plainTextLastGenerated).getTime()
        : 0;

        const timeSinceLastGen = currentTime - lastGenerated;
        const wasModified = file.updatedAt
        ? new Date(file.updatedAt).getTime() > lastGenerated
        : false;

        if(file.plainTextLastGenerated && !wasModified && timeSinceLastGen < THROTTLE_THRESHOLD_MS ){
            console.log("[FileProcessingUtils] Skipping: throttled (within 5s, not modified.");
            return file;
        }

        console.log("[FileProcessingUtils] Regenerating plainTextContent");
        // console.log("[FileProcessingUtils] file.data: ",file.data);

        try {
            const {
                normalizedPlainText,
                structuredPlainText,
                blockMap
            } = normalizeNotesWithMapping(file.data);

            file.plainTextContent = normalizedPlainText;
            // console.log("[FileProcessingUtils] file.plainTextContent: ",file.plainTextContent);
            file.structuredPlainText = structuredPlainText;
            // console.log("[FileProcessingUtils] file.structuredPlainText: ",file.structuredPlainText);
            console.log("[FileProcessingUtils] blockmap length: ",file.blockMap.length);
            console.log("[FileProcessingUtils] blockmap: ",file.blockMap);
            const flatBlockMap = Array.isArray(blockMap) ? blockMap.flat() : [];
            const safeBlockMap = flatBlockMap.map((entry: any) => ({
                id: String(entry.id ?? ""),
                start: Number(entry.start ?? 0),
                end: Number(entry.end ?? 0),
                type: String(entry.type ?? "")
            }));
            console.log("[FileProcessingUtils] safe blockmap length: ",safeBlockMap.length);
           file.blockMap = safeBlockMap;
           // Check if markModified exists before calling it
            if (typeof file.markModified === 'function') {
                file.markModified('blockMap');
            } else {
                // If it's not a Mongoose document, we rely on the object property update
                // (This only works if the object is merged back into a saving document later, 
                // but ensures the utility doesn't crash).
                console.warn("[FileProcessingUtils] Cannot call markModified: object is not a Mongoose Document.");
            }
            console.log("[FileProcessingUtils] file.blockMap: ",file.blockMap); 

        } catch (error) {
            console.warn("[FileProcessingUtils] Error generating plainText: ",error);
            file.plainTextContent = normalizeNotes(file.data);
            file.blockMap = [];
            file.plainTextLastGenerated = new Date().toISOString();
        }
    } catch (error) {
        console.warn("[FileProcessingutils] Error in refreshPlainTextContent: ",error);
    }
}