"use client";

import TooltipComponent from "@/components/global/tooltip-component";
import InboxMergePicker from "@/components/inbox/inbox-merge-picker";
import { useToast } from "@/components/ui/use-toast";
import { useInbox } from "@/hooks/inbox/useInbox";
import { useInboxItems } from "@/hooks/inbox/useInboxItems";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { FolderInput, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function InboxPage(){
    
    const { 
        deleteInboxItem , 
        mergeInboxItem, 
        deleteInboxItemsBatch, 
        mergeInboxItemsBatch
    } = useInbox();
    const { 
        decrementInboxCount, 
        setInboxCount, 
        inboxVersion, 
        bumpInboxVersion 
    } = useRevisionSidebar();
    const { items, loading, removeItem, setItems, restoreItem } = useInboxItems(true, inboxVersion);

    const { toast } = useToast();
    const router = useRouter();
    const [ actioningId, setActioningId ] = useState<string | null>(null);
    const [ selectedIds, setSelectedIds ] = useState<Set<string>>(new Set());

    // Track pending-delete timers so Undo can cancel the real API call
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        if(!loading){
            setInboxCount(items.length);
        }
    },[ loading, items.length, setInboxCount ]);

    // Clean up any pending timers if the component unmounts mid-undo-window
    // useEffect(() => {
    //     return () => {
    //         pendingDeletes.current.forEach((timer) => clearTimeout(timer));
    //     }
    // },[]);

    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

    const toggleSelectAll = () => {
        if(allSelected){
            setSelectedIds(new Set());
        }else{
            setSelectedIds(new Set(items.map((item) => item._id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleDelete = async(inboxId: string) => {

        //1. Guard against duplicate click triggers
        if(pendingDeletes.current.has(inboxId)) return;

        const itemToDelete = items.find((item) => item._id === inboxId);
        if(!itemToDelete) return;

        //2. Immediate local removal
        removeItem(inboxId);
        decrementInboxCount();

        // 3. Set the 5- second delay before calling the server
        const timer = setTimeout(async () => {
            pendingDeletes.current.delete(inboxId);
            const result = await deleteInboxItem(inboxId);
            if(!result.success){
                toast({
                    title: "Failed to delete",
                    description: result.error ?? "Please try again",
                    variant: "destructive",
                });
                // Restore across all instances if server delete failes
                restoreItem(itemToDelete);
                setInboxCount(items.length + 1);
            }else{
                // Once permanently deleted on backend, bump version to ensure fresh sync
                bumpInboxVersion();
            }
        }, 5000);

        pendingDeletes.current.set(inboxId, timer);

        // 4. Show toast with safe Undo handler
        toast({
            title: "Deleted",
            description: "Item removed from your inbox",
            action: (
                <button
                    onClick={() => {
                        const pendingTimer = pendingDeletes.current.get(inboxId);
                        if(pendingTimer){
                            clearTimeout(pendingTimer);
                            pendingDeletes.current.delete(inboxId);
                        }
                        // Restore across ALL instances (InboxPage + InboxSidebar)
                        restoreItem(itemToDelete);
                        setInboxCount(items.length + 1);
                    }}
                    className="text-xs font-semibold text-[#63FF9D] hover:underline"
                >
                    Undo
                </button>
            ),
        });
    };

    const handleMergeConfirm = async (inboxId: string, fileId: string) => {
        setActioningId(inboxId);
        const result = await mergeInboxItem(inboxId, fileId);
        if(result.success){
            removeItem(inboxId);
            decrementInboxCount();
            bumpInboxVersion();

            const { workspaceId, folderId, fileTitle } = result.data ?? {};
            const fileUrl = workspaceId && folderId
                ? `/dashboard/${workspaceId}/${folderId}/${fileId}`
                : null;
            
            toast({
                title: "Merged",
                description: fileTitle 
                    ? `Added to "${fileTitle}"` : "Content added to the file successfully",
                action: fileUrl ? (
                    <button
                        onClick={() => router.push(fileUrl)}
                        className="text-xs font-semibold text-[#63FF9D] hover:underline"
                    >
                        Open file
                    </button>
                ) : undefined,
            });
        }else{
            toast({
                title: "Failed to merge",
                description: result.error ?? "The item is still in your inbox - please try again",
                variant: "destructive",
            });
        }
        setActioningId(null);
    };

    const handleBulkDelete = async () => {
       const selectedList = items.filter((item) => selectedIds.has(item._id));
       if(selectedList.length === 0) return;

       const bulkKey = `bulk_${Date.now()}`;
       const selectedCount = selectedList.length;

        // 1. Immediate local optimistic cleanup across all instances
        selectedList.forEach((item) => removeItem(item._id));
        setInboxCount(Math.max(0, items.length - selectedCount));
        clearSelection();
        
        // 2. Set 5-second delayed server execution
        const timer = setTimeout(async () => {
            pendingDeletes.current.delete(bulkKey);
            const itemIds = selectedList.map((item) => item._id);

            const result = await deleteInboxItemsBatch(itemIds);
            if(!result.success){
                toast({
                    title: "Failed to delete selected items",
                    description: result.error ?? "Please try again",
                    variant: "destructive",
                });
                // Restore all items if backend request fails
                selectedList.forEach((item) => restoreItem(item));
                bumpInboxVersion();
            }else{
                bumpInboxVersion();
            }
        }, 5000);

        pendingDeletes.current.set(bulkKey, timer);

        // 3. Display Toast with Undo action
        toast({
            title: "Deleted",
            description: `${selectedCount} item(s) removed from inbox`,
            action: (
                <button
                    onClick={() => {
                        const pendingTimer = pendingDeletes.current.get(bulkKey);
                        if(pendingTimer){
                            clearTimeout(pendingTimer);
                            pendingDeletes.current.delete(bulkKey);
                        }
                        // Restore items back into state across UI components
                        selectedList.forEach((item) => restoreItem(item));
                        setInboxCount(items.length + selectedList.length);
                    }}
                    className="text-xs font-semibold text-[#63FF9D] hover:underline"
                >
                    Undo
                </button>
            )
        })
    };

    const handleBulkMerge = async (fileId: string) => {
        const selectedList = items.filter((item) => selectedIds.has(item._id));
        if(selectedList.length === 0) return;

        // Sort items chronologically (Oldest first) using createdAt timestamp
        const sortOldestToNewest = [ ...selectedList].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const targetIds = sortOldestToNewest.map((item) => item._id);

        const result = await mergeInboxItemsBatch(targetIds, fileId);

        if(result.success){
            // Optimistically remove processed items
            targetIds.forEach((id) => removeItem(id));
            setInboxCount(Math.max(0, items.length - targetIds.length));
            clearSelection();
            bumpInboxVersion();

            const { workspaceId, folderId, fileTitle } = result.data ?? {};
            const fileUrl = workspaceId && folderId
                ? `/dashboard/${workspaceId}/${folderId}/${fileId}`
                : null;

            toast({
                title: "Merged",
                description: fileTitle
                    ? `Merged ${targetIds.length} item(s) into ${fileTitle}`
                    : "Selected items merged successfully",
                action: fileUrl ? (
                    <button
                        onClick={() => router.push(fileUrl)}
                        className="text-xs font-semibold text-[#63FF9D] hover:underline"
                    >
                        Open file
                    </button>
                ) : undefined,
            });
        }else{
            toast({
                title: "Failed to merge items",
                description: result.error ?? "An error occurred while merging",
                variant: "destructive",
            });
        }
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-white">Inbox</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Content captured from the browser extension, waiting to be filed.
                </p>
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}

            {!loading && items.length === 0 && (
                <p className="text-gray-500">
                    Nothing captured yet. Right-click any text on the web and choose{" "}
                    <span className="text-[#63FF9D]">Save to Studysprout</span>.
                </p>
            )}

            {items.length > 0 && (
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5
                rounded-xl px-4 py-2.5 mb-4">
                     <input 
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                            if(el) el.indeterminate = someSelected;
                        }}
                        onChange={toggleSelectAll}
                        disabled={items.length === 0}
                        className="accent-[#63FF9D] cursor-pointer disabled:cursor-not-allowed
                        disabled:opacity-30 w-4 h-4"
                    />
                    <span className="text-xs text-gray-400 select-none min-w-[70px]">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select all`}
                    </span>

                    {selectedIds.size > 0 && (
                        <div className="flex gap-1 items-center border-l border-white/10 pl-3
                        ml-1 animate-in fade-in duration-150">
                            <InboxMergePicker onConfirm={handleBulkMerge}>
                                <TooltipComponent message="Merge Selected">
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-[#63FF9D]
                                        hover:bg-white/5 rounded-lg transition"
                                    >
                                        <FolderInput size={16}/>
                                    </button>
                                </TooltipComponent>
                            </InboxMergePicker>
                            <TooltipComponent message="Delete Selected">
                                <button
                                    onClick={handleBulkDelete}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5
                                    rounded-lg transition"
                                >   
                                    <Trash size={16}/>
                                </button>
                            </TooltipComponent>
                        </div>
                    )}
                </div>
            )}
           
            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item._id}
                        className={`bg-white/[0.03] border rounded-2xl p-5 flex justify-between
                            items-start gap-4 transition-colors ${selectedIds.has(item._id)
                                ? "border-[#63FF9D]/30 bg-white/[0.05]" 
                                : "border-white/5"
                            }`}
                    >
                        <input 
                            type="checkbox"
                            checked={selectedIds.has(item._id)}
                            onChange={() => toggleSelect(item._id)}
                            className="mt-1 accent-[#63FF9D] cursor-pointer w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase tracking-wide text-[#63FF9D]">
                                {item.type}
                            </span>
                            <p className="text-gray-200 text-sm mt-2 whitespace-pre-wrap">
                                {item.content}
                            </p>
                            <span className="text-xs text-gray-600 mt-3 block">
                                {formatRelativeTime(item.createdAt)}
                            </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <InboxMergePicker
                                onConfirm={(fileId) => handleMergeConfirm(item._id, fileId)}
                            >
                                <TooltipComponent message="Merge in file">
                                    <button
                                        disabled={actioningId === item._id}
                                        className="p-1.5 text-gray-400 hover:text-[#63FF9D]
                                        hover:bg-white/5 rounded-lg transition disabled:opacity-50"
                                    >
                                        <FolderInput size={16}/>
                                    </button>
                                </TooltipComponent>
                            </InboxMergePicker>
                            <TooltipComponent message="Delete this item">
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    disabled={pendingDeletes.current.has(item._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 
                                    hover:bg-white/5 rounded-lg transition disabled:opacity-50"
                                >
                                    <Trash size={16}/>
                                </button>
                            </TooltipComponent>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}