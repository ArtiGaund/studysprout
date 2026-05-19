/**
 * @module FileModel
 * @description The foundational schema for the StudySprout editor. 
 * It implements a "Hybrid Persistence" strategy to support both real-time 
 * collaboration and efficient AI-driven flashcard generation.
 * * * KEY ARCHITECTURAL DECISIONS:
 * 1. Binary Sync (CRDT): Uses `contentBinary` to store Yjs/Automerge state. This is the 
 * industry standard for merging offline changes without data loss.
 * 2. Block-Map Indexing: Implements a `Map<string, IBlock>` and `blockOrder` array. 
 * This O(1) lookup is significantly faster than searching through a nested array.
 * 3. AI-Ready Metadata: The `plainText` and `structuredText` fields within `IBlock` 
 * pre-process content for the Gemini API, reducing server-side compute.
 * 4. Cache-Efficiency: By keeping a JSON "Preview" of blocks, the system can render 
 * sidebars and summaries without decoding the heavy binary buffer.
 * 
 * IBlock additions:
 * - plainText: plain text version for AI
 * - structuredText: same as plainText - used by flashcard-generation
 * - contentHash: SHA-256 of content - for accurate flashcard outdated detection
 * - Without this, editing then reverting text triggers false "outdated" on flashcards.
 * 
 * Fields:
 * - readingTimeMinutes: estimated read time - for study planner
 * - autosummary: heading + first sentence per section
 * - prerequisites: file IDs this file depends on - for study planner ordering
 * - contentHash: hash of all block content combined - for PDF version diffing
 * - simplifiedContent: cached AI simplification of this file's content
 * - simplificationOutdated: true when content changes, until re-simplified
 * - source: "editor" | "pdf"
 */

import mongoose, { Schema, Types } from "mongoose";

export interface IBlock{
    id: string;
    type: string;
    props: any;
    content: any;
    
    plainText: string;
    structuredText: any;
    updatedAt: Date;
}

/**
 * @schema BlockSchema
 * Sub-document schema for individual content units. 
 * Using {_id: false} to reduce overhead as we use a custom UUID string `id`.
 */
export const BlockSchema = new Schema<IBlock>({
    id: {
        type: String,
        required: true,
    },
    type: {                                 //paragraph, heading, code, image, etc
        type: String,
        required: true,
    },
    props: {                                //JSON props
        type: Schema.Types.Mixed,
        default: {},
    },
    content: {                              //JSON content
        type: Schema.Types.Mixed,
    },
    plainText: {                            //extracted plain Text (for AI, flashcards)
        type: String,
    },
    structuredText:{                         //structured for AI/ NLP
        type: Schema.Types.Mixed,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {_id: false })

export interface BlockMapEntry{
    id: string;
    start: number;
    end: number;
    type?: string;
}
export interface File{
    _id?: string;

    // metadata
    title: string;
    iconId?: string;
    workspaceId?: string;
    folderId?: string;
    bannerUrl?: string;
    inTrash?: string | null;
    createdAt: Date;
    lastUpdated: Date;

    contentBinary: Buffer | null;

    // block-based content
    blocks: Map<string,IBlock>,
    blockOrder: string[],

    contentLastModified: Date,
    deletedAt?: Date | null;

    // optional 
    blockMap?:BlockMapEntry[];
    contentHash?: string;

    prerequisites?: [Types.ObjectId];
    readingTimeMinutes?: number;
    plainText?: string;
    structuredText?: string;
    autoSummary?: any;
    simplifiedContent?: string;
    simplificationOutdated?: boolean;
    simplifiedAt?: Date;
    source?: string;
    pageNumber?: number;
    terms?: string[];
}

/**
 * @schema FileSchema
 * The main entity schema. Optimized for relational lookups and sync status tracking.
 */
export const FileSchema = new Schema<File>({
    title: {
        type: String,
        required: true,
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    },
    folderId: {
        type: Schema.Types.ObjectId,
        ref: "Folder"
    },
    iconId: {
        type: String,
    },

    // --- CRDT & OFFLINE CORE ---
    // This stores the Yjs document state as a binary buffer
    // This is the ONLY way to make Offline Mode merge correctly
    contentBinary: {
        type: Buffer,
        default: null,
    },
    // --- FLASHCARDS & AI DATA ---
    // We keep a JSON "Preview" of the blocks here so Flashcard Sidebar doesn't have to decode
    // binary every time
    blocks: {
        type: Map,
        of: BlockSchema,
        default: {},
    },

    blockOrder: {
        type: [String],
        default: [],
    },

    // Track when the CONTENT specifically changed to trigger "Outdated" flashcards
    contentLastModified: {
        type: Date,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        default: null
    },

    
    bannerUrl: {
        type: String,
    },
    inTrash: {
        type: String,
        default: null,
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    contentHash: {
        type: String,
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "File"
    }],
    readingTimeMinutes: {
        type: Number,
    },
    plainText: {
        type: String,
    },
    structuredText: {
        type: String,
    },
    autoSummary: {
        type: mongoose.Schema.Types.Mixed,
    },
    simplifiedContent: {
        type: String,
    },
    simplificationOutdated: {
        type: Boolean,
        default: false,
    },
    simplifiedAt: {
        type: Date,
    },
    source: {
        type: String,
        enum: ["editor", "pdf"],
        default: "editor",
    },
    pageNumber: {
        type: Number,
    },
    terms: {
        type: [String],
        default: [],
        index: true,
    }
},

)