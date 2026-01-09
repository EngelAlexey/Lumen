/**
 * useRoles - Composable for role-based access control
 * Handles permission checking and role verification
 */

export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff'

// Global shared state for roles
const currentRole = ref<UserRole | null>(null)
const isLoading = ref(false)

export const useRoles = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    /**
     * Fetch current user's role from database
     */
    const fetchCurrentRole = async (userId?: string) => {
        const id = userId || user.value?.id
        if (!id) {
            console.warn('[useRoles] No user ID available')
            return null
        }

        isLoading.value = true
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', id)
                .single()

            if (error) throw error

            const userData = data as { role: UserRole }
            if (userData && userData.role) {
                currentRole.value = userData.role
                return userData.role
            }

            return null
        } catch (error) {
            console.error('Error fetching user role:', error)
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Check if current user is owner
     */
    const isOwner = computed(() => currentRole.value === 'owner')

    /**
     * Check if current user is manager
     */
    const isManager = computed(() => currentRole.value === 'manager')

    /**
     * Check if current user is owner or manager (admin roles)
     */
    const isAdmin = computed(() =>
        currentRole.value === 'owner' || currentRole.value === 'manager'
    )

    /**
     * Check if current user can access user management
     */
    const canAccessUsers = computed(() => isAdmin.value)

    /**
     * Check if current user can create a user with specified role
     */
    const canCreateRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        // Owners can create any role
        if (currentRole.value === 'owner') return true

        // Managers can only create cashiers and staff
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    /**
     * Check if current user can edit a user with specified role
     */
    const canEditRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        // Owners can edit anyone
        if (currentRole.value === 'owner') return true

        // Managers can only edit cashiers and staff
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    /**
     * Check if current user can delete a user with specified role
     */
    const canDeleteRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        // Owners can delete anyone execpt themselves
        if (currentRole.value === 'owner') return true

        // Managers can only delete cashiers and staff
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    /**
     * Get display name for role
     */
    const getRoleLabel = (role: UserRole): string => {
        const labels: Record<UserRole, string> = {
            owner: 'Propietario',
            manager: 'Gerente',
            cashier: 'Cajero',
            staff: 'Personal'
        }
        return labels[role] || role
    }

    /**
     * Get color variant for role badge
     */
    const getRoleColor = (role: UserRole): string => {
        const colors: Record<UserRole, string> = {
            owner: 'primary',
            manager: 'blue',
            cashier: 'green',
            staff: 'gray'
        }
        return colors[role] || 'gray'
    }

    return {
        // State
        currentRole: readonly(currentRole),
        isLoading: readonly(isLoading),

        // Computed
        isOwner,
        isManager,
        isAdmin,
        canAccessUsers,

        // Methods
        fetchCurrentRole,
        canCreateRole,
        canEditRole,
        canDeleteRole,
        getRoleLabel,
        getRoleColor
    }
}
