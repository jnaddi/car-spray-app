import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("Middleware executing for path:", request.nextUrl.pathname)

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Session status:", {
    hasSession: !!session,
    path: request.nextUrl.pathname,
    timestamp: new Date().toISOString(),
  })

  // If accessing dashboard without session, redirect to login
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("Redirecting to login: No session found")
    const redirectUrl = new URL("/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth pages with session, redirect to dashboard
  if (session && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    console.log("Redirecting to dashboard: Session found")
    const redirectUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
}

