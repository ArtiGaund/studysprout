import { Schema } from "mongoose";
export interface File {
    _id?: string;

    // core content
    title: string;
    iconId?: string;
    data?: string;                      //full JSON blocks (always latest)
    plainTextContent?: string;         //will store json file data in string for AI
    structuredPlainText?:string;
    blockMap?:any;

    // versioning
    version?: number;                    //increments every updates
    contentHash?: string;                //detect identical saves
     lastSyncedAt?: Date;
     updatedAtLocal?: Date | string;

    //  Offline sync
    localChangeId?: string;              //prevent duplicate offline syncs
    lastLocalChangeId?: number;
    
    // basic metadata
     createdAt: Date;
    lastUpdated: Date;
                  
    // conflict state
    conflictState?: "none" | "conflict" | "resolved";             //"resolved","conflict", null
    isLocked?: boolean;                 //future multiuser editing
    deletedAt?: Date | null;

    // undo /history (24h)
    history?: Array<{
        version: number;
        data: string;
        updatedAt: Date;
    }>;  //compact version history

    // org
     workspaceId?: string;
    folderId?: string; 
    bannerUrl?: string;
    inTrash?: string;

    plainTextLastGenerated?: Date;
}
export const BlockMapEntrySchema = new Schema({
    id: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    type: { type: String},
}, { _id: false })

export const FileSchema: Schema<File> = new Schema({
    title:{
        type: String,
        required: [true, "Title is required"],
    },
    iconId:{
        type: String,
    },


     data: {
        type: String,
        default: '[]',
    },
     plainTextContent: {
        type: String,
        default:null,
    },
    structuredPlainText: {
        type: String,
        default: null,
    },
      blockMap: [{ 
        type: [BlockMapEntrySchema],
        default: []
    }],

    version: {
        type: Number,
        default: 1,
    },
    contentHash: {
        type: String,
        default: "",
    },
    localChangeId: {
        type: String,
        default: "",
    },

    lastLocalChangeId:{
        type: Number,
        default: 0
    },

    lastSyncedAt: {
        type: Date,
        default: null,
    },
    updatedAtLocal: {
        type: Date,
        default: null,
    },
    conflictState: {
       type: String,
       default: "none",
       enum: ["none", "conflict", "resolved"],
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },

   history: [{
    version: Number,
    data: String,
    updatedAt: Date,
   }],

    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },

     workspaceId:{
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    },
    folderId: {
        type: Schema.Types.ObjectId,
        ref: "Folder"
    },
     bannerUrl:{
        type: String,
    },
    inTrash: {
        type: String,
    },
   
    plainTextLastGenerated: {
        type: Date,
        default: null
    },
}
)

