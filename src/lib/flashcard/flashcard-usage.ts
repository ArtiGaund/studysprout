import { WorkSpaceModel } from "@/model";

export const MONTHLY_SET_LIMIT = 5;

export function getEndOfMonth(): Date{
    const now = new Date();
    // Last millisecond of the last day of the current month
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Checks the workspace's monthly limit and increments atomically if allowed.
 * Returns { allowed: true} or { allowed: false, resetAt, used, limit}.
 */

export async function checkAndIncrementUsage(workspaceId: string): Promise<
    | { allowed: true }
    | { 
        allowed: false;
        used: number;
        limit: number;
        resetAt: Date;
    }
>{
    const now = new Date();

    // First: reset the counter if the month has rolled over
    await WorkSpaceModel.updateOne(
        {
            _id: workspaceId,
            "flashcardUsage.resetAt": { $lte: now },
        },
        {
            $set: {
                "flashcardUsage.setsGenerated": 0,
                "flashcardUsage.resetAt": getEndOfMonth(),
            },
        }
    );

    // Atomic check + increment: only succeeds if count is below limit
    const updated = await WorkSpaceModel.findOneAndUpdate(
        {
            _id: workspaceId,
            $expr: {
                $lt: [
                    { $ifNull: [ "$flashcardUsage.setsGenerated", 0] },
                    MONTHLY_SET_LIMIT,
                ],
            },
        },
        {
            $inc: { "flashcardUsage.setsGenerated": 1 },
            $setOnInsert: { "flashcardUsage.resetAt": getEndOfMonth() },
        },
        { new: true },
    );

    if(!updated){
        // Count was at limit - fetch current state to return in the error
        const workspace = await WorkSpaceModel.findById(workspaceId)
            .select("flashcardUsage")
            .lean();

        return {
            allowed: false,
            used: workspace?.flashcardUsage?.setsGenerated ?? MONTHLY_SET_LIMIT,
            limit: MONTHLY_SET_LIMIT,
            resetAt: workspace?.flashcardUsage?.resetAt ?? getEndOfMonth(),
        };
    }

    return { allowed: true };
}

/**
 * Read-only: returns current usage without modifying it.
 */

export async function getWorkspaceUsage(workspaceId:string) {
    const now = new Date();

    // Reset if stale before reading
    await WorkSpaceModel.updateOne(
        {
            _id: workspaceId,
            "flashcardUsage.resetAt": { $lte: now },
        },
        {
            $set: {
                "flashcardUsage.setsGenerated": 0,
                "flashcardUsage.resetAt": getEndOfMonth(),
            },
        }
    );

    const workspace = await WorkSpaceModel.findById(workspaceId)
        .select("flashcardUsage")
        .lean();

    return {
        used: workspace?.flashcardUsage?.setsGenerated ?? 0,
        limit: MONTHLY_SET_LIMIT,
        resetAt: workspace?.flashcardUsage?.resetAt ?? getEndOfMonth(),
    };
}