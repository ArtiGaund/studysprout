'use client'

import CustomDialogTrigger from "../global/custom-dialog";
import TooltipComponent from "../global/tooltip-component";
import { MessageCircleQuestionIcon} from "lucide-react";
import FeedbackForm from "./feedback-form";
import { useState } from "react";

const Feedback = ({ editable }: { editable?: boolean}) => {
    const [ open, setOpen ] = useState(false);
    return(
        <div className={`flex items-center gap-2 ${editable} 
            ? 'cursor-pointer' 
            : 'cursor-not-allowed'`}
        >
            {/* Feedback icon */}
           { editable && (
                <CustomDialogTrigger
                header="Feedback"
                content={<FeedbackForm onClose={() => setOpen(false)}/>}
                open={open}
                onOpenChange={setOpen}
                >
                    <TooltipComponent message="Feedback">
                        <MessageCircleQuestionIcon className="text-blue-500 hover:text-purple-700" />
                    </TooltipComponent>
                </CustomDialogTrigger> 
            )}
        </div>
    )
}

export default Feedback;