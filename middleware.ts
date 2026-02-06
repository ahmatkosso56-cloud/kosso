import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  const publicRoutes = [
    /^\/sign-in/,
    /^\/sign-up/,
    /^\/page\/.*/,   // ← IMPORTANT
    /^\/queue\/.*/,
    /^\/client\/.*/,
  ]

  const isPublic = publicRoutes.some((r) => r.test(req.nextUrl.pathname))

  if (!isPublic) {
    auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
