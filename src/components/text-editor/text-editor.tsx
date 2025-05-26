"use client"

import { File } from "@/model/file.model";
import React from "react"
import { BlockNoteEditor, PartialBlock } from "@blocknote/core"
import { BlockNoteViewRaw, useBlockNote, useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine";

import "@blocknote/core/style.css"
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
    // const editor: BlockNoteEditor = useCreateBlockNote({
    //     initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
    //     onEditorContentChange: (editor) => {
    //         onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
    //     }
    // })

    const handleUpload = async (file: File): Promise<string> => {
        // file upload
        return ""
    }

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
        // onEditorContentChange: (editor: any) => {
        //     onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
        // },
        // uploadFile: handleUpload,
    });

    return(
        <div>
            <BlockNoteView  
                editor={editor}
                theme={ resolvedTheme === "dark" ? "dark" : "light" }
            />
        </div>
    )
}

export default TextEditor