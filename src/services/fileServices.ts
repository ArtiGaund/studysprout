import { File } from "@/model/file.model";
import axios from "axios";


export async function addFile(newFile:File) {
    const { data } = await axios.post(`/api/create-file`,newFile);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

export async function getCurrentFile(fileId:string){
    const { data } = await axios.get(`/api/get-current-file?fileId=${fileId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}