import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const requestPath = request.nextUrl.pathname

    // Await session and refresh token if needed
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Add session token to response headers if exists
    if (session) {
      res.headers.set('x-user-id', session.user.id)
    }

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

// ... rest of the helper functions remain the same
