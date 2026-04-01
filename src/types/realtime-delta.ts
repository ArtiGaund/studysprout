/**
 * @type FileDelta
 * @description A Discriminated Union representing atomic changes to a document's block structure.
 * * ARCHITECTURAL SIGNIFICANCE:
 * 1. Efficient Syncing: Instead of pushing the entire file, the system only transmits 
 * "Deltas," significantly reducing WebSocket payload sizes and network latency.
 * 2. Order Preservation: The 'add' type explicitly tracks `afterBlockId`, ensuring 
 * the document's visual hierarchy is maintained during concurrent edits.
 * 3. Type Safety: Leverages TypeScript's `ReturnType` to ensure the delta's block 
 * data is always perfectly synchronized with the `normalizeBlockUI` utility's output.
 * 4. Undo/Redo Foundation: These discrete actions provide the necessary data 
 * structure for implementing a robust command-history or version-control system.
 */
import { normalizeBlockUI } from "@/utils/block/normalizeBlock";

export type FileDelta = 
    /**
     * @action add
     * Triggered when a user hits 'Enter' or inserts a new block.
     * Includes positioning context (afterBlockId) for accurate insertion.
     */
    | {
        type: "add";
        block: ReturnType<typeof normalizeBlockUI>;
        afterBlockId: string | null;
    }

    /**
     * @action update
     * Triggered on every keystroke or property change (e.g., turning text into a heading).
     * Targets a specific blockId to ensure granular updates.
     */
    | {
        type: "update";
        blockId: string;
        block: ReturnType<typeof normalizeBlockUI>;
    }

    /**
     * @action delete
     * Triggered when a block is removed.
     */
    | {
        type: "delete";
        blockId: string;
    }