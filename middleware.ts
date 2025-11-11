import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = new Set(["/", "/auth/login"])
const AUTH_PATH_PREFIX = "/auth"
const AUTH_API_PREFIX = "/api/auth"
const USER_COOKIE = "user_id"

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isAuthApi = pathname.startsWith(AUTH_API_PREFIX)
  const isPublicPath = PUBLIC_PATHS.has(pathname)
  const isAuthPath = pathname.startsWith(AUTH_PATH_PREFIX)

  if (isAuthApi) {
    return NextResponse.next()
  }

  const userId = request.cookies.get(USER_COOKIE)?.value

  if (isAuthPath && userId) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo")
    const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"
    const url = new URL(safeRedirect, request.url)
    return NextResponse.redirect(url)
  }

  if (isPublicPath) {
    return NextResponse.next()
  }

  if (!userId) {
    const loginUrl = new URL("/auth/login", request.url)
    const target = `${pathname}${search}`
    if (pathname !== "/auth/login" && pathname !== "/") {
      loginUrl.searchParams.set("redirectTo", target)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
