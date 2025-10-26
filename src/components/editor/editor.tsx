
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
    // const isInitialContentSaved = useRef(true);


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
        console.log("[TextEditor] fileDetails.data: ",fileDetails);
        const data = fileDetails.data;
        let contentToUse: PartialBlock[] | null = null;
        if(data){
            console.log("[TextEditor] fileDetails.data is a string");
            if(typeof data === "string" && data.trim() !== ""){
                 try {
                    contentToUse = JSON.parse(data) as PartialBlock[];
                    console.log("[TextEditor] parsed from string : ",contentToUse);
               
            } catch (error) {
                console.error("Error parsing fileDetails.data of BlockNote initial content:: ",error);
            }
            }else if(Array.isArray(data)){
                contentToUse = data as PartialBlock[];
                console.log("[TextEditor] Using pre-parsed Array: ",contentToUse);
            }else if(typeof data === "object" && Object.keys(data).length === 0){
                console.log("[TextEditor] Data is an empty object, treating as empty content.")
                contentToUse = [{ type: "paragraph", content: []}] as PartialBlock[];
            }
           
        }

        if(Array.isArray(contentToUse) && contentToUse.length > 0){
            
            // CRITICAL CHECK: Does the first block actually have content ?
            // If it's a single block with content: [], the whole file is empty.

            const hasVisibleContent = contentToUse.some(
                block => 
                    block.content &&
                    Array.isArray(block.content) &&
                    block.content.length > 0
            );


            if(hasVisibleContent){
                console.log("[TextEditor] Using pre-parsed Array in Array: ",contentToUse);
                return contentToUse;
            }
            
        }
        return [{ type: "paragraph", content: []}] as PartialBlock[];
        
    },[ fileDetails.data ])

    const isFileContentReady = fileDetails && (
        (typeof fileDetails.data === "string") ||
        (Array.isArray(fileDetails.data)) ||
        (fileDetails.data !== undefined)
    );

    
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

        // check 1: define the signature of an empty BlockNote document
        const defaultEmptyContent = JSON.stringify([{ 
            type: "paragraph", 
            props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
            content: [],
            children: []
        }]);
        // check 2: If the content is empty OR is just the default empty block,, ABORT.
        if(!content || content.trim() === '[]' || content.trim() === defaultEmptyContent.trim()){
            console.log("[TextEditor] Save Aborted. Content is empty or default template. Not Saving.");
            return;
        }
        try {
           
            isUpdatingInternally.current = true; 

           const response = await updateFile(fileId, {
            data: content,
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

            if(isUpdatingInternally.current) return;
            // 2. Only call debouncedSave for subsequent, ge
            debouncedSave(currentContent);
            onChange(currentContent);
        });

    }, [editor, debouncedSave, onChange]); // Dependencies: editor, debouncedSave, onChange

    
    if (Array.isArray(initialContent)) {
    // Check the final data going into the editor just before it renders
    console.log("FINAL EDITOR CONTENT PASSED:", initialContent); 
}
    if(!isFileContentReady){
        return(
            <div className="p-5 text-center text-gray-500">
                Loading note content...
            </div>
        )
    }
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
