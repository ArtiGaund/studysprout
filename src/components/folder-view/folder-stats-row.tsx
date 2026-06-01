'use client';

import { StatsCard } from "../dashboard-shared/stats-card";
import { Clock, GraduationCap, Target } from "lucide-react";
import { useFolderStats } from "@/hooks/useStats";
import { formatHours, formatPercent, getFolderMasterySubtext, getFolderRecallSubtext } from "@/utils/statsHelper";
import { useSelector } from "react-redux";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";

export const FolderStatsRow = () => {
    const currentFolder = useSelector(selectCurrentFolder);
    const { stats, loading } = useFolderStats(currentFolder?._id);

    return(
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <StatsCard 
            title = "Active Reading"
            value={loading 
                ? "..."
                : formatHours(stats?.readingTimeHours ?? 0, stats?.readingTimeMinutes ?? 0)
            }
            subValue={stats ? `${stats.fileCount} files` : ""}
            icon={Clock}
            iconColor="text-orange-400"
            />
            <StatsCard 
            title="Mastery"
            value={loading
                ? "..."
                : formatPercent(stats?.masteryPercent)
            }
            subValue={getFolderMasterySubtext(stats)}
            icon={GraduationCap}
            iconColor="text-orange-300"
            />
            <StatsCard 
            title="Recall Rate"
            value={loading 
                ? "..."
                : formatPercent(stats?.recallRate)
            }
            subValue={getFolderRecallSubtext(stats)}
            icon={Target}
            iconColor="text-purple-400"
            />
        </div>
    )
}