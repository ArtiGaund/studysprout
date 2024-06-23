import dbConnect from "@/lib/dbConnect";
import WorkSpaceModel from "@/model/workspace.model";

const getFolders = async(workspaceId: string) => {
    await dbConnect()
    try {
        // const workspace = await WorkSpaceModel.findById(workspaceId)
        // const foldersData = workspace?.folders.sort((a,b) => {
        //     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        // })
        // return foldersData
        return []
    } catch (error) {
        console.log("Error while fetching the folders for the workspace ",error)
        return []
    }
}

export default getFolders;