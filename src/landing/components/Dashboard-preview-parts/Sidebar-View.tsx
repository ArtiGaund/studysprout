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
        <div className="w-64 border-r border-white/5 flex flex-col bg-[#080C0C] h-full overflow-hidden">
            {/* Top: Brand/Workspace Info */}
            <div className="flex-shrink-0 p-4 border-b border-white/5">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border
                border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center
                    justify-center text-purple-400">
                        <Briefcase size={16}/>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate">
                            Collaboration
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase font-black">
                            Workspace
                        </span>
                    </div>
                </div>
            </div>

            {/* Global Navigation */}
            <div className="flex-shrink-0 p-4 space-y-1 border-b border-white/5">
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
                            ? 'bg-white/5 text-white'
                            : 'text-gray-500 hover:text-gray-300'
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
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        Public
                    </span>
                </div>

                <div className="flex items-center justify-between mb-4 px-2 group">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        FOLDERS
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            id="guide-pdf-btn"
                            className="text-gray-600 hover:text-blue-400 transition-colors p-1
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
                        className="text-gray-500 hover:text-[#63FF9D] transition-colors p-1
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
                            <div className="flex items-center gap-2 group hover:bg-white/5 p-1.5
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
                                className="text-[#63FF9D] shrink-0"
                                />

                                {editingId === folder.id 
                                ? <input 
                                    ref={inputRef}
                                    className="bg-transparent border-none outline-none text-[11px]
                                    text-white w-full caret-[#63FF9D]"
                                    value={folder.name}
                                    onChange={(e) => updateName(folder.id, e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                    />
                                : <span 
                                    onDoubleClick={() => {
                                        setEditingId(folder.id);
                                        onRecordInteraction();
                                    }}
                                    className="text-[11px] text-gray-400 truncate flex-1 
                                    font-medium"
                                    >
                                        {folder.name}
                                    </span>
                                }
                                <div className="flex flex-row gap-2">
                                    <Plus 
                                        size={12}
                                        // Change: Ensure visibility during simulation steps
                                        className={`text-gray-400 transition-opacity
                                             cursor-pointer hover:text-[#63FF9D] ${
                                            editingId === folder.id || expandedFolders[folder.id] 
                                            ? 'opacity-100' 
                                            : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addFile(folder.id);
                                            onRecordInteraction();
                                        }}
                                    />
                                    <Trash 
                                    size={12}
                                    className={`text-gray-400 transition-opacity 
                                        cursor-pointer hover:text-[#63FF9D] ${
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
                                <div className="ml-5 border-l border-white/10 pl-3 space-y-1">
                                    {nodes.filter(n => n.parentId === folder.id).map(file => (
                                        <div
                                        id={`node-${file.id}`}
                                        key={file.id}
                                        className="flex items-center gap-2 p-1.5 hover:bg-white/5
                                        rounded-md group"
                                        >
                                            <FileText size={12} className="text-blue-500
                                             shrink-0"/>
                                            {editingId === file.id 
                                            ? <input
                                                ref={inputRef}
                                                className="bg-transparent border-none 
                                                outline-none text-[11px]
                                                text-white w-full caret-blue-400"
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
                                            className="text-[11px] text-gray-600 truncate
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
                                            className="text-gray-400 flex justify-end"
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
            <div className="flex-shrink-0 p-4 border-t border-white/5 bg-white/[0.01] z-10">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border
                 border-white/5
                bg-[#050A0A]">
                    <div className="w-6 h-6 rounded-full bg-[#63FF9D] flex items-center 
                    justify-center text-black text-[9px] font-black">
                        A
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        artigaund
                    </span>
                </div>
            </div>
        </div>
    )
}