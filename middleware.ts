import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  const pathname = req.nextUrl.pathname

  // show pages publiques
  if (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/page/') ||
    pathname.startsWith('/queue/') ||
    pathname.startsWith('/client/')
  ) {
    return
  }

  // le reste protégé
  auth.protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
