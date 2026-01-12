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
    if (!store.initialized || !store.isSubscriptionActive) {
        console.log('[PaymentMiddleware] Subscription invalid or uninitialized, forcing refresh...')
        await store.fetchSessionData(true) // forceRefetch = true
    }

    if (!store.isSubscriptionActive) {
        console.warn('[PaymentMiddleware] Subscription check failed.')
        console.warn('[PaymentMiddleware] Status:', store.subscriptionStatus)
        console.warn('[PaymentMiddleware] StripeID:', store.stripeSubscriptionId)
        console.warn('[PaymentMiddleware] IsActive (getter):', store.isSubscriptionActive)

        // Redirect to pricing with debug info instead of processing loop
        return navigateTo({
            path: '/pricing',
            query: {
                error: 'payment_required',
                debug_val_status: store.subscriptionStatus || 'undefined',
                debug_val_id: store.stripeSubscriptionId || 'undefined',
                debug_val_msg: store.debugMsg || 'No Message'
            }
        })
    }
})