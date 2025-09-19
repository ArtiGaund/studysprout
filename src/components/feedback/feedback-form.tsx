'use client';


import { MailCheckIcon, MessageSquareShareIcon } from 'lucide-react';
import Email from 'next-auth/providers/email';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '../ui/use-toast';
import axios from 'axios';
const FeedbackForm = () => {

    const { data: session } = useSession();
    const user = session?.user; 

    const { toast } = useToast();

    const [ isBugReportChecked, setIsBugReportChecked ] = useState(false);
    const [ isFeatureRequestChecked, setIsFeatureRequestChecked ] = useState(false);
    const [ isOtherChecked, setIsOtherChecked ] = useState(false);

    // state for textarea
    const [ bugReportText, setBugReportText] = useState("");
    const [ featureRequestText, setFeatureRequestText ] = useState("");
    const [ complementText, setComplementText] = useState("");

    const handleBugReportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsBugReportChecked(event.target.checked);
    }

    const handleFeatureRequestChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsFeatureRequestChecked(event.target.checked);
    }

    const handleOtherChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsOtherChecked(event.target.checked);
    }
    

    const isFormValid =
    (!isBugReportChecked || bugReportText.trim().length > 0) &&
    (!isFeatureRequestChecked || featureRequestText.trim().length > 0) &&
    (!isOtherChecked || complementText.trim().length > 0) && 
    (isBugReportChecked || isFeatureRequestChecked || isOtherChecked);
    const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const bugReport = (form.elements.namedItem("bug-report-text") as HTMLTextAreaElement)?.value;
        const featureRequest =( form.elements.namedItem("suggestion-text") as HTMLTextAreaElement)?.value;
        const complement = (form.elements.namedItem("complement-text") as HTMLTextAreaElement)?.value;

        const feedbacks = [];
        if(bugReport) feedbacks.push({
            type: "Bug Report",
            message: bugReport
        })
        if(featureRequest) feedbacks.push({
            type: "Feature Request",
            message: featureRequest
        })

        if(complement) feedbacks.push({
            type: "Complement",
            message: complement
        })
        
        try {
            const userEmail = user?.email as string;
            const sendFeedback = await axios.post(`/api/send-feedback`, { userEmail, feedbacks });
            if(!sendFeedback){
                console.log("[FeedbackForm] Error sending feedback: ", sendFeedback);
                toast({
                    title: "Failed to send feedback",
                    description: "Please try again",
                    variant: "destructive"
                })
            }

            toast({
                title: "Success",
                description: "Feedback sent successfully",
            })

        } catch (error) {
            console.error("[FeedbackForm] Error sending feedback: ", error);

            toast({
                title: "Failed to send feedback",
                description: "Please try again",
                variant: "destructive"
            })
        }
        

    }

   
    return (
        <div className="flex flex-col">
            <div className="flex flex-row gap-6">
                <p className="flex gap-2 mt-6">
                    <MailCheckIcon /> Email
                </p>
                <small className="text-muted-foreground cursor-not-allowed mt-6">
                        {user ? user?.email : ''}
                </small>    
            </div>
            <form onSubmit={submitFeedback}>
            <div className="flex flex-col gap-3">
                <p className="flex gap-2 mt-6">
                    <MessageSquareShareIcon /> Share Feedback
                </p>
                <p className="text-sm text-gray-600">
                    Your thoughts help us improve.
                </p>
               
                {/* Bug Report Section */}
                <div className="p-6 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                        <input 
                        type="checkbox"
                        name="bug-report"
                        value="bug-report"
                        className="w-5 h-5 cursor-pointer rounded-md accent-indigo-950"
                        checked={isBugReportChecked}
                        onChange={handleBugReportChange}
                         />
                        <label
                        htmlFor="bug-report-checkbox"
                        className="text-md font-medium text-gray-200 cursor-pointer select-none"
                        >Report a Bug</label>
                    </div>
                    <div 
                    id="bug-report-container" 
                    className={`mt-4 transition-all duration-300 ${isBugReportChecked 
                        ? 'opacity-100 max-h-48'
                         : 'opacity-0 max-h-0 overflow-hidden'}`}
                    >
                        <textarea   
                        name="bug-report-text"
                        rows={4}
                        className="w-full p-3 rounded-md border border-gray-500 focus:ring-2
                         focus:ring-indigo-950 focus:border-indigo-950 transition-all duration-200 resize-y placeholder-gray-400"
                         placeholder="Describe the bug you encountered..."
                         disabled={!isBugReportChecked}
                         value={bugReportText}
                         onChange={e => setBugReportText(e.target.value)}
                        />
                    </div>
                </div>
                {/* Suggestion Section */}
                 <div className="p-6 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                        <input 
                        type="checkbox"
                        name="suggestion"
                        value="bug-report"
                        className="w-5 h-5 cursor-pointer rounded-md accent-indigo-950"
                        checked={isFeatureRequestChecked}
                        onChange={handleFeatureRequestChange}
                         />
                        <label
                        htmlFor="bug-report-checkbox"
                        className="text-md font-medium text-gray-200 cursor-pointer select-none"
                        >Suggestion for Improvement</label>
                        <small className="text-gray-500 cursor-not-allowed">
                            (Feature recommendation.)
                        </small>
                    </div>
                    <div 
                    id="bug-report-container" 
                    className={`mt-4 transition-all duration-300 ${isFeatureRequestChecked 
                        ? 'opacity-100 max-h-48'
                         : 'opacity-0 max-h-0 overflow-hidden'}`}
                    >
                        <textarea   
                        name="suggestion-text"
                        rows={4}
                        className="w-full p-3 rounded-md border border-gray-500 focus:ring-2
                         focus:ring-indigo-950 focus:border-indigo-950 transition-all duration-200 resize-y placeholder-gray-400"
                         placeholder="Describe your suggestion..."
                         disabled={!isFeatureRequestChecked}
                         value={featureRequestText}
                         onChange={e => setFeatureRequestText(e.target.value)}
                        />
                    </div>
                </div>
                {/* Complement section */}
                 <div className="p-6 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                        <input 
                        type="checkbox"
                        name="complement"
                        value="bug-report"
                        className="w-5 h-5 cursor-pointer rounded-md accent-indigo-950"
                        checked={isOtherChecked}
                        onChange={handleOtherChange}
                         />
                        <label
                        htmlFor="bug-report-checkbox"
                        className="text-md font-medium text-gray-200 cursor-pointer select-none"
                        >Complement</label>
                        <small className="text-gray-500 cursor-not-allowed">
                            (These will be shown in testimonials section.)
                        </small> 
                    </div>
                    <div 
                    id="bug-report-container" 
                    className={`mt-4 transition-all duration-300 ${isOtherChecked 
                        ? 'opacity-100 max-h-48'
                         : 'opacity-0 max-h-0 overflow-hidden'}`}
                    >
                        <textarea   
                        name="complement-text"
                        rows={4}
                        className="w-full p-3 rounded-md border border-gray-500 focus:ring-2
                         focus:ring-indigo-950 focus:border-indigo-950 transition-all duration-200 resize-y placeholder-gray-400"
                         placeholder="Describe your compliment..."
                         disabled={!isOtherChecked}
                         value={complementText}
                         onChange={e => setComplementText(e.target.value)}
                        />
                    </div>
                </div>
                
                
                {/* Buttons */}
                <div className="flex gap-4 mt-6 justify-center items-center">
                    {/* <button 
                        // onClick={closeModal}
                        className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md">
                       Cancel
                    </button> */}
                    <button
                    disabled={!isFormValid}
                    type="submit"
                    className={`bg-blue-950 text-white px-4 py-2 rounded-md hover:bg-blue-800 ${!isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                    Submit
                    </button>
                </div>
                
            </div>
            </form>
        </div>
        
    )
}

export default FeedbackForm;