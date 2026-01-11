export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff'

const currentRole = ref<UserRole | null>(null)
const isLoading = ref(false)

export const useRoles = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

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

    const isOwner = computed(() => currentRole.value === 'owner')
    const isManager = computed(() => currentRole.value === 'manager')
    const isAdmin = computed(() =>
        currentRole.value === 'owner' || currentRole.value === 'manager'
    )

    const canAccessUsers = computed(() => isAdmin.value)
    const canCreateRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        if (currentRole.value === 'owner') return true
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    const canEditRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        if (currentRole.value === 'owner') return true
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    const canDeleteRole = (targetRole: UserRole): boolean => {
        if (!currentRole.value) return false

        if (currentRole.value === 'owner') return true
        if (currentRole.value === 'manager') {
            return targetRole === 'cashier' || targetRole === 'staff'
        }

        return false
    }

    const getRoleLabel = (role: UserRole): string => {
        const labels: Record<UserRole, string> = {
            owner: 'Propietario',
            manager: 'Gerente',
            cashier: 'Cajero',
            staff: 'Personal'
        }
        return labels[role] || role
    }

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
        currentRole: readonly(currentRole),
        isLoading: readonly(isLoading),

        isOwner,
        isManager,
        isAdmin,
        canAccessUsers,

        fetchCurrentRole,
        canCreateRole,
        canEditRole,
        canDeleteRole,
        getRoleLabel,
        getRoleColor
    }
}
