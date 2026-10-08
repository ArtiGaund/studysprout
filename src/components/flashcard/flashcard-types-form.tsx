/**
 * @component FlashcardTypesForm
 * @description A sophisticated multi-step generation form that interfaces with 
 * an AI backend via WebSockets to generate study materials.
 * * * Core Technical Competencies:
 * - Distributed Locking: Implements a "Lock/Grant" pattern via Socket.io to prevent 
 * multiple users from triggering AI generation on the same resource simultaneously.
 * - Dynamic Context Awareness: Extracts parameters from Redux (`currentResource`) 
 * and the URL (`useParams`) to determine the generation scope.
 * - Optimistic Validation: Ensures minimum payload requirements (card count, types) 
 * are met before initiating expensive AI processes.
 * - State Persistence: Tracks `lastPayload` to support regeneration or overwriting 
 * existing flashcard sets without data loss.
 */

'use client';

import ResourcePickerModel from "../resource-picker/resource-picker";
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter,
  SheetHeader,
  SheetTitle
 } from "../ui/sheet";
import React, { useState } from "react";
import { IconFolderOpen } from "@tabler/icons-react"
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { Loader2 } from "lucide-react";
import RegenerateFlashcardSet from "./regenerate-flashcard-set";
import { GenerationPayload } from "@/services/flashcardServices";
import { useParams } from "next/navigation";
import { useFlashcardGenerationLock } from "@/hooks/flashcard/useFlashcardGenerationLock";
import { useSocket } from "@/lib/providers/socket-provider";
import { useUser } from "@/lib/providers/user-provider";
import { toast } from "../ui/use-toast";
import { useFlashcardUsage } from "@/hooks/flashcard/useFlashcardUsage";
import { ComingSoonTooltip } from "../ui/coming-soon-tooltip";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";

