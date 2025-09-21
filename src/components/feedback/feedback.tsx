'use client'

import CustomDialogTrigger from "../global/custom-dialog";
import TooltipComponent from "../global/tooltip-component";
import { MessageCircleQuestionIcon} from "lucide-react";
import FeedbackForm from "./feedback-form";

const Feedback = ({ editable }: { editable?: boolean}) => {
    return(
        <div className={`flex items-center gap-2 ${editable} ? 'cursor-pointer' : 'cursor-not-allowed'`}>
            {/* Feedback icon */}
           { editable && (<CustomDialogTrigger
            header="Feedback"
            content={<FeedbackForm />}
            >
                <TooltipComponent message="Feedback">
                    <MessageCircleQuestionIcon className="text-blue-500 hover:text-purple-700" />
                </TooltipComponent>
            </CustomDialogTrigger> )}
        </div>
    )
}

export default Feedback;