
"use client"

import { File } from "@/model/file.model";
import React, { useEffect } from "react"
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
