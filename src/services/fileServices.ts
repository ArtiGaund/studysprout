import { File } from "@/model/file.model";
import axios from "axios";


export async function addFile(newFile:File) {
    const { data } = await axios.post(`/api/create-file`,newFile);
    if(!data.success) throw new Error(data.message);
    return data.data;
}