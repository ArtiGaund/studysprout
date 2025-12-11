import { normalizeNotes, normalizeNotesWithMapping } from "./normalizeNotes";

const THROTTLE_THRESHOLD_MS = 5000;
export async function refreshPlainTextContent(file: any){
    try {
        if(!file || !file.data){
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
            return file;
        }

        try {
            const {
                normalizedPlainText,
                structuredPlainText,
                blockMap
            } = normalizeNotesWithMapping(file.data);

            file.plainTextContent = normalizedPlainText;
            file.structuredPlainText = structuredPlainText;
            const flatBlockMap = Array.isArray(blockMap) ? blockMap.flat() : [];
            const safeBlockMap = flatBlockMap.map((entry: any) => ({
                id: String(entry.id ?? ""),
                start: Number(entry.start ?? 0),
                end: Number(entry.end ?? 0),
                type: String(entry.type ?? "")
            }));
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