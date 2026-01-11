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

    if (publicRoutes.includes(to.path)) return

    if (!user.value) return

    const { data: userData, error } = await client
        .from('users')
        .select('business_id, subscription_status, business:businesses(subscription_status)')
        .eq('id', user.value.id)
        .single()

    if (error) {
        console.error('Middleware Error fetching user:', error)
        return
    }

    const businessStatus = (userData as any)?.business?.subscription_status
    const userStatus = (userData as any)?.subscription_status
    const status = businessStatus || userStatus // Fallback to user status if business join fails

    const validStatuses = ['active', 'trialing']

    if (!status || !validStatuses.includes(status)) {
        console.warn('Middleware: Invalid subscription status. Redirecting.')
        const savedPlan = user.value.user_metadata?.selected_plan

        if (savedPlan) {
            return navigateTo(`/payment/processing?plan=${savedPlan}`, { replace: true })
        } else {
            return navigateTo('/pricing?error=payment_required')
        }
    }
})