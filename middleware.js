import { auth } from "@/lib/auth"

export const runtime = "nodejs"

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith("/admin")) {
    // req.auth may exist but have a cleared user id (token was invalidated
    // because status flipped to INACTIVE, user deleted, or password changed).
    if (!req.auth || !req.auth.user?.id) {
      const loginUrl = new URL("/auth/login", req.url)
      // Preserve the originally-requested target so the user lands back on it
      // after re-authenticating.
      loginUrl.searchParams.set("redirect", pathname + (search || ""))
      return Response.redirect(loginUrl)
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
