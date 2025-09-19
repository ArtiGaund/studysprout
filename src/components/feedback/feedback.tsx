'use client'

import CustomDialogTrigger from "../global/custom-dialog";
import TooltipComponent from "../global/tooltip-component";
import { MessageCircleQuestionIcon} from "lucide-react";
import FeedbackForm from "./feedback-form";

const Feedback = () => {
    return(
        <div className="flex items-center gap-2 cursor-pointer">
            {/* Feedback icon */}
            <CustomDialogTrigger
            header="Feedback"
            content={<FeedbackForm />}
            >
                <TooltipComponent message="Feedback">
                    <MessageCircleQuestionIcon className="text-blue-500 hover:text-purple-700" />
                </TooltipComponent>
            </CustomDialogTrigger>
        </div>
    )
}

export default Feedback;