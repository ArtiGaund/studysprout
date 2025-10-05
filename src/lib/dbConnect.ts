import mongoose from "mongoose";
import { DB_NAME } from "@/constants"

// import  FolderModel  from "@/model/folder.model";
// import  FileModel  from "@/model/file.model";
// import  WorkSpaceModel  from "@/model/workspace.model";
// import UserModel from "@/model/user.model";
// import ImageModel from "@/model/image.model";
import * as models from "@/model/index";
import config from "@/config/config";

type ConnectionObject = {
    isConnected?: number
}

const connection: ConnectionObject = {}

async function dbConnect(): Promise<void> {
    if(connection.isConnected){
        console.log("Already connected to database");
        return;
    }
    try {
        const db = await mongoose.connect(`${config.MONGO_CONNECTION}/${DB_NAME}`)
        connection.isConnected= db.connections[0].readyState

        console.log("DB connected successfully!");
        
    } catch (error) {
        console.log("DB connection failed: ",error);
        
        process.exit(1)
    }
}

export default dbConnect;