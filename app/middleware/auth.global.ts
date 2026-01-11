export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const { getBusinessType } = useAuth()

    // Whitelist public routes
    const publicRoutes = ['/login', '/register', '/pricing', '/']
    if (publicRoutes.includes(to.path)) return

    if (!user.value) {
        return navigateTo('/login')
    }

    // Check subscription status
    // Assuming we store subscription status in metadata or have a way to check it.
    // Ideally we iterate on the 'customers' table or Stripe metadata.
    // For now, let's assume we rely on a metadata flag 'subscription_status' or similar if we sync it.
    // OR we check if they just registered and need to pay.

    // Simple check: If they are accessing dashboard and query param ?success=true exists, we might want to refresh session.

    // For now, we don't have a rigid 'subscription_active' flag yet, 
    // but the user wants to force payment step.

    // Let's rely on the pages to handle it for now, 
    // or implement a check if we store 'subscription_status' in public.users/customers.
})
