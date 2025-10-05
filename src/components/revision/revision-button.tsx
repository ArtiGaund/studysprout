'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";
import CypressClockRecordIcon from "../icons/CypressClockRecordIcon";


export default function RevisionButton(){
    const { isRevisionSidebarOpen, setRevisionSidebarOpen } = useRevisionSidebar();
    return(
         <button onClick={() => setRevisionSidebarOpen(true)}>
            <div className="flex flex-row gap-2 text-Neutrals/neutrals-7 transition-all cursor-pointer">
           
               {isRevisionSidebarOpen ?
                ( 
                  <>
                     <TooltipComponent message="Revision">
                        <CypressClockRecordIcon />
                     </TooltipComponent>
                  </>
                 )
               : (
                  <>
                     <CypressClockRecordIcon />
                     <span>Revision</span>
                  </>
               )
               }
                
            </div>
         </button>
    )
}