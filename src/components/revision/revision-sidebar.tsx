'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "../ui/sheet";
import FlashcardTypesForm from "../ui/flashcard-types-form";

interface RevisionSidebarProps{
    params: { workspaceId: string};
    className?: string;
}
const RevisionSidebar: React.FC<RevisionSidebarProps> = ({ params, className }) => {
    const { isRevisionSidebarOpen, setRevisionSidebarOpen } = useRevisionSidebar();
    return(
        <>
        { isRevisionSidebarOpen &&(
            <aside className={twMerge('hidden sm:flex sm:flex-col w-[300px] shrink-0 p-4 md:gap-4 !justify-between',
              className
                )}>
                <span>Revision Bar</span>
                <div className="flex flex-row gap-2 w-full overflow-hidden">
                    <Button
                     className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800"
                     >Generate FlashCard</Button>
                    <div className="flex shrink-0 w-6 h-6 mt-1">
                        <Sheet>
                            <SheetTrigger asChild>
                                <button>
                                    <PlusIcon 
                                    className="w-full h-full"
                                    />
                                </button>
                        </SheetTrigger>
                        <FlashcardTypesForm/>
                        </Sheet>
                    </div>
                </div>
            </aside>
        )}
        </>
    )
}

export default RevisionSidebar;