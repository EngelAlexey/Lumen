export const useAuth = () => {
    const client = useSupabaseClient<any>()
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

            return { success: true }
        } catch (e: any) {
            return { success: false, error: e.message }
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