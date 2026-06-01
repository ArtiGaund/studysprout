import { ActivityFeed } from "@/components/workspace-view/acitivity-feed";

interface ActivityPageProps{
    params: { workspaceId: string }
}
export default function ActivityPage({ params }: ActivityPageProps){
    return (
        <main className="min-h-[100vh] bg-[#0b0b0c] text-[#e2e2f0]">
            <ActivityFeed workspaceId={params.workspaceId}/>
        </main>
    )
}