"use client"
import React from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import SettingsForm from "./settings-form";

interface SettingsProps{
    children: React.ReactNode
}
const SettingsPage: React.FC<SettingsProps> = ({ children }) => {
    return(
       <CustomDialogTrigger
        header="Settings"
        content={<SettingsForm />}
        >
        {children}
       </CustomDialogTrigger>
    )
}

export default SettingsPage