
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


interface TextEditorProps{
    fileId: string;
    fileDetails: ReduxFile;
    onChange: (value: string) => void;
    editable?:boolean;
    // initialContent?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
    fileId,
    fileDetails,
    onChange,
    editable,
    // initialContent
}) => {
    const { resolvedTheme } = useTheme()
    const { toast } = useToast();

    const { updateFile } = useFile();

    const isUpdatingInternally = useRef(false);



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

    // Memoize the parsed content from fileDetails.data
    const initialContent = useMemo(() => {
        // let content: PartialBlock[] = [{ type: "paragraph", content: ""}];
        if(fileDetails.data && typeof fileDetails.data === "string" && fileDetails.data.trim() !== ''){
            try {
                const parsed = JSON.parse(fileDetails.data);
                if(Array.isArray(parsed)){
                    const content = parsed as PartialBlock[];
                    return parsed.length > 0 ? parsed : [{ type: "paragraph", content: ""}];
                }
            } catch (error) {
                console.error("Error parsing fileDetails.data of BlockNote initial content:: ",error);
            }
        }
        return [{ type: "paragraph", content: ""}];
        
    },[ fileDetails.data ])


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
            // Error is coming if used highlighter
            // createHighlighter: () =>
            //     createHighlighter({
            //         themes: [resolvedTheme === "dark" ? "github-dark" : "github-light"], // Use dynamic theme
            //         langs: [], // Shiki bundle handles this; often empty here if precompiled
            //     }),
        },
    });

    // 1. define the actual function that sends data to your backend
    const saveContentToBackend = useCallback(async (content: string) => {
        // console.log("Attempting to save content for file ",fileId);

        try {
            const parsedContent = JSON.parse(content);
            console.log("parsedContent ",parsedContent);

            isUpdatingInternally.current = true;

             // TODO: Consider using updateFile from useFile hook here instead of direct axios call
            // This would allow useFile to manage loading/error states and Redux updates.
            // Example:
            // const { updateFile } = useFile();
            // const response = await updateFile(fileId, { data: parsedContent, lastUpdated: new Date() });
            // if (!response.success) { ... }

           const response = await updateFile(fileId, {
            data: parsedContent,
            lastUpdated: new Date()
           })
            if(!response.success){
                console.log("Error while updating file ",response.error);
                toast({
                    title: "Failed to update file",
                    description: response.error,
                    variant: "destructive"
                })
            }else{
                console.log("Content saved successfully for file ",fileId);
            }
        } catch (error: any) {
            console.log("Error while saving content for file ",error);
            toast({
                title: "Failed to save content",
                description: error.message || "Something went wrong",
                variant: "destructive"
            })
        }finally{
            isUpdatingInternally.current = false;
        }
    }, [
        fileId,
        updateFile,
        toast
    ])

    // 2. Create a debounced version of your save function
    // This will call 'saveContentToBackend' 1000ms (1 second) after the last change
    const debouncedSave = useDebounce(saveContentToBackend, 1000);

    // 3. Attach the debounced save to the editor's content change listener
   useEffect(() => {
        if (!editor) return;

        editor.onEditorContentChange(() => {
            const currentContent = JSON.stringify(editor.topLevelBlocks);
            debouncedSave(currentContent);
            onChange(currentContent);
        });

    }, [editor, debouncedSave, onChange]); // Dependencies: editor, debouncedSave, onChange

    const serializedFileContent = useMemo(() => {
        return fileDetails?.data && typeof fileDetails.data === 'string' ? fileDetails.data : '';
    },[
        fileDetails?.data
    ])

    useEffect(() => {
        if(!editor || !fileDetails || !fileDetails.data) return;

        // If the update was initiated, don't re-synchronize immediately
        if(isUpdatingInternally.current){
            console.log("[TextEditor] Skipping external sync: internal update in progress");
            return;
        }

        let latestContent: PartialBlock[] = [{ type: "paragraph", content: ""}];

        if( serializedFileContent && serializedFileContent.trim() !==''){
            try {
                const parsed = JSON.parse(serializedFileContent);
                if(Array.isArray(parsed) && parsed.length > 0){
                    latestContent = parsed as PartialBlock[];
                }   
            } catch (error) {
                console.error("Error parsing fileDetails.data for editor synchronization:", error);
            }
        }
        const currentEditorContent = JSON.stringify(editor.topLevelBlocks);
        const latestPropContent = JSON.stringify(latestContent);

        if(currentEditorContent !== latestPropContent){
            console.log("[TextEditor] Synchonizing editor content with latest fileDetails.data");
            editor.replaceBlocks(editor.topLevelBlocks, latestContent);
        }
    },[
        editor,
        fileDetails,
        serializedFileContent
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
