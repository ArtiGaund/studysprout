import mongoose from "mongoose";
import { DB_NAME } from "@/constants"
import config from "@/config/config";

type ConnectionObject = {
    isConnected?: number
}

const connection: ConnectionObject = {}

async function dbConnect(): Promise<void> {
    if(connection.isConnected){
        return;
    }
    try {
        const db = await mongoose.connect(`${config.MONGO_CONNECTION}/${DB_NAME}`)
        connection.isConnected= db.connections[0].readyState
        
    } catch (error) {
        console.warn("DB connection failed: ",error);
        
        process.exit(1)
    }
}

export default dbConnect;