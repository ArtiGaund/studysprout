'use client';

import { Loader2, Network, Sparkle } from "lucide-react";
import { ActionItem } from "../dashboard-shared/action-item";
import { useFolder } from "@/hooks/useFolder";
import { useSelector } from "react-redux";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { useState } from "react";
import { ConceptGraphModal } from "../dashboard-shared/concept-graph-modal";

export const SmartAction = ({ folderId }: { folderId: string}) => {

    const { generateConceptGraph } = useFolder();
    const currentFolder = useSelector(selectCurrentFolder);
    const [ modalOpen, setModalOpen ] = useState(false);

    const conceptGraph = currentFolder?.conceptGraph;
    const isGenerating = currentFolder?.conceptGraphStatus === "generating";
    const fileCount = currentFolder?.files?.length ?? 0;
    const hasGraph = (conceptGraph?.nodes?.length ?? 0) > 0;

    const handleMapGraph = async () => {
        if(!folderId) return;
        try {
           if(hasGraph && !currentFolder?.conceptGraphStale){
                setModalOpen(true);
                return;
           }
           const result = await generateConceptGraph(folderId);
           if(result.success){
            setModalOpen(true);
           }
        } catch (error) {
            console.error("Error generating concept graph:", error);
        }
    }

    return(
        <>
        <div className="flex flex-col gap-y-4 mt-4">
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-1">
                Smart Action
            </span>
            <div className="flex flex-col gap-y-2">
                <ActionItem 
                icon={Sparkle}
                label="AI Synthesis"
                />
               {!hasGraph && <ActionItem 
                icon={isGenerating ? Loader2 : Network}
                label={
                    isGenerating 
                       ? "Generating Graph..."
                       : hasGraph
                            ? "View Graph"
                            : fileCount < 2
                                ? "Map Graph (2+ files needed)"
                                : "Generate Map Graph"
                }
                handleAction={handleMapGraph}
                disabled={isGenerating || fileCount < 2}
                iconClassName={isGenerating ? "animate-spin text-purple-400" : null}
                isGenerating={isGenerating}
                />}
            </div>
        </div>

        {/* Modal - only mount when open */}
        {modalOpen && (
            <ConceptGraphModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            level="folder"
            title={currentFolder?.title ?? ""}
            />
        )}
        </>
    )
}