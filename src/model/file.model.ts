// import { Schema } from "mongoose";
// export interface File {
//     _id?: string;

import { Schema } from "mongoose";

//     // core content
//     title: string;
//     iconId?: string;
//     data?: string;                      //full JSON blocks (always latest)
//     plainTextContent?: string;         //will store json file data in string for AI
//     structuredPlainText?:string;
//     blockMap?:any;

//     // versioning
//     version?: number;                    //increments every updates
//     contentHash?: string;                //detect identical saves
//      lastSyncedAt?: Date;
//      updatedAtLocal?: Date | string;

//     //  Offline sync
//     localChangeId?: string;              //prevent duplicate offline syncs
//     lastLocalChangeId?: number;
    
//     // basic metadata
//      createdAt: Date;
//     lastUpdated: Date;
                  
//     // conflict state
//     conflictState?: "none" | "conflict" | "resolved";             //"resolved","conflict", null
//     isLocked?: boolean;                 //future multiuser editing
//     deletedAt?: Date | null;

//     // undo /history (24h)
//     history?: Array<{
//         version: number;
//         data: string;
//         updatedAt: Date;
//     }>;  //compact version history

//     // org
//      workspaceId?: string;
//     folderId?: string; 
//     bannerUrl?: string;
//     inTrash?: string;

//     plainTextLastGenerated?: Date;
// }
// export const BlockMapEntrySchema = new Schema({
//     id: { type: String, required: true },
//     start: { type: Number, required: true },
//     end: { type: Number, required: true },
//     type: { type: String},
// }, { _id: false })

// export const FileSchema: Schema<File> = new Schema({
//     title:{
//         type: String,
//         required: [true, "Title is required"],
//     },
//     iconId:{
//         type: String,
//     },


//      data: {
//         type: String,
//         default: '[]',
//     },
//      plainTextContent: {
//         type: String,
//         default:null,
//     },
//     structuredPlainText: {
//         type: String,
//         default: null,
//     },
//       blockMap: [{ 
//         type: [BlockMapEntrySchema],
//         default: []
//     }],

//     version: {
//         type: Number,
//         default: 1,
//     },
//     contentHash: {
//         type: String,
//         default: "",
//     },
//     localChangeId: {
//         type: String,
//         default: "",
//     },

//     lastLocalChangeId:{
//         type: Number,
//         default: 0
//     },

//     lastSyncedAt: {
//         type: Date,
//         default: null,
//     },
//     updatedAtLocal: {
//         type: Date,
//         default: null,
//     },
//     conflictState: {
//        type: String,
//        default: "none",
//        enum: ["none", "conflict", "resolved"],
//     },
//     isLocked: {
//         type: Boolean,
//         default: false
//     },
//     deletedAt: {
//         type: Date,
//         default: null
//     },

//    history: [{
//     version: Number,
//     data: String,
//     updatedAt: Date,
//    }],

//     createdAt: {
//         type: Date,
//         required: true,
//         default: Date.now
//     },
//     lastUpdated: {
//         type: Date,
//         default: Date.now
//     },

//      workspaceId:{
//         type: Schema.Types.ObjectId,
//         ref: "Workspace"
//     },
//     folderId: {
//         type: Schema.Types.ObjectId,
//         ref: "Folder"
//     },
//      bannerUrl:{
//         type: String,
//     },
//     inTrash: {
//         type: String,
//     },
   
//     plainTextLastGenerated: {
//         type: Date,
//         default: null
//     },
// }
// )

/**
 * File Schema
 * 
 * This schema is for block level schema
 */

export interface IBlock{
    id: string;
    type: string;
    props: any;
    content: any;
    plainText: string;
    structuredText: any;
    updatedAt: Date;
}

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
    inTrash?: string;
    createdAt: Date;
    lastUpdated: Date;

    // block-based content
    blocks: Map<string,IBlock>,
    blockOrder: string[],

    // version & history
    version: number;
    history?: Array<{
        version: number,
        blocks: any,   //store blocks or diffs
        updatedAt: Date,
    }>;

    // sync & collab
    contentHash?: string;
    localChangeId?: string;
    lastLocalChangeId?: number;
    lastSyncedAt?: Date;
    updatedAtLocal?: Date;
    conflictState?: "none" | "conflict" | "resolved";
    isLocked?: boolean;
    deletedAt?: Date | null;

    // optional 
    blockMap?:BlockMapEntry[];
}
export const FileSchema = new Schema<File>({
    title: {
        type: String,
        required: true,
    },
    iconId: {
        type: String,
    },

    blocks: {
        type: Map,
        of: BlockSchema,
        default: {},
    },

    blockOrder: {
        type: [String],
        default: [],
    },

    version: {
        type: Number,
        default: 1,
    },
    history:[{
        version: Number,
        blocks: Schema.Types.Mixed,
        updatedAt: Date,
    }],

    contentHash: {
        type: String,
        default: "",
    },
    localChangeId: {
        type: String,
        default: "",
    },
    lastLocalChangeId: {
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
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null
    },

    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    },
    folderId: {
        type: Schema.Types.ObjectId,
        ref: "Folder"
    },
    bannerUrl: {
        type: String,
    },
    inTrash: {
        type: String,
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
},

)