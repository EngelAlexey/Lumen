export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

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

    if (publicRoutes.includes(to.path)) {
        // console.log('[Payment Middleware] Public route:', to.path)
        return
    }

    let userId = user.value?.id

    // Fallback: Check getSession if useSupabaseUser is not yet populated (handling race conditions)
    if (!userId) {
        const { data } = await client.auth.getSession()
        if (data?.session?.user?.id) {
            userId = data.session.user.id
            // console.log('[Payment Middleware] Recovered user ID from session:', userId)
        } else {
            console.log('[Payment Middleware] No user ID - Redirecting to Login')
            return navigateTo('/login')
        }
    }

    const { data: userData, error } = await client
        .from('users')
        .select('business_id')
        .eq('id', userId)
        .single()

    if (error || !userData) {
        console.error('Middleware Error fetching user:', error)
        return navigateTo('/login')
    }

    let businessStatus = null
    let stripeSubscriptionId = null

    if ((userData as any).business_id) {
        const { data: businessData, error: businessError } = await client
            .from('businesses')
            .select('subscription_status, stripe_subscription_id')
            .eq('id', (userData as any).business_id)
            .single()

        if (!businessError) {
            businessStatus = (businessData as any)?.subscription_status
            stripeSubscriptionId = (businessData as any)?.stripe_subscription_id
        }
    }

    const status = businessStatus

    const isValid = status === 'active' || (status === 'trialing' && !!stripeSubscriptionId)

    console.log(`[Payment Middleware] Status: ${status}, StripeID: ${stripeSubscriptionId}, IsValid: ${isValid}`)

    if (!isValid) {
        console.warn('Middleware: Invalid subscription status. Redirecting.')
        const savedPlan = user.value?.user_metadata?.selected_plan

        if (savedPlan) {
            return navigateTo(`/payment/processing?plan=${savedPlan}`, { replace: true })
        } else {
            return navigateTo('/pricing?error=payment_required')
        }
    }
})