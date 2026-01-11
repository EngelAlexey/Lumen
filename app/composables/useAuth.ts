export const useAuth = () => {
    const client = useSupabaseClient<any>()
    const user = useSupabaseUser()
    const router = useRouter()

    const getBaseUrl = () => {
        if (import.meta.server) {
            const url = useRequestURL()
            return url.origin
        }
        return window.location.origin
    }

    const loading = useState<boolean>('auth_loading', () => false)
    const error = useState<string | null>('auth_error', () => null)
    const profile = useState<any>('auth_profile', () => null)
    const business = useState<any>('auth_business', () => null)

    const fetchProfile = async () => {
        // Validación estricta para evitar errores 400 en Supabase
        if (!user.value || !user.value.id) {
            profile.value = null
            business.value = null
            return
        }

        try {
            const { data: userData, error: userError } = await client
                .from('users')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (userError && userError.code !== 'PGRST116') throw userError

            profile.value = userData || null

            if (userData?.business_id) {
                const { data: businessData, error: businessError } = await client
                    .from('businesses')
                    .select('*')
                    .eq('id', userData.business_id)
                    .single()

                if (businessError && businessError.code !== 'PGRST116') {
                    console.error('Error fetching business:', businessError)
                }
                business.value = businessData
            } else {
                business.value = null
            }

        } catch (e: any) {
            console.error('Error fetching profile:', e)
        }
    }

    const waitForProfile = async (userId: string, attempts = 0): Promise<void> => {
        if (!userId) return
        if (attempts > 10) return

        const { data } = await client
            .from('users')
            .select('id, business_id')
            .eq('id', userId)
            .maybeSingle()

        if (data && data.business_id) {
            return
        } else {
            await new Promise(resolve => setTimeout(resolve, 500))
            return waitForProfile(userId, attempts + 1)
        }
    }

    const register = async (data: any) => {
        try {
            loading.value = true
            error.value = null

            // En el flujo Registro -> Stripe, los datos de pago pueden ir nulos inicialmente
            const metadata = {
                full_name: data.fullName,
                role: 'owner',
                business_name: data.businessName,
                business_type: data.businessType || 'retail',
                stripe_customer_id: data.stripeCustomerId || null,
                stripe_subscription_id: data.stripeSubscriptionId || null,
                subscription_status: data.subscriptionStatus || 'trialing'
            }

            const { data: authData, error: authError } = await client.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: metadata,
                    emailRedirectTo: `${getBaseUrl()}/login`
                }
            })

            if (authError) throw authError

            if (authData.user) {
                // Si la sesión se creó automáticamente, esperamos a que el trigger
                // cree el negocio y luego CERRAMOS sesión para forzar el flujo hacia Login
                if (authData.session) {
                    await waitForProfile(authData.user.id)
                    await client.auth.signOut()
                }

                return {
                    ...authData,
                    success: true,
                    requiresLogin: true
                }
            }

            return authData
        } catch (e: any) {
            console.error('Registration error:', e)
            error.value = e.message || 'Error durante el registro'
            throw e
        } finally {
            loading.value = false
        }
    }

    const resendConfirmation = async (email: string) => {
        try {
            loading.value = true
            error.value = null

            const { error: err } = await client.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${getBaseUrl()}/login`
                }
            })

            if (err) throw err
            return true
        } catch (e: any) {
            error.value = e.message || 'Error al reenviar correo'
            throw e
        } finally {
            loading.value = false
        }
    }

    const login = async (credentials: any) => {
        try {
            loading.value = true
            error.value = null

            // CORRECCIÓN: Validar que existan datos antes de enviarlos
            if (!credentials.email) throw new Error('Por favor ingresa tu correo electrónico')
            if (!credentials.password) throw new Error('Por favor ingresa tu contraseña')

            const { data, error: authError } = await client.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            })

            if (authError) throw authError

            await fetchProfile()

            return data
        } catch (e: any) {
            console.error('Login error:', e)
            error.value = e.message || 'Error al iniciar sesión'
            throw e
        } finally {
            loading.value = false
        }
    }

    const logout = async () => {
        try {
            loading.value = true
            const { error: err } = await client.auth.signOut()
            if (err) throw err

            profile.value = null
            business.value = null
            router.push('/login')
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    const forgotPassword = async (email: string) => {
        try {
            loading.value = true
            error.value = null

            const baseUrl = getBaseUrl()
            const redirectTo = `${baseUrl}/update-password`

            const { error: err } = await client.auth.resetPasswordForEmail(email, {
                redirectTo
            })

            if (err) throw err

            return true
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    const updatePassword = async (newPassword: string) => {
        try {
            loading.value = true
            error.value = null

            const { error: err } = await client.auth.updateUser({
                password: newPassword
            })

            if (err) throw err

            return true
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    const updateProfile = async (updates: any) => {
        try {
            loading.value = true
            error.value = null

            if (!user.value?.id) throw new Error('No hay usuario autenticado')

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

            await fetchProfile()

            return true
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    if (user.value?.id) {
        fetchProfile()
    }

    watch(user, async (newUser) => {
        if (newUser && newUser.id) {
            await fetchProfile()
        } else {
            profile.value = null
            business.value = null
        }
    })

    return {
        user,
        profile,
        business,
        loading,
        error,
        login,
        register,
        resendConfirmation,
        logout,
        fetchProfile,
        forgotPassword,
        updatePassword,
        updateProfile
    }
}