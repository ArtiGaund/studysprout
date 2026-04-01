/**
 * @component FileUtilityDrawer
 * @description A high-fidelity, slide-out utility panel designed for the 'StudySprout' file editor.
 * * Key UX/UI Features:
 * - Responsive Transitions: Smooth hardware-accelerated transforms for panel visibility.
 * - Glassmorphism UI: Utilizes `backdrop-blur` and low-opacity borders for a modern, non-intrusive feel.
 * - Presence System: Visualizes active collaborators with real-time status indicators (Online/Pulse).
 * - Modular Sections: Scalable architecture for adding future utilities like 'Flashcards' or 'History'.
 */
'use client';

import { BookOpen, Users, X } from 'lucide-react';

interface FileUtilityDrawerProps{
    /** Controls the visibility of the drawer via CSS transitions */
    isOpen: Boolean;
    /** Callback to handle closing logic in the parent layout */
    onClose: () => void;
    /** Array of active session users provided by Socket.io/Real-time provider */
    activeUsers: {
        userId: string;
        username: string;
        [key: string]: any;
    }[];
}

export const FileUtilityDrawer = ({
    isOpen,
    onClose,
    activeUsers,
    // fileDetails
}: FileUtilityDrawerProps) => {
    return(
        <aside
        className={`
        absolute right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-md border-l
         border-emerald-500/20 shadow-2xl z-50 transition-transform duration-300 ease-in-out
         ${isOpen ? 'translate-x-0' : 'translate-x-full'}    
        `}
        >
            <div className="flex flex-col h-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500">
                        File Activity
                    </h2>
                    <button
                    onClick={onClose}
                    className="p-1 hover:bg-emerald-500/10 rounded-full transition-colors"
                    >   
                        <X size={18}/>
                    </button>
                </div>

                {/* Section 1: Active Users */}
                <div className='mb-10'>
                    <div className='flex items-center gap-2 mb-4'>
                        <Users size={16} className='text-emerald-500'/>
                        <h3 className='text-sm font-semibold'>Collaborators ({activeUsers.length})</h3>
                    </div>
                    <div className='space-y-4'>
                        {activeUsers.map((user) => (
                            <div
                            key={user.userId}
                            className='flex items-center gap-3 group'
                            >
                                <div
                                className={`
                                w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30
                                flex items-center justify-center text-xs font-bold    
                                `}
                                >
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className='flex flex-col'>
                                    <span className='text-sm font-medium'>{user.username}</span>
                                    <span 
                                    className='text-[10px] text-emerald-500 animate-pulse'>
                                        Online
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Flashcards */}
                <div className='mt-auto border-t border-emerald-500/10 pt-6'>
                    <div className='flex items-center gap-2 mb-4'>
                        <BookOpen size={16} className='text-emerald-500'/>
                        <h3 className='text-sm font-semibold'>Flashcards</h3>
                    </div>
                </div>
            </div>
        </aside>
    )
}