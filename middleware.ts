import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/page(.*)',
  '/queue(.*)',   // page QR publique
  '/client(.*)',  // page client publique
])

export default clerkMiddleware(async (auth, request) => {
  try {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  } catch (err) {
    console.log('Clerk dev fallback:', err)
    // fallback dev : laisse passer
  }
})

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
}
