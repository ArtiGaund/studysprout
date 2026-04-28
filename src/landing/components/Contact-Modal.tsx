'use client';

import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { Github, Linkedin, Mail, Send, X } from "lucide-react";
import { useState } from "react";

export const ContactModal = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const [ isSent, setIsSent ] = useState(false);
    if(!isOpen) return;
    
    const submitFeedback = async(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        const userEmail = (form.elements.namedItem("email") as HTMLTextAreaElement)?.value;
        const feedbackFromLanding = (form.elements.namedItem("feedback") as HTMLTextAreaElement)?.value;
        
        try {        
            const sendFeedback = await axios.post(`/api/send-feedback`, { 
                userEmail, 
                feedbackFromLanding 
            });
            if(!sendFeedback){
                toast({
                    title: "Failed to send feedback",
                    description: "Please try again",
                    variant: "destructive"
                })
            }
            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                onClose(); //auto close after 2 seconds
            }, 2000);
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
            className="absolute inset-0 bg-[#050A0A]/80 backdrop-blur-md"
            onClick={onClose}
            />
            
            {/* Modal Card */}
            <div className="relative w-full max-w-4xl bg-[#080C0C] border border-white/10
            rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in
            zoom-in duration-300">

                {/* Left Side: Social & Link (The "Developer Sidebar") */}
                <div className="w-full md:w-72 bg-[#63FF9D]/5 border-b md:border-b-0 md:border-r
                 border-white/5 p-8 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[#63FF9D] text-[10px] font-black uppercase mb-6
                        tracking-[0.2em]">
                            Developer Core
                        </h4>
                        <div className="space-y-6">
                            <a 
                            href={process.env.NEXT_PUBLIC_LINKEDIN_PROFILE}
                            target="_blank"
                            className="flex items-center gap-3 text-gray-400 hover:text-white
                            transition-colors group"
                            >
                                <Linkedin size={18} className="group-hover:text-[#63FF9D]"/>
                                <span className="text-xs font-medium">LinkedIn</span>
                            </a>
                            <a 
                            href={process.env.NEXT_PUBLIC_GITHUB_PROFILE}
                            target="_blank"
                            className="flex items-center gap-3 text-gray-400 hover:text-white
                            transition-colors group"
                            >
                                <Github size={18} className="group-hover:text-[#63FF9D]"/>
                                <span className="text-xs font-medium">Github</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-400 group">
                                <Mail size={18} className="text-[#63FF9D]/50"/>
                                <span className="text-xs font-medium truncate">
                                    artigaund2210@gmail.com 
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: The Form */}
                <div className="flex-1 p-8 sm:p-12 relative">
                    <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20}/>
                    </button>

                    <header className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Transmission
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Send a message directly to the developer.
                        </p>
                    </header>

                    <form 
                    className="space-y-4" 
                    onSubmit={submitFeedback}
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-600 uppercase
                            tracking-widest">
                                Email Address
                            </label>
                            <input 
                            type="email"
                            name="email"
                            required
                            placeholder="commander@enterprice.com"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl
                            px-4 py-3 text-sm text-white focus:outline-none focus:border-[#63FF9D]/50
                            transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-600 uppercase
                            tracking-widest">
                                Message
                            </label>
                            <textarea 
                            rows={4}
                            name="feeback"
                            required
                            placeholder="Share your feedback or inquiries..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl
                            px-4 py-3 text-sm text-white focus:outline-none focus:border-[#63FF9D]/50
                            transition-colors resize-none"
                            />
                        </div>

                        <button
                        className="w-full bg-[#63FF9D] text-black font-black uppercase text-[11px]
                        tracking-widest py-4 rounded-xl flex items-center justify-center gap-2
                        hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(99,255,157,0.2)]"
                        >
                            <Send size={14}/>
                            Dispatch Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}