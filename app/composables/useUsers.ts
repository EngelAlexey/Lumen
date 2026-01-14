import type { UserRole } from './useRoles'

export interface User {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    business_id: string | null
    created_at: string
    updated_at: string
    is_active: boolean
}

export const useUsers = () => {
    const supabase = useSupabaseClient()
    const { currentRole, isAdmin } = useRoles()

    const getBusinessUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, users: data as User[] }
        } catch (error: any) {

            return { success: false, users: null, error: error.message }
        }
    }

    const createUser = async (userData: {
        email: string
        password: string
        fullName: string
        role: 'owner' | 'manager' | 'cashier' | 'staff'
        phone?: string
    }) => {
        try {
            const response = await $fetch<any>('/api/users/create', {
                method: 'POST',
                body: {
                    email: userData.email,
                    password: userData.password,
                    fullName: userData.fullName,
                    role: userData.role,
                    phone: userData.phone
                }
            })

            return { success: true, user: response.user }
        } catch (error: any) {

            const msg = error.data?.statusMessage || error.message || 'Error al crear usuario'
            return { success: false, error: msg }
        }
    }

    const updateUserFull = async (targetId: string, updates: {
        fullName?: string,
        email?: string,
        password?: string,
        role?: string,
        phone?: string,
        is_active?: boolean
    }) => {
        try {
            await $fetch('/api/users/update', {
                method: 'POST',
                body: {
                    targetUserId: targetId,
                    updates: updates
                }
            })
            return { success: true }
        } catch (error: any) {

            const msg = error.data?.statusMessage || error.message || 'Error al actualizar usuario'
            return { success: false, error: msg }
        }
    }

    const deleteUser = async (userId: string) => {
        try {
            await $fetch('/api/users/delete', {
                method: 'POST',
                body: { user_id: userId }
            })

            return { success: true }
        } catch (error: any) {

            const msg = error.data?.statusMessage || error.message || 'Error al eliminar usuario'
            return { success: false, error: msg }
        }
    }

    return {
        getBusinessUsers,
        createUser,
        updateUserFull,
        deleteUser,
        isAdmin
    }
}