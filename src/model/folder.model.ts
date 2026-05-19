/**
 * @model Folder
 * 
 * FIELDS:
 * 
 * 1) PDF processing fields 
 * - pdfFingerprint: SH-256 hash of PDF file - prevents duplicate uploads
 * - startOffset: first page of real content (after front matter)
 * - endOffset: last page of real content (before back matter)
 * - totalFileCount: actual file count after topic chunking
 * - pdfType: "book" | "research" | "slides" | "notes" - detected at inspect time
 * - isPDFWorkspace: true for PDF-generated folders
 * - pdfUrl: Cloudinary URL - stored for retry without re-upload
 * - pageCount: total pages in the original PDF
 * - currentFileCount: files created so far (real-time progress)
 * 
 * 2) Intelligence fields (set by analyze route + pdf-worker):
 * - conceptGraph: cross-file concept relationships (from concept-graph-builder)
 */
import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";

export interface Folder{
    _id?: string;
    createdAt: Date,
    title: string,
    iconId?: string,
    data?: string | undefined,
    inTrash?: string | undefined,
    bannerUrl?: string,
    workspaceId?: string,
    files?: Types.ObjectId[],
    isPDFWorkspace?: boolean,
    status?: "idle" | "processing" | "completed" | "error",
    progress?: number,
    pdfUrl?: string;
    pageCount?: number;
    pdfFingerprint?: string;
    startOffset?: number;
    endOffset?: number;
    totalFileCount?: number;
    pdfType?: "book" | "research" | "slides" | "notes";
    currentFileCount?: number;
    conceptGraph?: {
        nodes:{
           id: string;
           label: string;
           fileCount: number;
        }[];
        edges: {
            source: string;
            target: string;
        }[];
        generatedAt: Date;
     } | null;
    conceptGraphStale?: boolean;
    conceptGraphStatus?: "idle" | "processing" | "completed" | "error";
}



export const FolderSchema: Schema<Folder> = new Schema({
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    title:{
        type: String,
        required: [true, "Title is required"]
    },
    iconId:{
        type: String,
    },
    data:{
        type: String,
    },
    inTrash: {
        type: String,
    },
    bannerUrl:{
        type: String,
    },
    workspaceId:{
        type: String
    },
   files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "File"
    }],
    isPDFWorkspace: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["idle", "processing", "completed", "error"],
        default: "idle",
    },
    progress: {
        type: Number,
        default: 0, //0 to 100
    },
    pdfUrl: {
        type: String,
    },
    pageCount: {
        type: Number,
    },
    pdfFingerprint: {
        type: String,
        index: true,
    },
    startOffset: {
        type: Number,
    },
    endOffset: {
        type: Number,
    },
    totalFileCount: {
        type: Number,
    },
    pdfType: {
        type: String,
        enum: [ "book", "research", "slides", "notes"],
    },
    conceptGraph: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    conceptGraphStale: {
        type: Boolean,
        default: true,
    },
    conceptGraphStatus: {
        type: String,
        enum: ["idle", "generating", "completed", "error"],
        default: "idle",
    },
    currentFileCount: {
        type: Number,
        default: 0,
    },
    
}, {timestamps: true })


