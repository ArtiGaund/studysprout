import { ActivityFeed } from "@/components/workspace-view/acitivity-feed";

interface ActivityPageProps{
    params: { workspaceId: string }
}
export default function ActivityPage({ params }: ActivityPageProps){
    return (
        <main className="min-h-[100vh] bg-[#0A0507] text-zinc-100">
            <ActivityFeed workspaceId={params.workspaceId}/>
        </main>
    )
}