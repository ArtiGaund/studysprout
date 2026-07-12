export async function HEAD(){
    return new Response(null, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }, 
    });
}

export async function GET() {
    return new Response("ok", { status: 200 });
}