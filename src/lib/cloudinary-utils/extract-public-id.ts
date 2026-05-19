export const extractPublicIdFromUrl = (
    url: string
): string => {
    try {
        if(!url) return "";
        // Split by '/' and find the part after 'upload/' 
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');

        if(uploadIndex === -1) return "";

        // The public_id starts after the version number
        const pathParts = parts.slice(uploadIndex + 2); //skip 'upload' and 'v12345'
        const fullName = pathParts.join('/');  //"studysprout-pdfs/filename.pdf"

        return fullName.replace(/\.[^/.]+$/, ""); //remove ".pdf" -> "studysprout-pdfs/filename"
    } catch (error) {
        console.error("[Extract Public Id] Error in extracting public id for pdf: ",error);
        throw error;
    }
}