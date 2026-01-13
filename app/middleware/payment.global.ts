export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const store = useBusinessStore()

    const publicRoutes = [
        '/login',
        '/register',
        '/pricing',
        '/auth/callback',
        '/', // Landing page is now public
        '/payment/processing',
        '/auth/onboarding',
        '/payment/success',
        '/payment/test'
    ]

    console.log('[PaymentMiddleware] Checking path:', to.path)

    if (publicRoutes.some(path => to.path === path || to.path.startsWith(path + '/'))) {
        console.log('[PaymentMiddleware] Path is public:', to.path)
        return
    }

    if (!user.value) {
        console.log('[PaymentMiddleware] User not logged in, redirecting to /login')
        return navigateTo('/login')
    }

    // If store thinks it's initialized but subscription is NOT active, 
    // force a refresh to be sure it's not stale persistence.
    // Also fetch if not initialized.
    if (!store.initialized) {
        await store.fetchSessionData()
    } else if (!store.isSubscriptionActive) {
        // Force refresh if we haven't tried recently (prevent loop)
        await store.fetchSessionData(true)
    }

    if (!store.isSubscriptionActive) {
        // Check if user has a selected plan in metadata? 
        // For now, force pricing/payment selection.
        if (to.path !== '/pricing') {
            return navigateTo('/pricing')
        }
    }
})