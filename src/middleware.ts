import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"]
// Define auth routes that should redirect to dashboard if authenticated
const AUTH_ROUTES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  try {
    // Initialize response and Supabase client
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const requestPath = request.nextUrl.pathname

    // Log middleware execution
    console.log({
      type: "MIDDLEWARE_EXECUTION",
      path: requestPath,
      timestamp: new Date().toISOString()
    })

    // Get and refresh session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Handle session error
    if (sessionError) {
      console.error({
        type: "SESSION_ERROR",
        error: sessionError.message,
        path: requestPath,
        timestamp: new Date().toISOString()
      })
      // Redirect to login on session error for protected routes
      if (isProtectedRoute(requestPath)) {
        return redirectToLogin(request)
      }
      return res
    }

    // Log session status
    console.log({
      type: "SESSION_STATUS",
      hasSession: !!session,
      path: requestPath,
      timestamp: new Date().toISOString()
    })

    // Handle protected routes (no session)
    if (!session && isProtectedRoute(requestPath)) {
      console.log({
        type: "UNAUTHORIZED_ACCESS",
        path: requestPath,
        timestamp: new Date().toISOString()
      })
      return redirectToLogin(request)
    }

    // Handle auth routes (with session)
    if (session && isAuthRoute(requestPath)) {
      console.log({
        type: "AUTHENTICATED_AUTH_ROUTE",
        path: requestPath,
        timestamp: new Date().toISOString()
      })
      return redirectToDashboard(request)
    }

    return res
  } catch (error) {
    // Log any unexpected errors
    console.error({
      type: "MIDDLEWARE_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })

    // On error in protected routes, redirect to login
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return redirectToLogin(request)
    }
    
    return NextResponse.next()
  }
}

// Helper functions
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(route => path.startsWith(route))
}

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path)
}

function redirectToLogin(request: NextRequest): NextResponse {
  const redirectUrl = new URL("/login", request.url)
  // Preserve the original URL to redirect back after login
  redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}

function redirectToDashboard(request: NextRequest): NextResponse {
  const redirectUrl = new URL("/dashboard", request.url)
  return NextResponse.redirect(redirectUrl)
}

// Matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
