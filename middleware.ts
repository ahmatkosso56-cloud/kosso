import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/page/:path*',   // ← FIX IMPORTANT
  '/queue/:path*',
  '/client/:path*',
])

export default clerkMiddleware(async (auth, request) => {
  try {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  } catch (err) {
    console.log('Clerk dev fallback:', err)
  }
})

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
}
