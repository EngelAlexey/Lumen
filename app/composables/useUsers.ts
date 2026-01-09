/**
 * useUsers - Composable for user management with role-based permissions
 * Compatible with existing users/index.vue page
 */

import type { UserRole } from './useRoles'

export interface User {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    business_id: string | null
    created_at: string
    updated_at: string
}

export const useUsers = () => {
    const supabase = useSupabaseClient()
    const toast = useToast()
    const { currentRole, canCreateRole, canEditRole, canDeleteRole, isAdmin } = useRoles()

    /**
     * Get all users in the current business
     */
    const getBusinessUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, users: data as User[] }
        } catch (error: any) {
            console.error('Error fetching users:', error)
            return { success: false, users: null, error: error.message }
        }
    }

    /**
     * Create a new user
     * NOTE: This requires Supabase admin API which should be called from a server endpoint
     * For now, this is a placeholder that shows the expected structure
     */
    const createUser = async (userData: {
        email: string
        password: string
        fullName: string
        role: 'owner' | 'manager' | 'cashier' | 'staff'
        phone?: string // Added phone
    }) => {
        try {
            // Check permission locally first for better UX
            if (!currentRole.value || !canCreateRole(userData.role)) {
                return {
                    success: false,
                    error: 'No tienes permisos para crear este tipo de usuario'
                }
            }

            // Call Secure Server Endpoint
            const response = await $fetch('/api/users/create', {
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
            console.error('Error creating user:', error)
            // Handle Nuxt API errors
            const msg = error.data?.statusMessage || error.message || 'Error al crear usuario'
            return { success: false, error: msg }
        }
    }

    /**
     * Update user information
     */
    const updateUser = async (userId: string, updates: {
        full_name?: string
        role?: UserRole
    }) => {
        try {
            // Get target user to check permission
            const { data: targetUser } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single() as any

            if (!targetUser) {
                return { success: false, error: 'Usuario no encontrado' }
            }

            // Check permission
            if (updates.role && !canEditRole(targetUser.role as UserRole)) {
                return {
                    success: false,
                    error: 'No tienes permisos para editar este usuario'
                }
            }

            const { error } = await supabase
                .from('users')
                .update(updates as any)
                .eq('id', userId)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            console.error('Error updating user:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete a user
     */
    const deleteUser = async (userId: string) => {
        try {
            // Check permission locally
            // We'll rely on server for strict check, but good to check roughly here
            if (currentRole.value !== 'owner' && currentRole.value !== 'manager') {
                return { success: false, error: 'No tienes permisos' }
            }

            // Call Secure Server Endpoint
            await $fetch('/api/users/delete', {
                method: 'POST',
                body: { user_id: userId }
            })

            return { success: true }
        } catch (error: any) {
            console.error('Error deleting user:', error)
            const msg = error.data?.statusMessage || error.message || 'Error al eliminar usuario'
            return { success: false, error: msg }
        }
    }

    return {
        getBusinessUsers,
        createUser,
        updateUser,
        deleteUser,
        isAdmin
    }
}
