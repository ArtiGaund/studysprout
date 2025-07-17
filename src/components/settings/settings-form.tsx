import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { signOut, useSession } from "next-auth/react";
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
import { useModal } from "@/context/ModalProvider";
import AccountSetting from "../account-setting";
import { ReduxWorkSpace } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useDir } from "@/hooks/useDir";
import { transformWorkspace } from "@/utils/data-transformers";

const SettingsForm = () => {
     const { openModal, closeModal } = useModal();
    const { toast } = useToast()
    const { data: session } = useSession()
    const user=session?.user
    const router = useRouter()
    const {
        currentWorkspace,
        updateWorkspaceTitle,
        updateWorkspaceLogo,
        workspaces: allWorkspacesArray,
    } = useWorkspace();

    const {
        handleDelete: handleDeleteWorkspace,
        isLoading: isDeletingWorkspace,
    } = useDir({
        dirType: "workspace",
        dirId: currentWorkspace?._id || "",
    })
    // const [ workspaceTitle, setWorkspaceTitle ] = useState(currentWorkspace?.title || "")
    // const currentWorkspace = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const [ workspaceDetails, setWorkspaceDetails ] = useState<Partial<ReduxWorkSpace>>({
        title: currentWorkspace?.title || "",
        logo: currentWorkspace?.logo || undefined,
    })
    // when user want to change the workspace name, there will be timer
    const titleTimerRef = useRef<ReturnType<typeof setTimeout>>()
    const [ uploadingProfilePic, setUploadingProfilePic ] = useState(false)
    // const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    const dispatch = useDispatch()
    const [uploadingLogo, setUploadingLogo] = useState(false)
    // const workspaces = useSelector((state: RootState) => state.workspace.workspaces)


    // will change the value of workspace when there is any change in name 
    useEffect(() => {
        if(currentWorkspace){
            // const workspace = currentWorkspaceDetails(currentWorkspace);
            
            setWorkspaceDetails({
                _id: currentWorkspace._id,
                title: currentWorkspace.title,
                logo: currentWorkspace.logo
            })
        }
    }, [currentWorkspace])

    // onChange workspace title
    const workspaceNameChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        if(!currentWorkspace || !e.target.value) return
        const newWorkspaceDetails = { ...workspaceDetails, workspaceName: e.target.value}
        setWorkspaceDetails(newWorkspaceDetails)
        const updateWorkspacePayload: Partial<ReduxWorkSpace> = {
            _id: currentWorkspace?._id,
            title: e.target.value
        }
       
            if(titleTimerRef.current) clearTimeout(titleTimerRef.current);
            titleTimerRef.current = setTimeout( async() => {
                try {
                const response = await updateWorkspaceTitle(currentWorkspace._id, e.target.value)
                if(!response.success){
                    toast({
                        title: "Failed to update workspace name",
                        description: "Please try again later",
                        variant: "destructive",
                    })
                }else{
                    const workspace = response.data
                    if(workspace){
                        const transformedWorkspace = transformWorkspace(workspace)
                        dispatch(UPDATE_WORKSPACE(transformedWorkspace))
                        toast({
                            title: "Successfully updated workspace name",
                            description: "Workspace name updated successfully",
                        })
                    }
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
        if(!currentWorkspace) return

        const file = e.target.files?.[0]

        if(!file) return

        setUploadingLogo(true)
        
    //    const formData = new FormData()
    //    formData.append("_id",currentWorkspace._id.toString())
    //    formData.append("newLogo",file)
       try {
            const response = await updateWorkspaceLogo(currentWorkspace._id, file)
            if(!response.success){
                toast({
                    title: "Failed to update the workspace logo",
                    description: "Please try again later",
                    variant: "destructive",
                })
            }else{
                const workspace = response.data
                if(workspace){
                    const transformedWorkspace = transformWorkspace(workspace)
                        dispatch(UPDATE_WORKSPACE(transformedWorkspace))
                    toast({
                        title: "Successfully updated the workspace logo",
                        description: "Workspace logo updated successfully",
                    })
                }
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
    const onDeleteWorkspaceClick = async () => {
        if(!currentWorkspace || !currentWorkspace._id) {
            toast({
                title: "Error",
                description: "No workspace selected for deletion",
                variant: "destructive",
            });
            return;
        }
        await handleDeleteWorkspace();
        const remainingWorkspaces = allWorkspacesArray.filter(
            (workspace: WorkSpace) => workspace._id !== currentWorkspace._id
        )

        if(remainingWorkspaces.length > 0){
            const nextWorkspace = remainingWorkspaces[0];
            router.push(`/dashboard/${nextWorkspace._id}`);
        }else{
            router.push(`/dashboard`);
        }
    }

    // fetching avatar details
    const onChangeProfilePicture = () => {

    }

    // get workspace details

    // 

    const deleteAccount = async () => {
        try {
            const response = await axios.delete(`/api/delete-account?userId=${user?._id}`)
    
            if(!response.data.success){
                    console.log("Error while deleting user account", response.data.message)
                    toast({
                        title: "Failed to delete account",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    toast({
                        title: "Success",
                        description: "Successfully deleted account",
                    })
                    // Sign the user out to clear session
                    await signOut({ callbackUrl: "/sign-up" });
                }
        } catch (error) {
            console.log("Error while deleting user account", error)
            toast({
                title: "Failed to delete account",
                description: "Something went wrong",
                variant: "destructive"
            })
        }
      }
    
    
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
            value={workspaceDetails ? workspaceDetails.title : '' }
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
            onClick={onDeleteWorkspaceClick}
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

        <Alert variant={'destructive'}>
            <AlertDescription>
                Warning! Deleting your account will permanantly delete all data related to this account.
            </AlertDescription>
            <Button
            type="submit"
            size={'sm'}
            variant={'destructive'}
            className="mt-4 text-sm bg-destructive/40 border-2 border-destructive"
            onClick={() =>
                        openModal(
                          <AccountSetting className="h-[13rem] w-full max-w-md">
                            <div className="flex flex-col justify-center items-center">
                              <h2 className="text-xl p-3">Confirm Delete</h2>
                              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete your account? This action cannot be undone.
                              </p>
                              <div className="flex gap-4 mt-6">
                                <button 
                                onClick={closeModal}
                                className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md">
                                  Cancel
                                </button>
                                <button 
                                onClick={deleteAccount}
                                className="bg-red-600 text-white px-4 py-2 rounded-md">
                                  Delete
                                </button>
                              </div>
                            </div>
                          </AccountSetting>
                        )
                      }
            >
                Delete Account
            </Button>
        </Alert>
        <LogoutButton>
            <div className="flex items-center">
                <LogOut />
            </div>
        </LogoutButton>
        
    </div>
    )
}

export default SettingsForm