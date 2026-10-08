'use client';

import { 
    Briefcase, FileText, Folder, 
    ChevronDown, ChevronRight, 
    Plus, Trash2 
} from "lucide-react";
import { useState } from "react";
import { Node } from "../Dashboard-preview";
import { BannerSection } from "./Banner-Section";

interface MainCanvasProps {
    nodes: Node[];
    addFolder: () => void;
    addFile: (id: string) => void;
    deleteOperation: (id: string) => void;
    onRecordInteraction: () => void;
}

export const MainCanvas = ({ 
    nodes,
    addFolder,
    addFile,
    deleteOperation,
    onRecordInteraction, 
}: MainCanvasProps) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleFolder = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const rootFolders = nodes.filter(n => n.type === 'folder' && !n.parentId);
    const rootFiles = nodes.filter(n => n.type === 'file' && !n.parentId);

    return (
        <div className="flex-1 flex flex-col bg-[#0A0608] h-full overflow-hidden">
            <div className="flex-shrink-0 bg-[#0A0608]">
                <BannerSection />
            </div>
            <div className="flex-1 p-10 overflow-y-auto min-h-0 custom-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-[#2A1E22] pb-6 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#C9A227]/10 flex items-center 
                    justify-center border border-[#C9A227]/20">
                        <Briefcase className="text-[#C9A227]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#F5F0EB] tracking-tight">
                            Collaboration
                        </h2>
                    </div>
                </div>

                <div className="space-y-2">
                    {rootFolders.filter(node => node.type === 'folder' && !node.parentId)
                    .map(folder => (
                        <div key={folder.id} className="space-y-1">
                            {/* FOLDER ROW */}
                            <div 
                                onClick={() => {
                                    toggleFolder(folder.id)
                                    onRecordInteraction();
                                }}
                                className="flex items-center justify-between p-4 rounded-xl 
                                border border-[#2A1E22] bg-[#120C0E]
                                 hover:bg-[#191013] transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-stone-500">
                                        {expanded[folder.id] || nodes.some(n => 
                                        n.parentId === folder.id) 
                                            ? <ChevronDown size={14}/> 
                                            : <ChevronRight size={14}/>
                                        }
                                    </div>
                                    <Folder size={18} className="text-[#C9A227]" />
                                    <span className="text-sm font-semibold text-[#E6DFD5]">
                                        {folder.name}
                                    </span>
                                </div>

                                {/* Folder Actions */}
                                <div className="flex items-center gap-3 opacity-0 
                                group-hover:opacity-100 transition-opacity">
                                    <button 
                                    className="p-1.5 rounded-md hover:bg-[#C9A227]/20
                                     text-stone-400 hover:text-[#C9A227] transition-colors"
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        addFile(folder.id);
                                        onRecordInteraction();
                                     }}
                                     >
                                        <Plus size={14} />
                                    </button>
                                    <button 
                                    className="p-1.5 rounded-md hover:bg-red-500/10
                                     text-gray-400 hover:text-red-400 transition-colors"
                                     onClick={() => {
                                        deleteOperation(folder.id)
                                        onRecordInteraction();
                                     }}
                                     >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* NESTED FILES */}
                            {(expanded[folder.id] || nodes.some(n => n.parentId === folder.id)) 
                            && (
                                <div className="ml-8 space-y-1 animate-in slide-in-from-top-2 
                                duration-300">
                                    {nodes.filter(n => n.parentId === folder.id).map(file => (
                                        <div key={file.id} className="flex items-center 
                                        justify-between p-3 rounded-xl border border-[#2A1E22]/60
                                         bg-[#120C0E]/50 hover:bg-[#191013] group">
                                            <div className="flex items-center gap-4">
                                                <FileText size={16} className="text-[#C9A227]/80" />
                                                <span className="text-sm font-medium
                                                 text-stone-400">{file.name}</span>
                                            </div>
                                            
                                            {/* File Action */}
                                            <button 
                                            className="opacity-0 group-hover:opacity-100 p-1.5 
                                            rounded-md hover:bg-red-500/10 text-gray-400
                                             hover:text-red-400 transition-all"
                                             onClick={() => {
                                                deleteOperation(file.id);
                                                onRecordInteraction();
                                             }}
                                             >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* ROOT FILES */}
                    {rootFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 
                        rounded-xl border border-[#2A1E22] bg-[#120C0E] hover:bg-[#191013] group">
                            <div className="flex items-center gap-4">
                                <FileText size={18} className="text-[#C9A227]/80" />
                                <span className="text-sm font-semibold text-[#E6DFD5]">
                                    {file.name}
                                </span>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-1.5 
                            rounded-md hover:bg-red-500/10 text-gray-400
                             hover:text-red-400 transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};