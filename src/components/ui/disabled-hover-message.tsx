"use client";

import { HoverCardContent } from "@radix-ui/react-hover-card";
import { Alert, AlertDescription } from "./alert";
import { AlertCircleIcon } from "lucide-react";


const DisabledHoverMessage = () => {
    return(
        <HoverCardContent className="w-64 flex p-3 z-20 ml-[3.3rem]">
            <Alert variant="destructive" className="bg-Neutrals/neutrals-11 text-red-700">
                <AlertCircleIcon className="h-4 w-4 text-red-700"/>
                <AlertDescription>
                    <p>This section is disabled while the Revision sidebar is open. <br />
                        Please close the sidebar to use these features.</p>
                </AlertDescription>
            </Alert>
        </HoverCardContent>
    )
}

export default DisabledHoverMessage;