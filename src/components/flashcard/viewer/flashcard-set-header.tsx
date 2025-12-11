/**
 * This component is used to show the title of the flashcard set
 */
'use client';

import React from "react";

interface FlashcardSetHeaderProps{
    setTitle: string
}
const FlashcardSetHeader: React.FC<FlashcardSetHeaderProps> = ({
    setTitle
}) => {
    return (
        <div>{setTitle}</div>
    )
}

export default FlashcardSetHeader;