const FlashcardTypesForm: React.FC = () => {
  // --- Context & Navigation ---
  const currentContext = useSelector((state: RootState) => state.context.currentResource);
  const { workspaceId, folderId } = useParams();

  const {
    closeFlashcardTypeSheet,
    openFlashcardSetViewerSheet,
  } = useRevisionSidebar();

  const selectedResourceType = currentContext.type || 'Resource';
  const selectedResourceName = currentContext.title || 'Loading...';
  const MIN_CARDS = 5;

  // --- Local State Management ---
  const [ cardCount, setCardCount ] = useState<number | string>(MIN_CARDS);
  const [ lastPayload, setLastPayload] = useState<GenerationPayload | null>(null);
  const [ isRequestinglock, setIsRequestingLocks ] = useState(false);

  // --- Custom Hooks for AI Generation ---
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

  const currentWorkspaceId = typeof workspaceId === "string" ? workspaceId : undefined;
  const { refreshUsage } = useFlashcardUsage(currentWorkspaceId);

  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  // Real-time hook to check if another user has locked this resource
  const {
    isCurrentResourceBusy,
  } = useFlashcardGenerationLock(
    workspaceId as string,
     currentContext.id as string
  ); 

  /**
   * @handler handleSubmit
   * Orchestrates the complex handshaking process:
   * 1. Validates local form data.
   * 2. Requests a generation lock via WebSocket.
   * 3. Awaits "lock_granted" event before calling the AI API.
   * 4. Releases lock via "request_gen_end" upon completion or error.
   */
  const handleSumbit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard Clause: Prevent redundant requests if socket is disconnected or resource is busy
    if(!socket || !isConnected || isCurrentResourceBusy) return;

    setIsRequestingLocks(true);
    
    const formData = new FormData(e.currentTarget);
    const finalCardCount = Number(formData.get('cardCount'));
    // Collecting desired card formats from checkbox group
    const desiredTypes: (
      'question-answer' | 
      'fill-in-the-blank' | 
      'mcq' |
      'diagram' |
      'chart' |
      'image-labeling'
    )[] = [];

    if(formData.has('question-answer')) desiredTypes.push('question-answer');
    if(formData.has('fill-in-the-blank')) desiredTypes.push('fill-in-the-blank');
    if(formData.has('mcq')) desiredTypes.push('mcq');
    if(formData.has('diagram')) desiredTypes.push('diagram');
    if(formData.has('chart')) desiredTypes.push('chart');
    if(formData.has('image-labeling')) desiredTypes.push('image-labeling');

    // Business Logic Validation
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

      const parentId = currentContext.type === 'File' ? folderId : workspaceId;

      /**
     * @callback onGranted
     * Triggered by WebSocket when the server confirms this user owns the generation lock.
     */
      const onGranted = async(data: { rId: string }) => {
          if(String(data.rId) !== String(currentContext.id)) return;

          socket.off("lock_denied", onDenied);

          try {

            const resId = currentContext.id;
            const resType = currentContext.type;

            if(!resId || !resType){
              console.error("[Flashcard Types Form] Missing context info");
              return;
            }
             const payload = {
                workspaceId: workspaceId as string,
                folderId: (folderId as string) ?? '',
                resourceId:resId,
                resourceType: resType!,
                cardCount: finalCardCount,
                desiredTypes,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              }
              setLastPayload(payload);

              await generateCards(payload);
              await refreshUsage()
          } catch (error) {
            console.error("[Flashcard Types Form] Error in Generating flashcards: ",error);
          }finally{
            setIsRequestingLocks(false);
            socket.emit("request_gen_end", {
              resourceId: currentContext.id,
              workspaceId: workspaceId,
            });
          }
      }

      const onDenied = (data: {
        resourceId: string,
        reason: string,
      }) => {
        if(String(data.resourceId) === String(currentContext.id)){
          socket.off("lock_granted", onGranted);
          setIsRequestingLocks(false);
          toast({
            title: "Access Denied",
            description: "Someone else just started generating for this location",
            variant: "destructive",
          });
        }
      };

      //  Set up one-time event listeners for the lock request
      socket.once("lock_granted", onGranted);
      socket.once("lock_denied", onDenied);

      // Initial lock request
      socket.emit("request_gen_start", {
        resourceId: currentContext.id,
        parentId,
        workspaceId,
        username: user?.username,
      });
    
  }
 
    return (
        <SheetContent className="!w-full sm:!max-w-md overflow-y-auto bg-neutral-950 border-neutral-800 text-neutral-100 p-6">
            <SheetHeader>
                <SheetTitle className="text-white text-lg font-mono font-bold">
                  Customize Flashcard Generation
                </SheetTitle> 
                <SheetDescription className="text-neutral-400 text-xs font-mono">
                  Make changes to your flashcards, according to your need.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-5 bg-neutral-800"/>

            {/* Source Selection Feedback */}
             <div className="flex flex-col gap-3">
                <Label className="text-xs font-mono text-neutral-300">
                  Current Content: [ Selected {selectedResourceType}: {selectedResourceName} ]
                </Label>
                <div>
                  <ResourcePickerModel>
                    <div className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-white transition-colors">
                      <button>
                        <IconFolderOpen size={20} />
                      </button>
                      <span className="text-xs font-mono cursor-not-allowed">Change source</span>
                    </div>
                  </ResourcePickerModel>

                  {/* Dynamic Warning lock */}
                  {isCurrentResourceBusy && (
                    <p className="mt-2 text-[11px] font-mono text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                      This specific {selectedResourceType.toLowerCase()} is currently locked for AI generation.
                    </p>
                  )}
                </div>
           </div>
           <Separator className="my-5 bg-neutral-800"/>

           <form onSubmit={handleSumbit} className="space-y-6">
            {/* Generation Parameters */}
            <div className="space-y-2">
              <Label htmlFor="max-cards" className="text-xs font-mono text-neutral-300">
                Max Cards to Generate:{" "}
                <span className="text-neutral-500">(Min cards should be 5)</span></Label>
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
              className="bg-neutral-900 border-neutral-800 text-white font-mono focus:border-violet-500 rounded-lg"
              />
            </div>
              <Separator className="my-5 bg-neutral-800"/>
              {/* Formatting Options */}
            <div className="space-y-3">
                <Label className="text-xs font-mono text-neutral-300">
                  Question Format:
                </Label>
            </div>
            <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <Checkbox id="question-answer" name="question-answer"
            className="border-neutral-700 data-[state=checked]:bg-violet-600"/>
            <Label htmlFor="question-answer" className="text-sm font-mono text-neutral-200 cursor-pointer">
              Question & Answer </Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="fill-in-the-blank" name="fill-in-the-blank" 
            className="border-neutral-700 data-[state=checked]:bg-violet-600"/>
            <Label htmlFor="fill-in-the-blank" className="text-sm font-mono text-neutral-200 cursor-pointer">
              Fill-in-the-Blank (Cloze)</Label>
          </div>
          <div className="flex flex-row gap-3">
            <Checkbox id="mcq" name="mcq" className="border-neutral-700 data-[state=checked]:bg-violet-600"/>
            <Label htmlFor="mcq" className="text-sm font-mono text-neutral-200 cursor-pointer">
              Multiple Choice (MCQ)</Label>
          </div>
          <ComingSoonTooltip disabled side="top">
            <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                <Checkbox id="diagram" name="diagram" disabled/>
                <Label htmlFor="diagram" className="text-sm font-mono text-neutral-400">
                  Concept Diagram
                  <span className="text-sm font-mono text-neutral-400">
                    Visual flow/relationship maps
                  </span>
                </Label>
            </div>
          </ComingSoonTooltip>
          <ComingSoonTooltip disabled side="top">
            <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                <Checkbox id="chart" name="chart" disabled/>
                <Label htmlFor="chart" className="text-sm font-mono text-neutral-400">
                  Chart-based
                  <span className="ml-2 text-xs font-mono text-neutral-400">
                      Data Visiualization questions
                  </span>
                </Label>
            </div>
          </ComingSoonTooltip>
          <ComingSoonTooltip disabled side="top">
            <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                <Checkbox id="image-labeling" name="image-labeling" disabled/>
                <Label htmlFor="image-labeling" className="text-sm font-mono text-neutral-400">
                    Image Labeling
                    <span className="ml-2 text-xs font-mono text-neutral-400">
                      Label parts of diagram or images
                    </span>
                </Label>
            </div>
          </ComingSoonTooltip>
        </div>
      
       {/* Actions */}
        <SheetFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800">
         { isGeneratingCards 
         ?(
            <div className="flex justify-center w-full py-2">
              <Loader2 className="animate-spin text-violet-400"/> 
            </div>
        )
         :<Button
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs rounded-xl py-2.5 transition-colors"
           type="submit">Generate Flashcard</Button>}
          <SheetClose asChild>
            <Button variant="outline"
            className="w-full border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white font-mono text-xs rounded-xl"
            >
              Close</Button>
          </SheetClose>
        </SheetFooter>
        </form>

        {/* Modal: Handles conflicts when a set already exists for this resource */}
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