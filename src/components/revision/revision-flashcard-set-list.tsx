'use client';

import React from "react";
import FlashcardSheet, { FlashcardSet } from "./flashcard-sheet";

interface RevisionFlashcardSetListProps{
    sets: FlashcardSet[];
    onOpen: (setId: string) => void;
    onDelete: (setId: string) => void;
}
const SectionHeader = ({ label }: { label: string }) => {
    return(
        <div className="flex sticky z-20 top-0 w-full h-8 justify-between items-center pr-4 pl-2">
            <span className="font-semibold ml-4 text-[12px] text-Neutrals/neutrals-8">
                {label}
            </span>
        </div>
    )
}
const RevisionFlashcardSetList: React.FC<RevisionFlashcardSetListProps> = ({
    sets,
    onOpen,
    onDelete
}) => {
    const workspaceSets = sets.filter(set => set.resourceType === "Workspace");
    const folderSets = sets.filter(set => set.resourceType === "Folder");
    const fileSets = sets.filter(set => set.resourceType === "File");
    return(
        <div className="">
            <span className="font-bold text-Neutrals/neutrals-8 text-[13px]">
                Flashcard Sets
            </span>
            
            {/* Workspace */}
            {workspaceSets.length > 0 && (
                <>
                     <SectionHeader label="WORKSPACE SHEETS"/>
                     {workspaceSets.map(set => (
                        <FlashcardSheet 
                            key={set._id}
                            set={set}
                            onOpen={onOpen}
                            onDelete={onDelete}
                        />
                    ))}
                </>
            )}
        
            {/* Folder */}
           {folderSets.length > 0 &&( 
                <>
                    <SectionHeader label="FOLDER SHEETS"/>
                    {folderSets.map(set => (
                        <FlashcardSheet 
                            key={set._id}
                            set={set}
                            onOpen={onOpen}
                            onDelete={onDelete}
                        />
                    ))}
                </>
            )}
           
            {/* File */}
            {fileSets.length > 0 &&(
                <>
                    <SectionHeader label="FILE SHEETS"/>
                    {fileSets.map(set => (
                    <FlashcardSheet 
                        key={set._id}
                        set={set}
                        onOpen={onOpen}
                        onDelete={onDelete}
                    />
                ))}
                </>
            )}
        </div>
    )
}

export default RevisionFlashcardSetList;