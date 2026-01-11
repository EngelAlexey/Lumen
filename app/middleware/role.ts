export default defineNuxtRouteMiddleware(async (to) => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()

    let userId = user.value?.id
    if (!userId) {
        const { data: { session } } = await supabase.auth.getSession()
        userId = session?.user?.id
    }

    if (!userId) {
        return navigateTo('/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    const userRole = (userData as any)?.role as string | undefined

    const routeRoles: Record<string, string[]> = {
        '/users': ['owner', 'manager'],
        '/settings': ['owner', 'manager'],
        '/reports': ['owner', 'manager']
    }

    const allowedRoles = routeRoles[to.path]

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return navigateTo('/dashboard')
    }
})
