
"use client"

import { File } from "@/model/file.model";
import React, { useCallback, useEffect } from "react"
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
import axios from "axios";
import { useDebounce } from "@/utils/hooks/useDebounce";
import { useToast } from "../ui/use-toast";


interface TextEditorProps{
    fileId: string;
    fileDetails: File;
    onChange: (value: string) => void;
    editable?:boolean;
    initialContent?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
    fileId,
    fileDetails,
    onChange,
    editable,
    initialContent
}) => {
    const { resolvedTheme } = useTheme()
    const { toast } = useToast();


    const handleUpload = async (file: globalThis.File): Promise<string | Record<string, any>> => {
        console.log("File upload triggered:", file.name);
        // file upload
        return ""
    }

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent 
        ? JSON.parse(initialContent) as PartialBlock[] 
        : undefined,
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
            const response = await axios.post(`/api/update-file`, {
                _id: fileId,
                data: parsedContent,
                lastUpdated: new Date()
            })
            if(!response.data.success){
                console.log("Error while updating file ",response.data.message);
                toast({
                    title: "Failed to update file",
                    description: response.data.message,
                    variant: "destructive"
                })
            }else{
                console.log("Content saved successfully for file ",fileId);
            }
        } catch (error) {
            console.log("Error while saving content for file ",error);
            toast({
                title: "Failed to save content",
                description: "Something went wrong",
                variant: "destructive"
            })
        }
    }, [fileId])

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
