'use client';

import ResourcePickerModel from "../resource-picker/resource-picker";
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../ui/sheet";
import { useFile } from "@/hooks/useFile";
import { useFolder } from "@/hooks/useFolder";
import { useWorkspace } from "@/hooks/useWorkspace";
import React, { useEffect, useState } from "react";
import { IconFolderOpen } from "@tabler/icons-react"
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const FlashcardTypesForm = () => {

  const currentContext = useSelector((state: RootState) => state.context.currentResource);

  const selectedResourceType = currentContext.type || 'Resource';
  const selectedResourceName = currentContext.title || 'Loading...';
  const MIN_CARDS = 5;
  const [ cardCount, setCardCount ] = useState<number | string>(MIN_CARDS);
    return (
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Customize Flashcard Generation</SheetTitle> 
                <SheetDescription>
                  Make changes to your flashcards, according to your need.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-6"/>
             <div className="flex flex-col gap-3">
                <Label>Current Content: [ Selected {selectedResourceType}: {selectedResourceName} ]</Label>
                <div>
                  <ResourcePickerModel>
                    <div className="flex flex-row gap-3">
                      <button>
                        <IconFolderOpen />
                      </button>
                      <span className="text-sm text-gray-700 cursor-not-allowed">Change source</span>
                    </div>
                  </ResourcePickerModel>
                </div>
           </div>
           <Separator className="my-6"/>
            <div className="flex flex-col gap-3">
              <Label>Max Cards to Generate: 
                <span className="text-xs text-gray-700">(Min cards should be 5)</span></Label>
              <Input 
              id="max-cards"
              type="number" 
              value={cardCount}
              min={MIN_CARDS}
              onChange={(e) => {
                const inputValue = e.target.value;
                if(inputValue === ''){
                  setCardCount('');
                }else if( Number(inputValue) < MIN_CARDS){
                  setCardCount(MIN_CARDS);
                }else{
                   setCardCount(Number(inputValue));
                }
               
              }}
              onBlur={() => {
                if(cardCount === '' || Number(cardCount) < MIN_CARDS || isNaN(Number(cardCount))){
                  setCardCount(MIN_CARDS);
                }
              }}
              />
            </div>
              <Separator className="my-6"/>
            <div>
                <Label>Question Format:</Label>
            </div>
            <div className="grid flex-1 auto-rows-min gap-6 px-4 pt-5">
          <div className="flex flex-row gap-3">
            <Checkbox id="question-answer" />
            <Label htmlFor="question-answer">Question & Answer </Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="fill-in-the-blank" />
            <Label htmlFor="fill-in-the-blank">Fill-in-the-Blank (Cloze)</Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="mcq" />
            <Label htmlFor="mcq">Multiple Choice (MCQ)</Label>
          </div>
        </div>
      
       
        <SheetFooter className="flex flex-col gap-4 justify-center items-center pt-6 pr-[3.3rem]">
          <Button
          className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800"
           type="submit">Generate Flashcard</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
        </SheetContent>
    )
}

export default FlashcardTypesForm;