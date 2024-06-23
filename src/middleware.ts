import { NextRequest, NextResponse } from "next/server";
// default means use everywhere
export { default } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";

export async function middleware( request: NextRequest ){
    const token = await getToken({ req: request })

    const url = request.nextUrl

    // redirection strategy
    if(token &&
        (
            url.pathname.startsWith('/sign-in') ||
            url.pathname.startsWith('/sign-up') ||
            url.pathname.startsWith('/verify') ||
            url.pathname === '/'
        )
    ){
        return NextResponse.redirect(new URL('/dashboard', request.url ))
    }
    if(!token && url.pathname.startsWith('/dashboard')){
        return NextResponse.redirect(new URL('/sign-in', request.url ))
    }
    return NextResponse.next()
}

// where middleware should run
export const config = {
    matcher: [
        '/sign-in',
        '/sign-up',
        '/',
        '/dashboard/:path*',
        '/verify/:path*',
    ]
}