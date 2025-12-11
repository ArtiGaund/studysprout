/**
 * Split text into chunks of maximum `maxChunkChars`
 * 
 * @param text - The text to split
 * @param maxChunkChars - The maximum number of characters per chunk
 * @returns - An array of chunks
 */
export function splitTextIntoChunks(text: string, maxChunkChars = 12000 ):string[]{
    if(!text) return [];

    const paragraphs = text.split(/\n{2,}/).map( p => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let current = "";

    for(const p of paragraphs){
        if(!current){
            if(p.length <= maxChunkChars) current = p;
            else{
                // hard-split very long paragraphs
                for(let i=0;i<p.length;i+=maxChunkChars){
                    chunks.push(p.slice(i, i+maxChunkChars));
                }
                current = "";
            }
        }else if((current + "\n\n" + p).length <= maxChunkChars){
            current = `${current}\n\n${p}`;
        }else{
           chunks.push(current);
            current = p.length <= maxChunkChars ? p : (() => {
                for (let i = 0; i < p.length; i += maxChunkChars) chunks.push(p.slice(i, i + maxChunkChars));
                return "";
            })();
        }
    }

    if(current) chunks.push(current);
    return chunks;
}