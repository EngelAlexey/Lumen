import type { LoginCredentials, RegisterData, AuthResponse } from '~/types/composables'
import type { Database } from '~/types/database.types'

export const useAuth = () => {
    const client = useSupabaseClient<Database>()
    const userStore = useUserStore()
    const router = useRouter()

    const { user, profile, business, loading, error } = storeToRefs(userStore)

    const getBaseUrl = () => {
        if (import.meta.server) {
            const url = useRequestURL()
            return url.origin
        }
        return window.location.origin
    }

    const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            userStore.loading = true
            userStore.error = null

            if (!credentials.email) throw new Error('Email requerido')
            if (!credentials.password) throw new Error('Contraseña requerida')

            const { data, error: authError } = await client.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            })

            if (authError) throw authError

            await userStore.fetchProfile()

            return { success: true, ...data }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al iniciar sesión'
            userStore.error = errorMessage
            return { success: false, error: errorMessage }
        } finally {
            userStore.loading = false
        }
    }

    const register = async (data: RegisterData): Promise<AuthResponse> => {
        try {
            userStore.loading = true
            userStore.error = null

            const metadata = {
                full_name: data.fullName,
                business_name: data.businessName,
                business_type: data.businessType || 'retail',
                selected_plan: data.selectedPlan || 'solo',
            }

            const { data: authData, error: authError } = await client.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: metadata,
                    emailRedirectTo: `${getBaseUrl()}/auth/onboarding`
                }
            })

            if (authError) throw authError

            return { success: true, ...authData }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al registrar'
            userStore.error = errorMessage
            throw new Error(errorMessage)
        } finally {
            userStore.loading = false
        }
    }

    const logout = async (): Promise<void> => {
        try {
            userStore.loading = true
            const { error: err } = await client.auth.signOut()
            if (err) throw err

            userStore.clear()
            router.push('/login')
        } catch (e) {
            userStore.error = e instanceof Error ? e.message : 'Error al cerrar sesión'
        } finally {
            userStore.loading = false
        }
    }

    const updateProfile = async (updates: Partial<Database['public']['Tables']['users']['Update']>): Promise<AuthResponse> => {
        try {
            userStore.loading = true

            if (!user.value?.id) throw new Error('No hay usuario')

            if (updates.full_name) {
                await client.auth.updateUser({
                    data: { full_name: updates.full_name }
                })
            }

            // Type assertion needed due to Supabase client type limitations
            const { error: updateError } = await (client
                .from('users')
                .update(updates as never)
                .eq('id', user.value.id))

            if (updateError) throw updateError

            await userStore.fetchProfile()

            return { success: true }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al actualizar perfil'
            return { success: false, error: errorMessage }
        } finally {
            userStore.loading = false
        }
    }

    const updateBusiness = async (updates: Partial<Database['public']['Tables']['businesses']['Update']>): Promise<AuthResponse> => {
        try {
            userStore.loading = true

            if (!business.value?.id) throw new Error('No hay negocio asociado')

            // Use API endpoint to update business (bypasses RLS)
            await $fetch('/api/businesses/update', {
                method: 'PATCH',
                body: updates
            })

            // Refresh user data to get updated business
            await userStore.fetchProfile()

            return { success: true }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al actualizar negocio'
            return { success: false, error: errorMessage }
        } finally {
            userStore.loading = false
        }
    }

    const resendConfirmation = async (email: string) => {
        const { error: err } = await client.auth.resend({
            type: 'signup',
            email: email,
            options: { emailRedirectTo: `${getBaseUrl()}/auth/onboarding` }
        })
        if (err) throw err
        return true
    }

    const forgotPassword = async (email: string) => {
        const { error: err } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${getBaseUrl()}/update-password`
        })
        if (err) throw err
        return true
    }

    const updatePassword = async (newPassword: string) => {
        const { error: err } = await client.auth.updateUser({ password: newPassword })
        if (err) throw err
        return true
    }

    const ensureBusinessExists = async () => {
        if (!userStore.initialized) {
            await userStore.initialize()
        }
    }

    const initSessionKeeper = () => {
    }

    return {
        user,
        profile,
        business,
        loading,
        error,

        login,
        register,
        logout,
        updateProfile,
        updateBusiness,

        resendConfirmation,
        forgotPassword,
        updatePassword,
        ensureBusinessExists,
        getBusinessType: () => business.value?.business_type,
        initSessionKeeper,
        fetchProfile: userStore.fetchProfile
    }
}