import { verifyWorkspaceAccess } from "../services/mainApi.service";

import type { Server, Socket } from "socket.io";

export function registerWorkspaceHandlers(io: Server, socket: Socket){
    socket.on(
        "workspace:join", 
        async({ workspaceId }: { workspaceId: string},
        callback?: (ack: { ok: boolean; reason?: string; }) => void
    ) => {
        try {
            const userId = socket.data.user.id;

            const allowed = await verifyWorkspaceAccess(workspaceId, userId);

            if(!allowed){
                socket.emit("workspace:denied");
                return;
            }

            socket.join(`workspace:${workspaceId}`);

            io.to(`workspace:${workspaceId}`).emit("presence:update", {
                userId,
                status: "online",
            });
            callback?.({ ok: true });

        } catch (error) {
            console.error("[workspace:join] error: ",error);
            callback?.({ ok: false, reason: "server_error" });
        }   
    });
}