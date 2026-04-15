import { auth } from "@/lib/auth"

export const runtime = "nodejs"

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return Response.redirect(new URL("/auth/login", req.url))
    }

    const role = req.auth.user?.role
    if (role !== "admin" && role !== "superadmin") {
      return Response.redirect(new URL("/", req.url))
    }
  }
})

export const config = {
  matcher: ["/admin/:path*"],
}
