/**
 * Module Guard Middleware
 * 
 * Protects routes that belong to specific modules.
 * Redirects to dashboard if user's business doesn't have the required module enabled.
 */

export default defineNuxtRouteMiddleware((to) => {
    // Skip middleware for public routes
    if (to.path.startsWith('/store/') ||
        to.path === '/login' ||
        to.path === '/register' ||
        to.path === '/pricing') {
        return
    }

    const { hasModule, isLoaded } = useBusinessConfig()



    // Map routes to required modules
    const moduleRoutes: Record<string, any> = {
        '/cash-register': 'pos',
        '/transactions/new': 'pos',
        '/tables': 'tables',
        '/appointments': 'appointments',
        '/prescriptions': 'prescriptions',
        '/store-settings': 'onlineStore'
    }

    // Check if current route requires a module
    for (const [route, module] of Object.entries(moduleRoutes)) {
        if (to.path.startsWith(route)) {
            const allowed = hasModule(module as any)
            if (!allowed) {
                return navigateTo('/dashboard')
            }
        }
    }
})
