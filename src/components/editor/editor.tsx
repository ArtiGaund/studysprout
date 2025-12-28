
"use client"

import { File } from "@/model/file.model";
import React, { useCallback, useEffect, useMemo, useRef } from "react"
import {
     BlockNoteEditor,
      BlockNoteSchema,
      defaultBlockSpecs,
      PartialBlock, 
    } from "@blocknote/core"
import { 
    BlockNoteViewRaw,
     useBlockNote,
      useCreateBlockNote
     } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine";

import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@/app/styles/blocknote-overrides.css"
import { useTheme } from "next-themes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "../ui/use-toast";
import { ReduxFile } from "@/types/state.type";
import { useFile } from "@/hooks/useFile";
import {  normalizeBlockUI } from "@/utils/block/normalizeBlock";
import { createSlottable } from "@radix-ui/react-slot";


interface TextEditorProps{
    fileId: string;
    fileDetails: ReduxFile;
    onChange: (value: string) => void;
    editable?:boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
    fileId,
    fileDetails,
    onChange,
    editable,
}) => {
    const { resolvedTheme } = useTheme()
    const { toast } = useToast();

    const {
        //  updateFile
        addBlockHandler,
        updateBlockHandler,
        deleteBlockHandler, 
    } = useFile();

    const isInitializeRef = useRef(false);
    const prevBlocksRef = useRef<Record<string,any>>({});
    const pendingAdds = useRef(new Set<string>());
    const persistedBlockRef = useRef<Set<string>>(new Set());
    const persistedSnapshotRef = useRef<Record<string, string>>({});
    
    // Ref for debounce
    const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({}); 
    
    const handleUpload = async (file: globalThis.File): Promise<string | Record<string, any>> => {
        console.log("File upload triggered:", file.name);
        // file upload
        // TODO: Implement actual file upload logic to your backend/storage
        // This should return the URL of the uploaded file
        toast({
            title: "File Upload",
            description: "File upload functionality is not yet implemented.",
            variant: "default"
        });
        return "";
    }
    // console.log("[editor] fileDetails: ",fileDetails);

    // Memoize the parsed content from fileDetails.data
    // const initialContent = useMemo(() => {
    //     const data = fileDetails.data;
    //     let contentToUse: PartialBlock[] | null = null;
    //     if(data){
    //         if(typeof data === "string" && data.trim() !== ""){
    //              try {
    //                 contentToUse = JSON.parse(data) as PartialBlock[];
               
    //         } catch (error) {
    //             console.error("Error parsing fileDetails.data of BlockNote initial content:: ",error);
    //         }
    //         }else if(Array.isArray(data)){
    //             contentToUse = data as PartialBlock[];
    //         }else if(typeof data === "object" && Object.keys(data).length === 0){
    //             contentToUse = [{ type: "paragraph", content: []}] as PartialBlock[];
    //         }
           
    //     }

    //     if(Array.isArray(contentToUse) && contentToUse.length > 0){
            
    //         // CRITICAL CHECK: Does the first block actually have content ?
    //         // If it's a single block with content: [], the whole file is empty.

    //         const hasVisibleContent = contentToUse.some(
    //             block => 
    //                 block.content &&
    //                 Array.isArray(block.content) &&
    //                 block.content.length > 0
    //         );


    //         if(hasVisibleContent){
    //             return contentToUse;
    //         }
            
    //     }
    //     return [{ type: "paragraph", content: []}] as PartialBlock[];
        
    // },[ fileDetails.data ])

    // console.log("[editor] fileDetails: ",fileDetails);

    const initialContent = useMemo<PartialBlock[]>(() => {
        const blocks = fileDetails.blocks;
        const order = fileDetails.blockOrder;

        if(!blocks || !order || order.length === 0){
            return [{
                type: "paragraph",
                content: []
            }] as PartialBlock[];
        }

        const mapped = order
        .map(id => blocks[id])
        .filter(Boolean)
        .map( block => ({
            id: block.id,
            type: block.type,
            content: block.content,
            props: block.props ?? {},
            children: [],
        })) as PartialBlock[];

        if(mapped.length === 0){
            return [{
                type: "paragraph",
                content: [],
            }] as PartialBlock[];
        }
        return mapped;
    },[
        fileDetails.blocks,
        fileDetails.blockOrder
    ])


    
    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent,
        uploadFile: handleUpload,
        tables: {
            splitCells: true,
            cellBackgroundColor: true,
            cellTextColor: true,
            headers: true,
        },
        codeBlock: {
            indentLineWithTab: true,
            defaultLanguage: "typescript",
            supportedLanguages: {
                typescript: {
                    name: "Typescript",
                    aliases: ["ts"],
                },
                plaintext:{
                    name: "Plain Text",
                    aliases: ["txt"],
                },
                c:{
                    name: "C",
                    aliases: ["c"],
                },
                cpp:{
                    name: "C++",
                    aliases: ["cpp"],
                },
                css:{
                    name: "CSS",
                    aliases: ["css"],
                },
                html:{
                    name: "HTML",
                    aliases: ["html"],
                },
                java:{
                    name: "Java",
                    aliases: ["java"],
                },
                javascript:{
                    name: "Javascript",
                    aliases: ["js"],
                },
                json: {
                    name: "JSON",
                    aliases: ["json"],
                },
                python: {
                    name: "Python",
                    aliases: ["py"],
                },
                rust: {
                    name: "Rust",
                    aliases: ["rs"],
                },
                markdown: {
                    name: "Markdown",
                    aliases: ["md"],
                },
                sql: {
                    name: "SQL",
                    aliases: ["sql"],
                },
                xml: {
                    name: "XML",
                    aliases: ["xml"],
                },
                yaml: {
                    name: "YAML",
                    aliases: ["yaml"],
                },

            },
        },
    });

        useEffect(() => {
            if(!fileDetails?.blocks){
                // console.log("[editor] fileDetails not available yet");
                return;
            }
            Object.values(fileDetails.blocks).forEach(block => {
                persistedBlockRef.current.add(block.id);
                persistedSnapshotRef.current[block.id] = JSON.stringify(normalizeBlockUI(block));
            });
        },[
            fileDetails.blocks
        ])

   useEffect(() => {
    if(!editor) return;

    if(!isInitializeRef.current){
        const map: Record<string, any> = {};
        editor.topLevelBlocks.forEach(block => {
            (map[block.id] = block);
        });
        prevBlocksRef.current = map;
        isInitializeRef.current = true;
        return;
    }

    return editor.onChange(() => {
        const currentBlocks = editor.topLevelBlocks;
        const prevMap = prevBlocksRef.current;

        const currentMap: Record<string, any> = {};
        currentBlocks.forEach( block => currentMap[block.id] = block);

        for(const id in currentMap){
            const currentBlock = currentMap[id];
            if(!persistedBlockRef.current.has(id)){
                if(pendingAdds.current.has(id)) continue;
                if(currentBlock.content.length === 0) continue;

                // ignore empty placeholder block
                const isEmptyText = currentBlock.content.length === 1 &&
                currentBlock.content[0]?.text === "";

                if(isEmptyText) continue;

                // ignore slash command placeholder
                const isSlashOnly = 
                currentBlock.type === "paragraph" &&
                currentBlock.content.length === 1 &&
                currentBlock.content[0]?.text === "/";

                if(isSlashOnly) continue;

               
                pendingAdds.current.add(id);

                // console.log(`[editor][add check] persistedBlockRef: ${persistedBlockRef} and pendingAdds: ${pendingAdds} are added`);

                const index = currentBlocks.findIndex(block => block.id === id);
                const afterBlockId = currentBlocks[index-1]?.id ?? null;

                // console.log("[editor] currentBlock: ",currentBlock);
                addBlockHandler(fileId, normalizeBlockUI(currentBlock), afterBlockId)
                .then((res) => {
                    if(res?.success){
                        persistedBlockRef.current.add(id);
                        const stable = normalizeBlockUI(res.data);
                        persistedSnapshotRef.current[id] = JSON.stringify(normalizeBlockUI(createSlottable));
                    }
                })
                .finally(() => {
                    pendingAdds.current.delete(id);
                    persistedBlockRef.current.add(id);
                });
                // console.log("[editor][successfully added the block] ")
                continue;
            }

            // console.log("[editor] Going for updating block");
           const isPersistedBlockRef = persistedBlockRef.current.has(id);
           const isPending = pendingAdds.current.has(id);
        //    console.log("[editor][update-check]", {
        //     id,
        //     isPersistedBlockRef,
        //     isPending,
        //     snapshot: persistedSnapshotRef.current[id],
        //    })
            if (
                !isPersistedBlockRef ||
                isPending 
            ) {
                // console.log("[editor][update-skip]", {
                //     id,
                //     isPersistedBlockRef,
                //     isPending,
                // })
                continue; // NEVER PATCH
                }

                // console.log("[editor] Block is persisted and not pending add");
                if (currentBlock.content.length === 0) {
            continue;
            }
            //  console.log("[editor] Block has content");

            //  const reduxBlock = fileDetails.blocks?.[id];

            // if(!reduxBlock) continue;
           
            // console.log("[editor] Block exists in redux"); 
            const normalized = normalizeBlockUI(currentBlock);
            const serialized = JSON.stringify(normalized);
            // console.log(`[editor] persistedSnapshotRef.current[id]: ${persistedSnapshotRef.current[id]} and  serialized: ${serialized}`);

           
            // console.log({
            //     id,
            //     persisted: persistedBlockRef.current.has(id),
            //     pending: pendingAdds.current.has(id),
            //     snapshot: persistedSnapshotRef.current[id],
            //     now: JSON.stringify(normalizeBlockUI(currentBlock))
            //     });

            if(persistedSnapshotRef.current[id] === serialized) continue;

            // console.log("[editor] Block has changed");

            clearTimeout(updateTimeoutRef.current[id]);

             updateTimeoutRef.current[id] = setTimeout(() => {
                 updateBlockHandler(
                    fileId,
                    id,
                    normalized,
                );
                persistedSnapshotRef.current[id]= serialized;
             }, 400); 
        }

        for(const id in prevMap){
            if(!currentMap[id]){
                deleteBlockHandler(fileId, id);
                persistedBlockRef.current.delete(id);
                delete persistedSnapshotRef.current[id];
            }
        }
        prevBlocksRef.current = currentMap;
        onChange("dirty");
        
    });
   },[
        editor,
        fileId,
        addBlockHandler,
        updateBlockHandler,
        deleteBlockHandler,
        onChange
   ])

        //    Flush on blur
       useEffect(() => {
        if(!editor) return;

        const flushUpdates = () => {
            Object.entries(updateTimeoutRef.current).forEach(([id, timeout]) => {
                clearTimeout(timeout);

                const block = editor.topLevelBlocks.find(b => b.id === id);
                if(!block) return;

                const normalized = normalizeBlockUI(block);
                updateBlockHandler(fileId, id, normalized);
                persistedSnapshotRef.current[id] = JSON.stringify(normalized);
            });
        };

        editor.domElement?.addEventListener("blur", flushUpdates, true);

        return () => {
            editor.domElement?.removeEventListener("blur", flushUpdates, true);
        };
       },[
        editor,
        fileId,
        updateBlockHandler
       ])

    return(
        <div className="p-5">
            <BlockNoteView  
                editor={editor}
                theme={ resolvedTheme === "dark" ? "dark" : "light" }
                editable={editable}
            />
        </div>
    )
}


export default TextEditor
