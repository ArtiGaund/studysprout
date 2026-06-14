'use client';

import { FileText, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { Label } from "../ui/label";
import { ToggleSwitch } from "../ui/toggle-button";


export const PDFUploadForm = () => {
    const [selectedFile, setSelectedFile ] = useState<File | null>(null);
    const [ isUploading, setIsUploading ] = useState(false);
    const [ uploadProgress, setUploadProgress] = useState(0);
    const [ excludeIntro, SetExcludeIntro ] = useState(true);

    const [ range, setRange ] = useState({ start: 1, end: 1 });
    const [ isManualRange, setIsManualRange ] = useState(false);

    const currentWorkspace = useSelector(selectCurrentWorkspace);

    const {
        analyzePDF,
        processPDFToFolder,
        isAnalyzing,
        // isProcessing,
        pdfMetadata,
        setPdfMetadata,
    } = usePDFProcessor();
    // 1.Handle File Selection
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file && file.type === "application/pdf"){
            setSelectedFile(file);
            setIsManualRange(false);

            // Start inspecting immediately
           const metadata = await analyzePDF(file, excludeIntro);
           if(metadata){
            setRange({
                start: metadata.startOffset || 1,
                end: metadata.endOffset || metadata.totalPage
            });
           }
        }
    }

    const handleRangeChange = (field: 'start' | 'end', value: string) => {
        const num = parseInt(value) || 0;
        setIsManualRange(true);
        setRange(prev => ({ 
            ...prev,
            [field]: num,
        }));
    }
    const handleToggleChange = async (checked: boolean) => {
        SetExcludeIntro(checked);
        if(selectedFile){
            const metadata = await analyzePDF(selectedFile, checked);
            if(metadata){
                setRange({
                    start: metadata.startOffset || 1,
                    end: metadata.endOffset || metadata.totalPage
                });
            }
        }
    }
    // 2. Clear Selection
    const removeFile = () => {
        setSelectedFile(null);
        setPdfMetadata(null);
    };

    const isScanned = !!(pdfMetadata && pdfMetadata.isDigital === false);

    // 3. Submit to backend
    const onSubmit = async () => {
        if(!selectedFile || !currentWorkspace) return;

        if(!currentWorkspace._id) return;
        setIsUploading(true);
        try {
            // const formData = new FormData();
            // formData.append("file", selectedFile);

            // Phase 1: Upload and Get Metadata 
            const result = await processPDFToFolder(
                selectedFile, 
                currentWorkspace._id,
                range.start,
                range.end,
            );

        } catch (error) {
            console.error("[PDF upload form] Sumbit error: ",error);
        }finally{
            setIsUploading(false);
        }
    }

    return(
        <div className="space-y-6 py-4">
            {/* Toggle Section */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-0.5">
                    <Label className="text-sm">Smart Ingestion</Label>
                    <p className="text-[10px] text-neutral-500">
                        Exclude book intro/outro automatically
                    </p>
                </div>
                <ToggleSwitch 
                checked={excludeIntro}
                onCheckedChange={handleToggleChange}
                />
            </div>

            {!selectedFile 
            ? (
                // DROPZONE STATE
                <div className={`border-2 border-dashed border-neutral-700 rounded-lg p-10
                 flex flex-col items-center justify-center gap-2 hover:border-neutral-500
                  transition-colors cursor-pointer relative`}>
                    <input 
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={onFileChange}
                    />
                    <UploadCloud className="w-10 h-10 text-neutral-500"/>
                    <div className="text-center">
                        <p className="text-sm font-medium">Click or drag PDF to upload</p>
                        <p className="text-xs text-neutral-500">Max size: 50MB</p>
                    </div>
                </div>
            ) 
            : (
                // SELECTED FILE PREVIEW / INSPECTING STATE
                <div className="space-y-4">
                <div className={`relative bg-neutral-900 border border-neutral-800 rounded-lg p-4 group`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded">
                                <FileText className="w-6 h-6 text-blue-500"/>
                            </div>
                            <div>
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        {!isAnalyzing && (
                            <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={removeFile}
                            className="absolute top-2 right-2 p-1.5 rounded-md text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all z-10"
                            >
                                <X className="w-4 h-4"/>
                            </Button>
                        )}
                    </div>

                    {/* 1. Show Scanning Loader while isInspecting is true  */}
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse py-2">
                            <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" />
                            <span>Analyzing PDF structure...</span>
                        </div>
                    )}

                    {/*2. Show Results only when NOT inspecting and metadata exists  */}
                    {!isAnalyzing && pdfMetadata && pdfMetadata.isDigital && (
                        <div className="space-y-2 pt-3 border-t border-neutral-800">
                            {/* Range inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-neutral-500 uppercase font-bold">
                                        Start Page
                                    </Label>
                                    <input 
                                    type="number"
                                    min={1}
                                    max={pdfMetadata.totalPage}
                                    value={range.start}
                                    onChange={(e) => handleRangeChange('start', e.target.value)}
                                    className={`
                                        w-full bg-black/40 border border-neutral-700 rounded
                                        px-2 py-1 text-xs text-white focus:border-blue-500
                                        outline-none transition-colors
                                        `}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-neutral-500 uppercase font-bold">
                                        End Page
                                    </Label>
                                    <input 
                                    type="number"
                                    min={1}
                                    max={pdfMetadata.totalPage}
                                    value={range.end}
                                    onChange={(e) => handleRangeChange('end', e.target.value)}
                                    className={`
                                        w-full bg-black/40 border border-neutral-700 rounded
                                        px-2 py-1 text-xs text-white focus:border-blue-500
                                        outline-none transition-colors
                                        `}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Estimated Max Files:</span>
                                <span className="text-white font-mono bg-white/5 px-1.5 rounded">
                                        up to {pdfMetadata.suggestedFileCount}
                                </span>
                            </div>

                            <p className="text-[10px] italic text-neutral-500 leading-tight">
                                {isManualRange
                                ?   `Manual Range: Processing specific pages selected by you.`
                                :   excludeIntro
                                    ?  `Optimized: Automatic detection skipped intro/outro content.`
                                    :  `Full Ingestion: Processing the entire document.`
                                }
                            </p>
                        </div>
                    )}
                </div>
                </div>
            )}

            {/* PROGRESS BAR */}
            {isUploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span>Processing PDF....</span>
                        <span>{uploadProgress}</span>
                    </div>
                </div>
            )}

            <Button
            className="w-full"
            disabled={!selectedFile || isAnalyzing || isScanned}
            onClick={onSubmit}
            >   
                {isAnalyzing ? "Inspecting..." : isScanned ? "Unsupported File" : "Generate Folder"}
            </Button>
        </div>
    )
}