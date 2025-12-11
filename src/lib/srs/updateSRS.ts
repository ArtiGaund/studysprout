import { FlashcardModel } from "@/model"
import { addDays } from "date-fns";
interface RatingType{
    type: "again" | "hard" | "good" | "easy"
}

export async function updateSRS(cardId: string, rating: RatingType["type"]){
    const card = await FlashcardModel.findById(cardId);

    if(!card){
        return;
    }

    let { interval, difficulty, repetition } = card;

    // standard SM-2 style simplified logic
    switch(rating){
        case "again":
            difficulty = Math.max(1.3, difficulty - 0.3);
            interval = 1;
            repetition = 0;
            break;
        case "hard":
            difficulty = Math.max(1.3, difficulty - 0.1);
            interval = Math.max(1, Math.round(interval*1.2));
            repetition += 1;
            break;
        case "good":
            difficulty = difficulty + 0.05;
            interval = Math.round(interval * difficulty);
            repetition += 1;
            break;
        case "easy":
            difficulty = difficulty + 0.1;
            interval = Math.round(interval * difficulty * 1.5);
            repetition += 1;
            break;

    }

    card.interval = interval;
    card.difficulty = difficulty;
    card.repetition = repetition;
    card.lastReviewed = new Date();
    card.dueDate = addDays(new Date(), interval);

    await card.save();

    return card;
}