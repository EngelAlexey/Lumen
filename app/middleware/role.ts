/**
 * Role-based Middleware
 * Restricts access to routes based on user role
 * Usage: Add to page meta: middleware: ['role']
 */

export default defineNuxtRouteMiddleware(async (to) => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value) {
        return navigateTo('/login')
    }

    // Get user role from database
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.value.id)
        .single()

    const userRole = userData?.role

    // Define route roles (can be extended in page meta)
    const routeRoles = {
        '/users': ['owner', 'manager'],
        '/settings': ['owner', 'manager'],
        '/reports': ['owner', 'manager']
    }

    // Check if route has role restrictions
    const allowedRoles = routeRoles[to.path]

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to dashboard if user doesn't have permission
        return navigateTo('/dashboard')
    }
})
