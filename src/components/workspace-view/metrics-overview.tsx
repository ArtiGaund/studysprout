'use client';

import { Brain, Clock, HelpCircle, Loader2, Network } from "lucide-react";
import { StatsCard } from "../dashboard-shared/stats-card";
import { ActionItem } from "../dashboard-shared/action-item";
import { RelationshipGraph } from "../dashboard-shared/relationship-graph";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceStats } from "@/hooks/useStats";
import { 
    formatHours, 
    formatPercent, 
    getWorkspaceMasteredSubtext, 
    getWorkspaceRecallSubtext 
} from "@/utils/statsHelper";
import { WeeklyResearchGoals } from "./weekly-research-goals";
import { FlashcardSection } from "../dashboard-shared/flashcard-section";
import { RecentActivity } from "./recent-activity";

export const MetricsOverview = ({ workspaceId }: { workspaceId: string}) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const [ modalOpen, setModalOpen ] = useState(false);
  
    const conceptGraph = currentWorkspace?.conceptGraph;
    const isGenerating = currentWorkspace?.conceptGraphStatus === "generating";
    const folderCount = currentWorkspace?.folders.length ?? 0;
    const hasGraph = (conceptGraph?.nodes?.length ?? 0) > 0;
    const { generateWorkspaceConceptGraph } = useWorkspace();
    const { stats, loading } = useWorkspaceStats(currentWorkspace?._id);
   
    const masteryDisplay = loading
        ? "..."
        : stats?.hasProgress
            ? `${stats.masteredCount}`
            : '-'

    const handleMapGraph = async () => {
        console.log("[Metrics overview] going inside handleMapGraph method");
        if(!currentWorkspace?._id) return;
        try {
           if(hasGraph && !currentWorkspace?.conceptGraphStale){
                setModalOpen(true);
                return;
           }
           const result = await generateWorkspaceConceptGraph(currentWorkspace._id)
           if(result.success){
            setModalOpen(true);
           }
        } catch (error) {
            console.error("Error generating concept graph:", error);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Area: Stats and Goals*/}
            <div className="lg:col-span-3 flex flex-col gap-y-6 h-full">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard 
                        title="Reading Time"
                        value={ loading
                            ? "..."
                            : formatHours(stats?.readingTimeHours ?? 0, stats?.readingTimeMinutes ?? 0)
                        }
                        subValue={ stats
                            ? `${stats.fileCount} files · ${stats.folderCount} folders`
                            : ""
                        }
                        icon={Clock}
                        iconColor="text-blue-400"
                    />
                    <StatsCard 
                        title="Concepts Mastered"
                        value={masteryDisplay}
                        subValue={getWorkspaceMasteredSubtext(stats)}
                        icon={Brain}
                        iconColor="text-orange-400"
                    />
                    <StatsCard 
                    title="Recall Rate"
                    value={loading
                        ? "..."
                        : formatPercent(stats?.recallRate)
                    }
                    subValue={getWorkspaceRecallSubtext(stats)}
                    icon={HelpCircle}
                    iconColor="text-purple-400"
                    />
                </div>

                {/* Weekly Goals Chart Area */}
                <WeeklyResearchGoals workspaceId={workspaceId}/>
                <RecentActivity workspaceId={workspaceId}/>
            </div>

          
            {/* Right: Quick Actions Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-y-6 lg:sticky lg:max-h-[calc(100vh-2rem)]
            lg:top-4 lg:overflow-y-auto">
                <div 
                className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-5 flex flex-col
                gap-y-4"
                >
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Quick Action
                    </h3>
                   
                    <FlashcardSection workspaceId={workspaceId} />

                    {!hasGraph && <ActionItem 
                        icon={isGenerating ? Loader2 : Network}
                        label={
                        isGenerating 
                            ? "Generating Graph..."
                            : hasGraph
                                ? "View Graph"
                                : folderCount < 2
                                    ? "Map Graph (2+ folder needed)"
                                    : "Generate Map Graph"
                        }
                        handleAction={handleMapGraph}
                        disabled={isGenerating || folderCount < 2}
                        iconClassName={isGenerating ? "animate-spin text-purple-400" : null}
                        isGenerating={isGenerating}
                    />}
                </div>
                <div className="flex-1 min-h-0">
                    <RelationshipGraph level="workspace"/>
                </div>  
            </div>
        </div>
    )
}