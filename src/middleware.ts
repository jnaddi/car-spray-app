import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const requestPath = request.nextUrl.pathname

    // Get and refresh session
    const {
      data: { session }
    } = await supabase.auth.getSession()

    // Handle protected routes (no session)
    if (!session && isProtectedRoute(requestPath)) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectTo", requestPath)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes (with session)
    if (session && isAuthRoute(requestPath)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    
    // On error in protected routes, redirect to login
    if (isProtectedRoute(request.nextUrl.pathname)) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return NextResponse.next()
  }
}

// Rest of the helper functions remain the same...
