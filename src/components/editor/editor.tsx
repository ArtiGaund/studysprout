
/**
 * @component TextEditor
 * @description A state-of-the-art collaborative editor built with BlockNote and Yjs.
 * * * Key Technical Features:
 * - CRDT Integration: Uses Yjs (Y.Doc) to ensure conflict-free real-time synchronization.
 * - Binary Serialization: Handles MongoDB Buffer-to-Uint8Array conversions for efficient 
 * database hydration and low-latency socket transmission.
 * - Awareness/Presence: Syncs cursor positions and user metadata (name/color) across clients.
 * - Custom Provider: Implements a SocketCollaborationProvider to bridge Yjs with 
 * a custom Socket.io backend.
 * - Extensible Schema: Configured with multi-language code blocks and advanced table support.
 */

"use client"
import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine";

import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@/app/styles/blocknote-overrides.css"
import { useToast } from "../ui/use-toast";

// Yjs & Protocols
import * as Y from "yjs";
import { 
    Awareness,
    applyAwarenessUpdate,
    encodeAwarenessUpdate
} from "y-protocols/awareness";

import { cursorColor } from "@/utils/cursor-color";
import { useSocket } from "@/lib/providers/socket-provider";
import { getWordAtCursor } from "@/utils/intelligence/get-word-at-cursor";
import { useBacklinks } from "@/hooks/intelligence/useBacklinks";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { selectCurrentFile } from "@/store/selectors/fileSelector";

/**
 * @class SocketCollaborationProvider
 * @description A custom bridge between the Yjs document and the Socket.io instance.
 * Required for BlockNote to recognize the socket as a valid collaboration source.
 */
