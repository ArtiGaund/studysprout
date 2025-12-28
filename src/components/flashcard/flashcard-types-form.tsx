/**
 * This component is used to create a new flashcard set.
 * 
 * - This component will accept input from the user and create a new flashcard set.
 * 
 */
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
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { Loader2 } from "lucide-react";
import RegenerateFlashcardSet from "./regenerate-flashcard-set";
import { GenerationPayload } from "@/services/flashcardServices";
import { useParams } from "next/navigation";

interface FlashcardTypesFormProps{
  closeFlashcardTypeSheet: () => void;
  openFlashcardSetViewerSheet: (setId: string) => void; 
}
const FlashcardTypesForm: React.FC<FlashcardTypesFormProps> = ({
  closeFlashcardTypeSheet,
  openFlashcardSetViewerSheet
}) => {

  const currentContext = useSelector((state: RootState) => state.context.currentResource);
  const { workspaceId, folderId } = useParams();

  const selectedResourceType = currentContext.type || 'Resource';
  const selectedResourceName = currentContext.title || 'Loading...';
  const MIN_CARDS = 5;
  const [ cardCount, setCardCount ] = useState<number | string>(MIN_CARDS);
  const [ lastPayload, setLastPayload] = useState<GenerationPayload | null>(null);
  const {
    generateCards,
    isGeneratingCards,
    existingSetId,
    showOverwriteModal,
    closeOverwriteModal
  } = useFlashcardGenerator({
    onSuccess: (setId) => {
      // close flashcard type sheet
      closeFlashcardTypeSheet();
      openFlashcardSetViewerSheet(setId);
    }
  });
  const handleSumbit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const finalCardCount = Number(formData.get('cardCount'));
      const desiredTypes: ('question-answer' | 'fill-in-the-blank' | 'mcq')[] = [];

      if(formData.has('question-answer')) desiredTypes.push('question-answer');
      if(formData.has('fill-in-the-blank')) desiredTypes.push('fill-in-the-blank');
      if(formData.has('mcq')) desiredTypes.push('mcq');

      if(
        !currentContext.id ||
        !currentContext.type ||
        finalCardCount < MIN_CARDS || 
        isNaN(finalCardCount) || 
        desiredTypes.length === 0
      ){
        console.error("[Flashcard-types-form] Validation failed", {
          hasId: !!currentContext.id,
          hasTypes: !!currentContext.type,
          cardCount: finalCardCount,
          typesSelected: desiredTypes.length
        });
        return;
      }

      const payload = {
        workspaceId: workspaceId,
        folderId: folderId ?? '',
        resourceId:currentContext.id,
        resourceType: currentContext.type,
        cardCount: finalCardCount,
        desiredTypes,
      }
      setLastPayload(payload);

      console.log("[flashcard-types-form] payload: ", payload);
      const result = await generateCards(payload);
    } catch (error) {
      console.warn("[Flashcard-types-form] Error submitting form: ",error);

    }
  }
 
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
           <form onSubmit={handleSumbit}>
            <div className="flex flex-col gap-3">
              <Label>Max Cards to Generate: 
                <span className="text-xs text-gray-700">(Min cards should be 5)</span></Label>
              <Input 
              id="max-cards"
              type="number" 
              name="cardCount"
              value={cardCount}
              min={MIN_CARDS}
              onChange={(e) => {
                const inputValue = e.target.value;
                if(inputValue === ""){
                  setCardCount("");
                  return;
                }
                setCardCount(Number(inputValue));
               
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
            <Checkbox id="question-answer" name="question-answer"/>
            <Label htmlFor="question-answer">Question & Answer </Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="fill-in-the-blank" name="fill-in-the-blank"/>
            <Label htmlFor="fill-in-the-blank">Fill-in-the-Blank (Cloze)</Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="mcq" name="mcq"/>
            <Label htmlFor="mcq">Multiple Choice (MCQ)</Label>
          </div>
        </div>
      
       
        <SheetFooter className="flex flex-col gap-4 justify-center items-center pt-6 pr-[3.3rem]">
         { isGeneratingCards 
         ?<Loader2 className="animate-spin"/> 
         :<Button
          className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800"
           type="submit">Generate Flashcard</Button>}
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
        </form>
        {showOverwriteModal && lastPayload && (
          <RegenerateFlashcardSet 
          flashcardSetId={existingSetId!}
          onClose={closeOverwriteModal}
          payload={lastPayload}
          onViewSet={(setId) => {
            closeOverwriteModal();
            closeFlashcardTypeSheet();
            openFlashcardSetViewerSheet(setId);
          }}
          />
        )}
        </SheetContent>
    )
}

export default FlashcardTypesForm;