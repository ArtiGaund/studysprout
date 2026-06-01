import { ActivityEventModel } from "@/model";
import { IActivityEvent } from "@/model/activity-event.model";

export async function createEvent(
    payload: Omit<IActivityEvent, "createdAt">
): Promise<void>{
    try {
        await ActivityEventModel.create(payload);
    } catch (error) {
        console.error("[ActivityEvent model] Failed to write event: ",error);
    }
}