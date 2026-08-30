/**
 * @module InboxItemModel
 * @description Schema for a user's private capture inbox.
 * Items land here from the browser extension (or other capture sources) and exist ONLY until the
 * user either merges them into a File's blocks or deletes them - at which point the document is
 * removed entirely.
 * 
 * KEY DECISION: 
 * 1) Inbox is global per-user, NOT scoped to a workspace. 
 *  Capture happens outside any workspace context (e.g. browsing a random webpage), so workspace/
 *  folder/file destination is chosen later, at filing time - not at capture time. 
 * 2) No status field. There is no "filed" state - merge operation deletes the InboxItem as its 
 *  final step. Existence in this collection IS the "pending" state.
 * 
 * Fields: 
 * - type: mirrors IBlock.type ("heading" | "paragraph" | "image" | "video" | "link" | "file")
 *     so a filed InboxItem maps cleanly onto a new IBlock without renaming.
 * - content: the raw captured text ( plain string, not the rich JSON `content` IBlock uses - 
 *    inbox captures are plain text from a webpage, not editor-authored blocks).
 * 
 */

import { Schema, Types } from "mongoose";

export interface InboxItem{
    userId: Types.ObjectId;
    type: string; // "heading" | "paragraph" | "image" | "video" | "link" | "file"
    content: string;
    sourceUrl?: string;
    sourceTitle?: string;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * @schema InboxItemSchema
 * One document per captured snippet - enables independent querying, sorting, and deletion per
 * item 
 */

export const InboxItemSchema = new Schema<InboxItem>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "heading1", 
                "heading2", 
                "heading3", 
                "paragraph", 
                "bullet_list", 
                "numbered_list", 
                "code", 
                "quote"
            ],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        sourceUrl: {
            type: String,
            required: false,
            default: null,
        },
        sourceTitle: {
            type: String,
            required: false,
            default: null,
        },
    },
    { timestamps: true }
);