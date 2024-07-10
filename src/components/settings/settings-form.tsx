import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Briefcase, LogOut, User } from "lucide-react";
import { Separator } from "@radix-ui/react-select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { WorkSpace } from "@/model/workspace.model";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axios from "axios";
import { DELETE_WORKSPACE, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/CypressProfileIcon";
import LogoutButton from "../global/logout-button";

const SettingsForm = () => {
    const { toast } = useToast()
    const { data: session } = useSession()
    const user=session?.user
    const router = useRouter()
    const currentWorkspace = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const [ workspaceDetails, setWorkspaceDetails ] = useState<Partial<WorkSpace>>({
        workspaceName: currentWorkspace?.workspaceName || "",
        logo: currentWorkspace?.logo || undefined,
    })
    // when user want to change the workspace name, there will be timer
    const titleTimerRef = useRef<ReturnType<typeof setTimeout>>()
    const [ uploadingProfilePic, setUploadingProfilePic ] = useState(false)
    const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    const dispatch = useDispatch()
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const workspaces = useSelector((state: RootState) => state.workspace.workspaces)

    // will change the value of workspace when there is any change in name 
    useEffect(() => {
        if(currentWorkspace){
            setWorkspaceDetails({
                _id: currentWorkspace._id,
                workspaceName: currentWorkspace.workspaceName,
                logo: currentWorkspace.logo
            })
        }
    }, [currentWorkspace])

    // onChange workspace title
    const workspaceNameChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        if(!workspaceId || !e.target.value) return
        const newWorkspaceDetails = { ...workspaceDetails, workspaceName: e.target.value}
        setWorkspaceDetails(newWorkspaceDetails)
        const updateWorkspace: Partial<WorkSpace> = {
            _id: workspaceId,
            workspaceName: e.target.value
        }
       
            if(titleTimerRef.current) clearTimeout(titleTimerRef.current);
            titleTimerRef.current = setTimeout( async() => {
                try {
                const response = await axios.post(`/api/update-workspace`, updateWorkspace)
                if(!response.data.success){
                    toast({
                        title: "Failed to update workspace name",
                        description: "Please try again later",
                        variant: "destructive",
                    })
                }else{
                    const workspace = response.data.data
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Successfully updated workspace name",
                        description: "Workspace name updated successfully",
                    })
                   
                }
                } catch (error) {
                    console.log("Error while updating the workspace name ",error)
                    toast({
                        title: "Failed to update workspace name",
                        description: "Error while updating the workspace name",
                        variant: "destructive",
                    })
                }
            }, 500)
    }

    const onChangeWorkspaceLogo = async(e: React.ChangeEvent<HTMLInputElement>) => {
        if(!workspaceId) return

        const file = e.target.files?.[0]

        if(!file) return

        setUploadingLogo(true)
        
       const formData = new FormData()
       formData.append("_id",workspaceId.toString())
       formData.append("newLogo",file)
       try {
            const response = await axios.post(`/api/update-workspace-logo`, formData)
            if(!response.data.success){
                toast({
                    title: "Failed to update the workspace logo",
                    description: "Please try again later",
                    variant: "destructive",
                })
            }else{
                const workspace = response.data.data
                dispatch(UPDATE_WORKSPACE(workspace))
                toast({
                    title: "Successfully updated the workspace logo",
                    description: "Workspace logo updated successfully",
                })
            }
       } catch (error) {
        console.log("Error while updating the workspace logo ",error)
        toast({
            title: "Failed to update the workspace logo",
            description: "Error while updating the workspace logo",
            variant: "destructive",
        })
       }

    } 

    // onClicks
    const deleteWorkspace = async () => {
        if(!workspaceId) return
        try {
            const response = await axios.delete(`/api/delete-workspace?workspaceId=${workspaceId}`)
            if(!response.data.success){
                toast({
                    title: "Failed to delete the workspace",
                    description: "Please try again later",
                    variant: "destructive",
                })
            }else{
                dispatch(DELETE_WORKSPACE(workspaceId.toString()))
                toast({
                    title: "Successfully deleted the workspace",
                    description: "Workspace deleted successfully",
                })

                // checking if there is remaining workspace
                const remainingWorkspaces = workspaces.filter((workspace:WorkSpace) => workspace._id !==workspaceId)
                if(remainingWorkspaces.length > 0){
                    const nextWorkspace = remainingWorkspaces[0]
                    dispatch(UPDATE_WORKSPACE(nextWorkspace))
                    router.push(`/dashboard/${nextWorkspace._id}`)
                }else{
                    router.push('/dashboard')
                }
            }
        } catch (error) {
            console.log("Error while deleting the workspace ",error)
            toast({
                title: "Failed to delete the workspace",
                description: "Error while deleting the workspace",
                variant: "destructive",
            })
        }
    }

    // fetching avatar details
    const onChangeProfilePicture = () => {

    }

    // get workspace details

    // 
    return (
    <div className="flex gap-4 flex-col">
        <p className="flex items-center gap-2 mt-6">
            <Briefcase 
            size={20}
            />
            Workspace
        </p>
        <Separator />
        <div className="flex flex-col gap-2">
            <Label
             htmlFor="workspaceName"
             className="text-sm text-muted-foreground"
             >
                Name
            </Label>
            <Input
            name="workspaceName"
            value={workspaceDetails ? workspaceDetails.workspaceName : '' }
            placeholder="Workspace Name"
            onChange={workspaceNameChange}
            className=""/>
            <Label
            htmlFor="workspaceLogo"
            className="text-sm text-muted-foreground"
            >
                Workspace Logo
            </Label>
            <Input 
            name="workspaceLogo"
            type="file"
            accept="image/*"
            placeholder="Workspace Logo"
            onChange={onChangeWorkspaceLogo}
            disabled={uploadingLogo}
            />
        </div>
        <Alert variant={'destructive'}>
            <AlertDescription>
                Warning! Deleting your workspace will permanantly delete all data related to this workspace.
            </AlertDescription>
            <Button
            type="submit"
            size={'sm'}
            variant={'destructive'}
            className="mt-4 text-sm bg-destructive/40 border-2 border-destructive"
            onClick={deleteWorkspace}
            >
                Delete Workspace
            </Button>
        </Alert>
        <p className="flex items-center gap-2 mt-6">
            <User size={20}/> Profile
        </p>
        <Separator />
        <div className="flex items-center">
            <Avatar>
                <AvatarImage src={''}/>
                <AvatarFallback>
                    <CypressProfileIcon />
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-6">
                <small className="text-muted-foreground cursor-not-allowed">
                    {user ? user?.email : ''}
                </small>
                <Label htmlFor="profilePicture"
                className="text-sm text-muted-foreground"
                >
                    Profile Picture
                </Label>
                <Input 
                    name="profilePicture"
                    type="file"
                    accept="image/*"
                    placeholder="Profile Picture"
                    onChange={onChangeProfilePicture}
                    disabled={uploadingProfilePic}
                />
            </div>
        </div>
        <LogoutButton>
            <div className="flex items-center">
                <LogOut />
            </div>
        </LogoutButton>
        
    </div>
    )
}

export default SettingsForm