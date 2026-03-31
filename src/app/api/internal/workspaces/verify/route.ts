import { WorkSpaceModel } from "@/model";

export async function POST(request:Request) {
   try {
     const secret = request.headers.get("x-internal-secret");
 
     if(secret !== process.env.INTERNAL_SECRET) {
         return new Response("Forbidden", { status: 403 });
     }
 
     const { workspaceId, userId } = await request.json();

     if(!workspaceId || !userId ){
        return new Response(
            JSON.stringify({
                allowed: false
            }),
            { status: 400 }
        )
     }

     const allowed = await WorkSpaceModel.exists({
        _id: workspaceId,
        $or: [
            { workspace_owner: userId },
            { "members.userId": userId },
        ]
     });

     return Response.json({
        allowed: Boolean(allowed)
     }, { status: 200 });
   } catch (error) {
    console.error("[] error in verify workspace ",error);
     return new Response(
            JSON.stringify({
                allowed: false
            }),
            { status: 500 }
        )
   }

}