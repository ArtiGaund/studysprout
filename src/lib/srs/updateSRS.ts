/**
 * @function updateSRS
 * @description Core Spaced Repetition logic implementing a modified SM-2 algorithm.
 * * TECHNICAL HIGHLIGHTS:
 * 1. Lazy Initialization: Dynamically creates user-specific progress records 
 * the first time a card is interacted with.
 * 2. Algorithmic State Management: Manages Interval (time until next review), 
 * Difficulty (Ease factor), and Repetition (streak) variables.
 * 3. Relational Mapping: Correctly identifies parent Workspace/Set context 
 * for scoped progress tracking across the user's account.
 */

import { FlashcardModel, FlashcardProgressModel } from "@/model"
import { addDays } from "date-fns";
interface RatingType{
    type: "again" | "hard" | "good" | "easy"
}

export async function updateSRS(cardId: string,userId: string, rating: string){
    // 1. Context Resolution
    const card = await FlashcardModel.findById(cardId).select('parentSetId');
    if(!card) throw new Error("Flashcard not found.");

    const setId = card.parentSetId;

    // 2. Progress Retrieval / Lazy Initialization
    // We only create progress records when a user actually starts studying.
    let progress = await FlashcardProgressModel.findOne({ flashcardId:cardId, userId });

    // Lazy initialization if it's the first time they see it
    if(!progress){
        // Find the card to find its parent set and workspaceId
        const card = await FlashcardModel.findById(cardId).populate({
            path: 'parentSetId',
            select: 'workspaceId'
        });

        if(!card || !card.parentSetId){
            throw new Error("[UpdateSRS] Logic Error: Card must belong to a Set to track progress.");
        }
        const workspaceId = (card.parentSetId as any).workspaceId;
        progress = new FlashcardProgressModel({
            userId,
            flashcardId: cardId,
            workspaceId,
            interval: 1,
            difficulty: 2.5,
            repetition: 0,
        });
    }

    let { interval, difficulty, repetition } = progress;

    /**
     * @section SM-2 Algorithm Implementation
     * Adjusts the 'Ease Factor' and 'Interval' based on user feedback.
     */
    switch(rating){
        case "again":
            // Penalize difficulty and reset interval/streak
            difficulty = Math.max(1.3, difficulty - 0.3);
            interval = 1;
            repetition = 0;
            break;
        case "hard":
            // Slight difficulty increase, conservative interval growth
            difficulty = Math.max(1.3, difficulty - 0.1);
            interval = Math.max(1, Math.round(interval*1.2));
            repetition += 1;
            break;
        case "good":
            // Standard progression
            difficulty = difficulty + 0.05;
            interval = Math.round(interval * difficulty);
            repetition += 1;
            break;
        case "easy":
            // Aggressive interval growth for mastered material
            difficulty = difficulty + 0.1;
            interval = Math.round(interval * difficulty * 1.5);
            repetition += 1;
            break;

    }

    // 3. Persistence
    progress.interval = interval;
    progress.difficulty = difficulty;
    progress.repetition = repetition;
    progress.lastReviewed = new Date();
    progress.dueDate = addDays(new Date(), interval);

    await progress.save();

    return {
        progress,
        parentSetId: setId,
    }
}