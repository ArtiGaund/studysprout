/**
 * RESOURCE: Flashcard SRS Rating
 * ------------------------------
 * Endpoint /api/flashcard-progress/rate
 * 
 * ROLE: Updates spaced repetition progress after user rates a flashcard.
 * 
 * SM-2 Algorithm:
 * Based on the SuperMemo SM-2 Algorithm used by Anki and most SRS systems.
 * Given a quality rating (0-5), calculates:
 * - New interval (days until next review)
 * - New ease factor (how hard this card is for this user)
 * - Due date (when to show this card again)
 * 
 * QUALITY MAPPING from UI labels:
 * "again" -> 0 (complete blackout - reset card, review tomorrow)
 * "hard" -> 2   (correct with serious difficulty)
 * "good" -> 4    (correct after hesitation - normal)
 * "easy" -> 5     (perfect, immediate recall)
 * 
 * CRITICAL: upsert: true
 * Without upsert, first-time ratings silently fail because there's no exiting FlashcardProgress
 * document to update. This card stays in "new" state forever even after the user resets it.
 * upsert creates the document if it doesn't exist.
 */

import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FlashcardProgressModel } from "@/model";



function calculateSM2(
    quality: number,                //0-5
    repetition: number,             //times reviewed correctly in a row
    interval: number,               //current interval in days
    easeFactor: number,             //current ease factor (starts at 2.5)
): {
    interval: number,
    repetition: number,
    easeFactor: number,
    dueDate: Date
}{
    let newInterval: number;
    let newRepetition: number;

    if(quality >= 3){
        //correct response - advance the schedule
        if(repetition === 0) newInterval = 1;
        else if(repetition === 1) newInterval = 6;
        else newInterval = Math.round(interval* easeFactor);
        newRepetition = repetition + 1; 
    }else{
        // Incorrect - reset to beginning, review again tomorrow
        newInterval = 1;
        newRepetition = 0;
    }

    // Update ease factor - never drops below 1.3 (prevent impossible frequency)
    const newEaseFactor = Math.max(
        1.3,
        easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newInterval);

    return {
        interval: newInterval,
        repetition: newRepetition,
        easeFactor: newEaseFactor,
        dueDate,
    }
}

export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "Unauthorized",
            401,
            401,
        );

        const userId = session.user._id;
        const { flashcardId, quality } = await request.json();

        if(!flashcardId) return errorResponse(
            "FlashcardId is required",
            400,
            400,
        );

        const qualityMap: Record<string, number> = {
            again: 0,
            hard: 2,
            good: 4,
            easy: 5,
        };

        const qualityScore = qualityMap[quality];
        if(qualityScore === undefined){
            return errorResponse(
                "quality must be: again | hard | good | easy ",
                400,
                400,
            );
        }

        // Load existing progress - null for new cards (use defaults)
        const existing = await FlashcardProgressModel.findOne({ userId, flashcardId});

        const {
            interval,
            repetition,
            easeFactor,
            dueDate,
        } = calculateSM2(
            qualityScore,
            existing?.repetition ?? 0,
            existing?.interval ?? 0,
            existing?.difficulty ?? 2.5,
        );

        // upsert: true - creates the document if it doesn't exist yet 
        const updated = await FlashcardProgressModel.findByIdAndUpdate(
            { userId, flashcardId },
            {
                $set: {
                    userId,
                    flashcardId,
                    interval,
                    repetition,
                    difficulty: easeFactor,
                    dueDate,
                    lastReviewed: new Date(),
                },
            },
            { 
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            },
        );

        return successResponse(
            "Progress updated",
            {
                progress: {
                    interval: updated.interval,
                    difficulty: updated.difficulty,
                    repetition: updated.repetition,
                    dueDate: updated.dueDate,
                    lastReviewed: updated.lastReviewed?.toString() || null,
                },
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[SRS Rate] Failed: ",error);
        return errorResponse(
            error.message,
            500,
            500,
        );
    }
}