class SocketCollaborationProvider{
    constructor(public doc: Y.Doc, public awareness: Awareness){}
    destroy() {}
    connect() {}
    disconnect() {}
}
interface TextEditorProps{
    fileId: string;
    initialContentBinary: Uint8Array | null; //Binary content
    username: string;
    editable?:boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
    fileId,
    initialContentBinary,
    username,
    editable,
}) => {
    const { socket, isConnected } = useSocket();
    const isHydrated = useRef(false);
    console.log("[Editor] mount check - fileId:", fileId, "isHydrated:", isHydrated.current, "initialContentBinary length:", initialContentBinary?.length);
    const { toast } = useToast();
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const currentFile = useSelector(selectCurrentFile);

    const {
        activeBacklink,
        checkWordAtCursor,
    } = useBacklinks(currentWorkspace?._id!, currentFile?._id!);

    // --- 1. SHARED STATE INITIALIZATION ---
    // Initialize the Y.Doc as a singleton for the lifecycle of this file
    const doc = useMemo(() => new Y.Doc(), [fileId]);
    const awareness = useMemo(() => new Awareness(doc), [doc]);

    // Create the provider instance for BlockNote's collaboration engine
    const provider = useMemo(() => new SocketCollaborationProvider(doc, awareness),
     [
        doc,
        awareness
    ]);
     const fragment = useMemo(() => doc.getXmlFragment("document-content"),[doc])
     const userColor = useMemo(() => cursorColor(username), [username]);

     /**
     * @callback onRemoteUpdate
     * Merges binary updates from other users into the local Y.Doc.
     */
     const onRemoteUpdate = useCallback((update: Uint8Array) => {
            // Yjs handles the math of merging this updates safely
           try {
             Y.applyUpdate(doc, new Uint8Array(update));
           } catch (error) {
                console.error("[Editor] Remote update error: ",error);
           }
        },[doc]);

    // --- 2. CONTENT SYNCHRONIZATION EFFECT ---
    useEffect(() => {
        if(!socket || !isConnected) return;
        
        isHydrated.current = false;

        socket.emit("file:join", {fileId});

        /**
         * @logic Hydration
         * Converts MongoDB Buffer objects into Uint8Arrays to hydrate the Y.Doc.
         * Ensures the "rehydration" origin is specified to prevent echo-loops.
         */
        if(initialContentBinary && initialContentBinary.length > 0){
            try {
                // MongoDB often return Buffers as { type: 'Buffer', data: [...]}
                const raw = initialContentBinary as any;
                console.log("[Editor] raw type check:", {
                    isArray: Array.isArray(raw),
                    isUint8Array: raw instanceof Uint8Array,
                    hasDataProp: !!raw?.data,
                    rawKeys: typeof raw === "object" ? Object.keys(raw).slice(0, 5) : raw,
                    });
                const uint8Array = raw.data 
                ? new Uint8Array(raw.data)
                : (raw instanceof Uint8Array ? raw : new Uint8Array(raw));
                console.log("[Editor] converted uint8Array length:", uint8Array.length);
                if(uint8Array.length > 0 && !isHydrated.current){
                    doc.transact(() => {
                        Y.applyUpdate(doc, uint8Array, "rehydration");
                    }, "rehydration");
                    const availableType = Array.from(doc.share.keys());
                    isHydrated.current = true;
                }
                // socket.emit("file:update-raw", { fileId, update: uint8Array });
            } catch (error) {
                console.error("[Editor] Failed to hydrate Y.Doc: ",error);
            }
        } 
     
        // Listen for remote document changes
       socket.on("file:update-raw", onRemoteUpdate);

        // Emit local document changes (filtered to avoid re-emitting remote updates)
        const onDocUpdate = (update: Uint8Array, origin: any) => {
            console.log("[Editor] local doc update, origin:", origin);
            if(origin === "remote") return;
                socket.emit("file:update-raw", { fileId, update }); 
        };

        doc.on("update", onDocUpdate );

        return () => {
            socket.off("file:update-raw", onRemoteUpdate);
            doc.off("update", onDocUpdate);
        };
    },[
        doc,
        fileId,
        initialContentBinary,
        fragment,
        socket,
        isConnected,
    ])

    // --- 3. AWARENESS (PRESENCE) EFFECT ---
    useEffect(() => {
        if(!socket || !awareness || !isConnected) return;

        //1. Receive awareness updates from others
        const onAwarenessRemote = ( update: Uint8Array ) => {
           applyAwarenessUpdate(awareness, new Uint8Array(update), "remote");
        };

        // 2. Send local awareness 
        const onAwarenessLocal = ({
            added,
            updated,
            removed,
        }: any) => {
            const changedClients = added.concat(updated).concat(removed);
            const update = encodeAwarenessUpdate(awareness, changedClients);
            socket.emit("file:awareness-update", { fileId, update });
        };

        socket.on("file:awareness-update", onAwarenessRemote);
        awareness.on("update", onAwarenessLocal);

        // Broadcast local user metadata for cursor labels
        awareness.setLocalStateField("user", {
            name: username,
            color: userColor,
        });

        return () => {
            socket.off("file:awareness-update", onAwarenessRemote);
            awareness.off("update", onAwarenessLocal);
            awareness.setLocalStateField("user", null);
        }

    },[
        awareness,
        fileId,
        username,
    ])

    const handleUpload = async (file: globalThis.File): Promise<string | Record<string, any>> => {
       
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if(!data.data?.url) throw new Error("Upload failed");

        toast({
            title: "File Upload",
            description: "File upload functionality is not yet implemented.",
            variant: "default"
        });
        return data.data.url;
    }
   
    // --- 4. EDITOR CONFIGURATION ---
    const editor = useCreateBlockNote({
        uploadFile: handleUpload,
        // Advanced table and formatting configuration
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

        // Collaboration property
        collaboration: {
            fragment,
            user: {
                name: username,
                color: "#10b981",
            },
            provider: provider, 
        }
    });

    editor.onChange(() => {
        const phrase = getWordAtCursor(editor);
        checkWordAtCursor(phrase);
    });

    // Render the backlink indicator
    {activeBacklink && (
        <div className="backlink-chip">
            <span>📎 Defined in:</span>
            {activeBacklink.files.map(f => (
                <a
                key={f.id}
                href={`/file/${f.id}`}
                >
                    {f.title}
                </a>
            ))}
        </div>
    )}
    return(
        <div className="p-1">
            <BlockNoteView  
                editor={editor}
                theme= "dark"
                editable={editable}
            />
        </div>
    )
}


export default TextEditor
