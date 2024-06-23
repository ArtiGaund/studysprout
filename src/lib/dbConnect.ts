import mongoose from "mongoose";
import { DB_NAME } from "@/constants"

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
        const db = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        connection.isConnected= db.connections[0].readyState

        console.log("DB connected successfully!");
        
    } catch (error) {
        console.log("DB connection failed: ",error);
        
        process.exit(1)
    }
}

export default dbConnect;