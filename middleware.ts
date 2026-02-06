import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  const pathname = req.nextUrl.pathname

  // pages publiques
  if (
    pathname.startsWith('/page/') ||
    pathname.startsWith('/queue/') ||
    pathname.startsWith('/client/')
  ) {
    return
  }

  // tout le reste = protégé
  auth.protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
