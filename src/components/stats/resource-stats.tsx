'use client';

interface ResourceStatsProps{
    dirType: "workspace" | "folder";
    folders?: number;
    files?: number;
}

const ResourceStats: React.FC<ResourceStatsProps> = ({
    dirType,
    folders,
    files
}) => {

    return(
        <div className="fixed bottom-0">
            
        </div>
    )
}

export default ResourceStats;