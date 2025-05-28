"use client";
import { Trash2 } from "lucide-react";
import { useModal } from "@/context/ModalProvider";
import AccountSetting from "../account-setting";
import { useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "./use-toast";
import { signOut } from "next-auth/react";

const Profile = () => {
  const { openModal, closeModal } = useModal();
  const { data: session } = useSession();
  const user = session?.user;
    const router = useRouter();

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
    <AccountSetting>
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-2xl p-3">Profile</h1>
      <div className="flex flex-row gap-3">
        <span>Delete Account</span>
        <button
          id="deleteButton"
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
          className="w-[50px] h-[50px] bg-red-700 flex justify-center items-center rounded-xl"
        >
          <Trash2 />
        </button>
      </div>
    </div>
    </AccountSetting>
  );
};

export default Profile;
