/**
 * SERVER-SIDE REALTIME EMITTER
 * ----------------------------
 * Role: Used by Next.js API routes to notify the Realtime Express server.
 * Note: This avoids 'windows' and 'browser socket' dependencies.
 */

export const emitServerEvent = async (
    endpoint: 'progress-update' | 'set-created' | 'set-deleted' | 'workspace-members-update',
    payload: any
) => {
    try {
         const response = await fetch(`${process.env.NEXT_PUBLIC_REALTIME_URL}/emit/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if(!response.ok){
            console.warn(`[Server-Realtime] Node rejected event ${endpoint}: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error(`[Server-Realtime] Failed to notify socket server: `,error);
    }
}