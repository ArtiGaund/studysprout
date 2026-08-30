import config from "../config/config";

export async function verifyWorkspaceAccess(workspaceId:string, userId: string) {
    const res = await fetch(`${config.MAIN_API_URL}/internal/workspace/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-internal-secret": config.INTERNAL_SECRET!,
        },
        body: JSON.stringify({ workspaceId, userId }),
    })

    const data = await res.json();
    return data.allowed === true
}