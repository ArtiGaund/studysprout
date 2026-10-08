'use client';

import { Briefcase, ChevronDown, ChevronRight, FileText, Folder, History, Layout, Paperclip, Plus, Search, Trash, Trash2 } from "lucide-react";
import { Node } from "../Dashboard-preview";
import { useEffect, useRef } from "react";

interface SidebarViewProps{
    addFolder: () => void;
    nodes: Node[];
    toggleFolder: (val:string) => void;
    expandedFolders: Record<string, boolean>;
    editingId: string | null;
    updateName: (id: string, newName: string) => void;
    setEditingId: (id: string | null) => void;
    addFile: (id: string) => void;
    onViewChange: (viewId: string) => void; 
    deleteOperation: (id: string) => void;
    onRecordInteraction: () => void;
}

export const SidebarView = ({
    addFolder,
    nodes,
    toggleFolder,
    expandedFolders,
    editingId,
    updateName,
    setEditingId,
    addFile,
    onViewChange,
    deleteOperation,
    onRecordInteraction,
}: SidebarViewProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(editingId && inputRef.current){
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    },[editingId]);

    return(
        <div className="w-64 border-r border-[#2A1E22] flex flex-col bg-[#0E090B] h-full 
        overflow-hidden">
            {/* Top: Brand/Workspace Info */}
            <div className="flex-shrink-0 p-4 border-b border-[#2A1E22]">
                <div className="flex items-center gap-3 p-2 rounded-xl [#160F12] border
                 border-[#2A1E22]">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A227]/15 flex items-center
                    justify-center text-[#C9A227] border border-[#C9A227]/30">
                        <Briefcase size={16}/>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-[#F5F0EB] truncate">
                            Collaboration
                        </span>
                        <span className="text-[8px] text-stone-500 uppercase font-mono font-bold
                        tracking-widest">
                            Workspace
                        </span>
                    </div>
                </div>
            </div>

            {/* Global Navigation */}
            <div className="flex-shrink-0 p-4 space-y-1 border-b border-[#2A1E22]">
                {[
                    {
                        // id: "Search",
                        icon: <Search size={14}/>,
                        label:"Search",
                    },
                    {
                        // id: "Workspace",
                        icon: <Layout size={14}/>,
                        label: "My Workspace",
                        action: true,
                    },
                    {
                        // id: "Trash",
                        icon: <Trash2 size={14}/>,
                        label: "Trash",
                    },
                    {
                        id: "flashcard-section",
                        icon: <History size={14}/>,
                        label: "Revision",
                    },
                ].map((item, i) => (
                    <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        cursor-pointer ${(item as any).action 
                            ? 'bg-[#1D1418] text-[#C9A227] font-semibold border border-[#3A282E]'
                            : 'text-stone-400 hover:text-[#F5F0EB] hover:bg-[#160F12]'
                        }`}
                    onClick={() => {
                        if((item as any).id){
                            onViewChange((item as any).id);
                            onRecordInteraction();
                        }
                    }}
                    >
                        {item.icon}
                        <span className="text-[11px] font-medium">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Scrollable Folders Section */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollable min-h-0">
                <div className="flex items-center justify-between mb-4 group px-2">
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                        Public
                    </span>
                </div>

                <div className="flex items-center justify-between mb-4 px-2 group">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase 
                    tracking-widest">
                        FOLDERS
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            id="guide-pdf-btn"
                            className="text-stone-400 hover:text-[#C9A227] transition-colors p-1
                            rounded-md"
                            onClick={() => onViewChange('workspaces-section')}
                        >
                            <Paperclip size={14}/>
                        </button>
                        <button
                        id="guide-plus-btn"
                        onClick={() => {
                            addFolder();
                            onRecordInteraction();
                        }}
                        className="text-stone-500 hover:text-[#C9A227] transition-colors p-1
                        rounded-md"
                        >   
                            <Plus size={14}/>
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    {nodes.filter(n => n.type === 'folder').map(folder => (
                        <div
                        id={`node-${folder.id}`}
                        key={folder.id}
                        className="space-y-1"
                        >
                            <div className="flex items-center gap-2 group hover:bg-[#160F12] p-1.5
                            rounded-lg transition-all">
                                <button
                                onClick={() => {
                                    toggleFolder(folder.id);
                                    onRecordInteraction();
                                }}
                                className="text-gray-700"
                                >   
                                    {expandedFolders[folder.id]
                                    ? <ChevronDown size={12}/>
                                    : <ChevronRight size={12}/>
                                    }
                                </button>
                                <Folder 
                                size={14}
                                className="text-[#C9A227] shrink-0"
                                />

                                {editingId === folder.id 
                                ? <input 
                                    ref={inputRef}
                                    className="bg-transparent border-none outline-none text-[11px]
                                    text-[#F5F0EB] w-full caret-[#C9A227]"
                                    value={folder.name}
                                    onChange={(e) => updateName(folder.id, e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                    />
                                : <span 
                                    onDoubleClick={() => {
                                        setEditingId(folder.id);
                                        onRecordInteraction();
                                    }}
                                    className="text-[11px] text-stone-300 truncate flex-1 
                                    font-medium"
                                    >
                                        {folder.name}
                                    </span>
                                }
                                <div className="flex flex-row gap-2">
                                    <span
                                        id={`add-file-btn-${folder.id}`}
                                        className={`transition-opacity ${ 
                                            editingId === folder.id || expandedFolders[folder.id]  
                                                ? 'opacity-100'  
                                                : 'opacity-0 group-hover:opacity-100'  
                                        }`}
                                    >
                                        <Plus  
                                            size={12}  
                                            className="text-stone-400 cursor-pointer 
                                            hover:text-[#C9A227]"  
                                            onClick={(e) => {  
                                                e.stopPropagation();  
                                                addFile(folder.id);  
                                                onRecordInteraction();  
                                            }}  
                                        />  
                                    </span>
                                    <Trash 
                                    size={12}
                                    className={`text-stone-400 transition-opacity 
                                        cursor-pointer hover:text-red-400 ${
                                            editingId === folder.id || expandedFolders[folder.id] 
                                            ? 'opacity-100' 
                                            : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                    onClick={() =>{ 
                                        deleteOperation(folder.id)
                                        onRecordInteraction();
                                    }}
                                    />
                                </div>
                            </div>

                            {/* Accordion Files */}
                            {expandedFolders[folder.id] && (
                                <div className="ml-5 border-l border-[#2A1E22] pl-3 space-y-1">
                                    {nodes.filter(n => n.parentId === folder.id).map(file => (
                                        <div
                                        id={`node-${file.id}`}
                                        key={file.id}
                                        className="flex items-center gap-2 p-1.5 hover:bg-[#160F12]
                                        rounded-md group"
                                        >
                                            <FileText size={12} className="text-[#C9A227]/70
                                             shrink-0"/>
                                            {editingId === file.id 
                                            ? <input
                                                ref={inputRef}
                                                className="bg-transparent border-none 
                                                outline-none text-[11px]
                                                text-[#F5F0EB] w-full caret-[#C9A227]"
                                                value={file.name}
                                                onChange={(e) => 
                                                    updateName(file.id, e.target.value)
                                                }
                                                onBlur={() => setEditingId(null)}
                                                onKeyDown={(e) => 
                                                    e.key === 'Enter' && setEditingId(null)
                                                }
                                                />
                                            : <span 
                                            className="text-[11px] text-stone-400 truncate
                                             font-medium"
                                            onDoubleClick={() => {
                                                setEditingId(file.id);
                                                onRecordInteraction();
                                            }}
                                            >
                                                {file.name}
                                                </span>
                                            }

                                            <Trash 
                                            size={12}
                                            className="text-stone-400 opacity-0 
                                            group-hover:opacity-100 cursor-pointer 
                                            hover:text-red-400 transition-opacity"
                                            onClick={() => {
                                                deleteOperation(file.id);
                                                onRecordInteraction();
                                            }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Profile */}
            <div className="flex-shrink-0 p-4 border-t border-[#2A1E22] bg-[#0E090B] z-10">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border
                 border--[#2A1E22] bg-[#160F12]">
                    <div className="w-6 h-6 rounded-full bg-[#C9A227] flex items-center 
                    justify-center text-[#0E090B] text-[10px] font-mono font-bold">
                        A
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase 
                    tracking-widest">
                        artigaund
                    </span>
                </div>
            </div>
        </div>
    )
}