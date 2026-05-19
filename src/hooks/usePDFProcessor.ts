import { useToast } from "@/components/ui/use-toast";
import { generatePDFFolderService, inspectPDFService, retryPDFToFolderGenerationService } from "@/services/pdfServices";
import { ADD_FOLDER } from "@/store/slices/folderSlice";
import { useCallback, useState } from "react"
import { useDispatch } from "react-redux";

export const usePDFProcessor = () => {
    const [ isAnalyzing, setIsAnalyzing ] = useState(false);
    const [ isProcessing, setIsProcessing ] = useState(false);
    const [isRetrying, setIsRetrying ] = useState(false);
    const [ pdfMetadata, setPdfMetadata ] = useState<{
        title: string;
        totalPage: number;
        activePageCount: number;
        pageCount: number;
        suggestedFileCount: number;
        isDigital: boolean;
        startOffset?: number;
        endOffset?: number;
    } | null>(null);

    const { toast } = useToast();

    const dispatch = useDispatch();
    const analyzePDF = useCallback(async (
        file: File,
        excludeIntro: boolean
    ) => {
        setIsAnalyzing(true);
        try {
            const data = await inspectPDFService(file, excludeIntro);

            if(data && data.isDigital === false){
                toast({
                    title: "Unsupported PDF",
                    description: "Studysprout works best with searchable PDFs. Scanned documents are currently not supported.",
                    variant: "destructive",
                });
            }
            setPdfMetadata(data);
            return data;
        } catch (error) {
            console.error("[usePDFProcessor] inspect error: ",error);
            toast({
                title: "Failed",
                description: "Failed to inspect the PDF",
                variant: "destructive",
            });
        }finally{
            setIsAnalyzing(false);
        }
    }, [
        toast,
    ])

    const processPDFToFolder = useCallback(async(
        file: File,
         workspaceId: string,
         startOffset: number,
         endOffset: number,
    ) => {

        if(!pdfMetadata) return;

        setIsProcessing(true);
        try {
            const data = await generatePDFFolderService(
                file, 
                pdfMetadata, 
                workspaceId,
                startOffset,
                endOffset,
            );

            if(data.folderId){
                console.log("DISPATCHING TO REDUX:", {
                    workspaceId,
                    folderId: data.folderId
                });
                dispatch(ADD_FOLDER({
                    workspaceId:String(workspaceId).trim(),
                    folder: {
                        _id: data.folderId,
                        title: pdfMetadata.title || file.name.replace(".pdf", ""),
                        workspaceId,
                        status: "processing",
                        progress: 0,
                        iconId: "⏳",
                        totalFiles: pdfMetadata.suggestedFileCount,
                        currentFileCount: 0,
                        isPDFWorkspace: true,
                        createdAt: String(new Date()),
                    } as any
                }));
            }

            toast({
                title: "Importing PDF...",
                description: "We are splitting the book into the notes. This happens in the background."
            })

            return data;
        } catch (error) {
            console.error("[usePDFProcessor] process pdf to folder error: ",error);
            toast({
                title: "Import PDF failed",
                description: "Failed to start the background processing task",
                variant: "destructive",
            });
        }finally{
            setIsProcessing(false);
        }
    },[
        pdfMetadata,
        toast,
        dispatch,
    ])

    const retryPDFToFolder = useCallback(async(
        folderId: string,
        workspaceId: string
    ) => {
        setIsRetrying(true);
        try {
            const response = await retryPDFToFolderGenerationService(folderId, workspaceId);

            if(!response.success){
                toast({
                    title: "Retry Failed",
                    description: "Failed to retry to generate file of pdf data",
                    variant: "destructive",
                });
            }

            toast({
                title: "Successfully Generated File",
                description: "Successfully generated file from pdf data",
            });
            return response;
        } catch (error) {
            console.error("[usePDFProcessor] Failed to retry to generate files of pdf data: ",error);
        }finally{
            setIsRetrying(false);
        }
    },[
        toast,
    ])
    return {
        // methods
        analyzePDF,
        processPDFToFolder,
        retryPDFToFolder,

        // states
        isAnalyzing,
        isProcessing,
        pdfMetadata,
        setPdfMetadata,
        isRetrying,
    };
}