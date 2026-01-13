export const useAuth = () => {
    const client = useSupabaseClient<any>()
    const userStore = useUserStore()
    const router = useRouter()

    // Expose store state directly
    const { user, profile, business, loading, error } = storeToRefs(userStore)

    const getBaseUrl = () => {
        if (import.meta.server) {
            const url = useRequestURL()
            return url.origin
        }
        return window.location.origin
    }

    const login = async (credentials: any) => {
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

            // Strict Verification: Waif for store to be ready
            await userStore.fetchProfile()

            return { success: true, ...data }
        } catch (e: any) {
            userStore.error = e.message
            return { success: false, error: e.message }
        } finally {
            userStore.loading = false
        }
    }

    const register = async (data: any) => {
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
        } catch (e: any) {
            userStore.error = e.message
            throw e
        } finally {
            userStore.loading = false
        }
    }

    const logout = async () => {
        try {
            userStore.loading = true
            const { error: err } = await client.auth.signOut()
            if (err) throw err

            userStore.clear()
            router.push('/login')
        } catch (e: any) {
            userStore.error = e.message
        } finally {
            userStore.loading = false
        }
    }

    const updateProfile = async (updates: any) => {
        try {
            userStore.loading = true

            if (!user.value?.id) throw new Error('No hay usuario')

            if (updates.full_name) {
                await client.auth.updateUser({
                    data: { full_name: updates.full_name }
                })
            }

            const { error: updateError } = await client
                .from('users')
                .update(updates)
                .eq('id', user.value.id)

            if (updateError) throw updateError

            // Store's realtime subscription will auto-update, but we can force it 
            await userStore.fetchProfile()

            return { success: true }
        } catch (e: any) {
            return { success: false, error: e.message }
        } finally {
            userStore.loading = false
        }
    }

    const updateBusiness = async (updates: any) => {
        try {
            userStore.loading = true

            if (!business.value?.id) throw new Error('No hay negocio asociado')

            const { error: updateError } = await client
                .from('businesses')
                .update(updates)
                .eq('id', business.value.id)

            if (updateError) throw updateError

            // Store's realtime subscription will auto-update
            return { success: true }
        } catch (e: any) {
            return { success: false, error: e.message }
        } finally {
            userStore.loading = false
        }
    }

    // Proxy other methods that don't need significant state interaction
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

    // Legacy support wrappers
    const ensureBusinessExists = async () => {
        if (!userStore.initialized) {
            await userStore.initialize()
        }
    }

    const initSessionKeeper = () => {
        // Keeps session alive, store handles data sync
        // ... (keep heartbeat logic if needed, or rely on Supabase client auto-refresh)
    }

    return {
        // State (Proxied from Store)
        user,
        profile,
        business,
        loading,
        error,

        // Actions
        login,
        register,
        logout,
        updateProfile,
        updateBusiness,

        // Utils
        resendConfirmation,
        forgotPassword,
        updatePassword,
        ensureBusinessExists,
        getBusinessType: () => business.value?.business_type,
        initSessionKeeper
    }
}