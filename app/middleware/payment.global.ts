export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const store = useBusinessStore()

    const publicRoutes = [
        '/login',
        '/register',
        '/pricing',
        '/auth/callback',
        '/',
        '/payment/processing',
        '/auth/onboarding',
        '/payment/success'
    ]

    if (publicRoutes.some(path => to.path === path || to.path.startsWith(path + '/'))) {
        return
    }

    if (!user.value) {
        return navigateTo('/login')
    }

    // If store thinks it's initialized but subscription is NOT active, 
    // force a refresh to be sure it's not stale persistence.
    // Also fetch if not initialized.
    if (!store.initialized) {
        await store.fetchSessionData()
    } else if (!store.isSubscriptionActive) {
        // Only force refresh if we haven't tried recently (prevent loop)
        // For now, let's just log and skip the forced blocking refresh to prevent freezing
        console.warn('[PaymentMiddleware] Subscription inactive, but store initialized. Skipping forced refresh to avoid freeze.')
        // await store.fetchSessionData(true) 
    }

    if (!store.isSubscriptionActive) {
        console.warn('[PaymentMiddleware] Subscription check failed (BYPASSED).')
        // return navigateTo('/pricing') // TEMPORARY BYPASS
    }
})