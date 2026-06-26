/**
 * @component FeedbackForm
 * @description A comprehensive feedback collection system for StudySprout. 
 * Allows users to submit Bug Reports, Feature Requests, and Testimonials (Complements) 
 * within a single unified interface.
 * * * Key Technical Features:
 * - Conditional Rendering: Smooth CSS transitions for expanding/collapsing form sections.
 * - Complex Validation: A derived `isFormValid` state that ensures at least one category 
 * is selected and that selected categories are not empty.
 * - Dynamic Payload Construction: Aggregates multiple feedback types into a single 
 * array for efficient batch processing on the backend.
 * - Provider Integration: Consumes user context via `useUser` for automated email attribution.
 */

'use client';

import { MailIcon, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../ui/use-toast';
import axios from 'axios';
import { useUser } from '@/lib/providers/user-provider';
import { sendFeedbackService } from '@/services/feedbackServices';

type CategoryId = 'bug' | 'feature' | 'complement';

type Category = {
    id: string;
    label: string;
    placeholder: string;
    name: string;
    hint?: string;
}

const CATEGORIES: Category[] = [
    {
        id: 'bug',
        label: 'Report a Bug',
        placeholder: 'Describe the bug you encountered...',
        name: 'bug-report-text',
    },
    {
        id: 'feature',
        label: 'Suggestion for Improvement',
        placeholder: 'Describe your suggestion...',
        name: 'suggestion-text',
        hint: 'Feature recommendation.',
    },
    {
        id: 'complement',
        label: 'Complement',
        placeholder: 'Share what you love about Studysprout...',
        name: 'complement-text',
        hint: 'Shown in testimonials.',
    },
];

const FeedbackForm = ({ onClose }: { onClose?: () => void }) => {
    const { user } = useUser();
    const { toast } = useToast();

    const [ checked, setChecked ] = useState<Record<CategoryId, boolean>>({
        bug: false,
        feature: false,
        complement: false,
    });

    const [ text, setText ] = useState<Record<CategoryId, string>>({
        bug: '',
        feature: '',
        complement: '',
    });

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const toggle = (id: CategoryId) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id]}));
    }

    /**
     * @variable isFormValid
     * Derived state to prevent empty submissions.
     * Logic: 
     * 1. At least one checkbox must be active.
     * 2. Any active checkbox must have a corresponding non-empty textarea.
     */
    const isFormValid = 
        (checked.bug || checked.feature || checked.complement) &&
        (!checked.bug || text.bug.trim().length > 0) &&
        (!checked.feature || text.feature.trim().length > 0) &&
        (!checked.complement || text.complement.trim().length > 0);
    
    /**
     * @function submitFeedback
     * Orchestrates the API submission process.
     * Transforms local state into a structured array of feedback objects.
     */
    const submitFeedback = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        const feedbacks = [];
        if(checked.bug && text.bug) 
            feedbacks.push({ type: 'Bug Report' as const, message: text.bug });
        if(checked.feature && text.feature) 
            feedbacks.push({ type: 'Feature Request' as const, message: text.feature});
        if(checked.complement && text.complement) 
            feedbacks.push({ type: 'Complement' as const, message: text.complement});
        
        try {
            const userEmail = user?.email as string;
            const sendFeedback = await sendFeedbackService({ userEmail, feedbacks });
            setChecked({
                bug: false,
                feature: false,
                complement: false,
            });
            setText({
                bug: '',
                feature: '',
                complement: '',
            });
            toast({
                title: "Success",
                description: "Feedback sent successfully",
            });
            onClose?.();
        } catch (error) {
            console.error("[FeedbackForm] Error sending feedback: ", error);
            toast({
                title: "Failed to send feedback",
                description: "Please try again",
                variant: "destructive"
            })
        }finally{
            setIsSubmitting(false);
        }
    }

   
    return (
       <div className='px-6 pb-6 overflow-y-auto max-h-[75vh] md:max-h-[65vh] scrollbar-thin
       scrollbar-thumb-zinc-800/60'>
            {/* Email Row */}
            <div className='flex items-center gap-x-3 bg-[#141416] border border-white/5 rounded-lg
            px-4 py-3 mb-6'>
                <MailIcon size={14} className='text-zinc-500 shrink-0'/>
                <span className='text-[10px] font-mono font-bold tracking-wider text-zinc-500
                uppercase shrink-0'>
                    Email
                </span>
                <span className='text-sm text-zinc-300 truncate'>{user?.email || "--"}</span>
            </div>

            <form onSubmit={submitFeedback} className='space-y-3'>
                {CATEGORIES.map(({ id: rawId, label, placeholder, name, hint }) => {
                    const id = rawId as CategoryId;
                    return (
                        <div
                            key={id}
                            className={`rounded-xl border transition-colors duration-200 overflow-hidden
                                ${checked[id]
                                    ? "border-purple-500/30 bg-purple-500/[0.03]"
                                    : "border-white/5 bg-[#141416]"
                                }`}
                        >   
                            {/* Checkbox header */}
                            <div 
                            className='flex items-center gap-x-3 px-4 py-3 cursor-pointer select-none'
                            onClick={() => toggle(id)}
                            >
                                {/* Custom checkbox */}
                                <div className={`w-4 h-4 rounded border flex items-center
                                    justify-center shrink-0 transition-colors
                                    ${checked[id]
                                        ? "bg-purple-600 border-purple-600"
                                        : "border-white/20 bg-zinc-800"
                                    }`}>
                                        {checked[id] && (
                                             <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                <path d="M1 4L3.5 6.5L9 1" stroke="white"
                                                 strokeWidth="1.5" strokeLinecap="round"
                                                  strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                </div>
                                <span className='text-sm font-semibold text-zinc-200'>
                                    {label}
                                </span>
                                {hint && (
                                    <span className='text-[10px] font-mono text-zinc-600 ml-auto'>
                                        {hint}
                                    </span>
                                )}
                            </div>

                            {/* Expandable Textarea */}
                            <div className={`transition-all duration-200 ${checked[id]
                                ? "max-h-40 opacity-100"
                                : "max-h-0 opacity-0 overflow-hidden"
                            }`}>
                                <div className='px-4 pb-4'>
                                    <textarea 
                                        name={name}
                                        rows={3}
                                        disabled={!checked[id]}
                                        value={text[id]}
                                        onChange={(e) => setText((prev) => ({ ...prev, [id]: e.target.value}))}
                                        placeholder={placeholder}
                                        className='w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4
                                        py-2.5 text-sm text-white outline-none focus-within:border-purple-500/30
                                        placeholder:text-zinc-700 font-medium transition-all resize-none
                                        scrollbar-thin scrollbar-thumb-zinc-800'
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Submit */}
                <div className='pt-2'>
                    <button
                        type='submit'
                        disabled={!isFormValid || isSubmitting}
                        className='w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800
                        disabled:text-zinc-600 text-white text-sm font-semibold py-3 px-4
                        rounded-xl flex items-center justify-center gap-x-2 transition-all
                        cursor-pointer disabled:cursor-not-allowed shadow-sm'
                    >
                        <SendIcon size={14} strokeWidth={2.5}/>
                        <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
                    </button>
                </div>
            </form>
       </div>
    )
}

export default FeedbackForm;