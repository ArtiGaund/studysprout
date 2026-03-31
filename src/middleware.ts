/**
 * NEXT.JS AUTHENTICATION MIDDLEWARE
 * ---------------------------------
 * This is middleware intercepts every request to protected routes.
 * It manages redirection logic:
 * 1. Logged-in users are prevented from visiting Auth pages (sign-in/sign-up)
 * 2. Unauthenticated users are redirected to Sign-In when accessing the Dashboard/
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware( request: NextRequest ){
    // Retrieve the JWT token from the request cookies
    const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET, 
    })

    const url = request.nextUrl

    /** *REDIRECTION STRATEGY:
     * If user is AUTHENTICATED and tried to access Auth pages or the Landing page, move them 
     * directly to the Dashboard
     */
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

    /** *ACCESS CONTROL:
     * If user is NOT AUTHENTICATED and tries to access the Dashboard, redirect them to the Sign-In page.
     * 
     */
    if(!token && url.pathname.startsWith('/dashboard')){
        return NextResponse.redirect(new URL('/sign-in', request.url ))
    }
    return NextResponse.next()
}

/** *MATCHING PATHS:
 * Define exactly which routes this middleware should monitor.
 */
export const config = {
    matcher: [
        '/sign-in',
        '/sign-up',
        '/',
        '/dashboard/:path*',
        '/verify/:path*',
    ]
}