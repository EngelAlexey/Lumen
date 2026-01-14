export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff'

export const useRoles = () => {
    const userStore = useUserStore()

    const currentRole = computed<UserRole | null>(() => {
        return (userStore.profile?.role as UserRole) || null
    })

    const isLoading = computed(() => userStore.loading)

    const fetchCurrentRole = async (userId?: string) => {
        if (userId && userId !== userStore.user?.id) {
            return null
        }

        if (!userStore.initialized) {
            await userStore.initialize()
        }

        return currentRole.value
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
        const { getRoleLabel: getLabel } = useOptions()
        return getLabel(role)
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
        currentRole,
        isLoading,

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
