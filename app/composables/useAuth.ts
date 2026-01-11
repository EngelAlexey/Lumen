import type { Database } from '~/types/database.types'

export const useAuth = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()
    const router = useRouter()

    const register = async (userData: {
        email: string
        password: string
        fullName: string
        businessName: string
        businessType: 'retail' | 'gastronomy' | 'services'
        phone?: string
        address?: string
    }) => {
        try {
            console.log('1. Starting User Registration...')

            // 1. Create User via Auth
            // Store business data in metadata for later creation (lazy creation)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        phone: userData.phone || null,
                        role: 'owner',
                        business_name: userData.businessName,
                        business_type: userData.businessType,
                        business_address: userData.address || null
                    }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user returned from signUp')

            console.log('2. User created Auth ID:', authData.user.id)
            console.log('3. Skipping immediate business creation to prevent FK race conditions.')

            return { success: true, user: authData.user }

        } catch (error: any) {
            console.error('Registration error:', error)
            return { success: false, error: error.message }
        }
    }

    const ensureBusinessExists = async () => {
        let user = useSupabaseUser()

        // Robust session check
        if (!user.value) {
            const { data } = await supabase.auth.getSession()
            if (data.session?.user) {
                user.value = data.session.user as any
            } else {
                console.log('No user session found in ensureBusinessExists, skipping.')
                return
            }
        }

        // Final sanity check
        if (!user.value) return

        try {
            // Check if business already exists for this owner
            const { data: existingBusiness, error: existingError } = await supabase
                .from('businesses')
                .select('id')
                .eq('owner_id', user.value.id)
                .single()

            if (existingBusiness) {
                // If business exists but user_metadata.business_id is not set, update it
                if (user.value && !user.value.user_metadata?.business_id) {
                    await supabase.auth.updateUser({ data: { business_id: existingBusiness.id } })
                }
                return // All good, business already linked
            }

            // If no existing business, check if the error is "no rows found" (PGRST116)
            if (existingError && existingError.code !== 'PGRST116') {
                throw existingError // Re-throw if it's a real error
            }

            // If no business found, create it from metadata
            if (!user.value?.user_metadata) {
                console.error('No user metadata found for deferred business creation')
                return
            }

            const meta = user.value.user_metadata
            console.log('Creating deferred business for:', meta)

            // 1. Create Business via RPC
            const { data: business, error: businessError } = await supabase
                .rpc('create_initial_business', {
                    p_name: meta.business_name || 'Mi Negocio',
                    p_business_type: meta.business_type || 'retail',
                    p_phone: meta.phone || null,
                    p_address: meta.business_address || null
                })
                .single()

            if (businessError) throw businessError

            const biz = business as any
            console.log('Deferred Business created ID:', biz.id)

            // 2. Link Owner to the newly created business
            const { error: updateError } = await supabase
                .from('businesses')
                .update({ owner_id: user.value.id })
                .eq('id', biz.id)

            if (updateError) throw updateError
            console.log('Deferred Business linked to Owner successfully.')

            // 3. Update user metadata with business_id (for session)
            await supabase.auth.updateUser({
                data: { business_id: biz.id }
            })

        } catch (e) {
            console.error('Error ensuring business:', e)
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            return { success: true, user: data.user }
        } catch (error: any) {
            console.error('Login error:', error)
            return { success: false, error: error.message }
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
            return { success: true }
        } catch (error: any) {
            console.error('Logout error:', error)
            return { success: false, error: error.message }
        }
    }

    const getUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_current_user_profile')
                .single()

            if (error) throw error

            const profileData = data as any

            return {
                success: true,
                profile: {
                    ...profileData,
                    isTrialing: profileData.subscription_status === 'trialing',
                    isPaid: profileData.subscription_status === 'active'
                }
            }
        } catch (error: any) {
            console.error('Get profile error:', error)
            return { success: false, error: error.message }
        }
    }

    const updateProfile = async (updates: {
        full_name?: string
    }) => {
        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData?.session?.user?.id

            if (!userId) {
                return { success: false, error: 'No autenticado' }
            }

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            console.error('Update profile error:', error)
            return { success: false, error: error.message }
        }
    }

    const updateBusiness = async (updates: {
        name?: string
        phone?: string
        address?: string
        business_type?: string
    }) => {
        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData?.session?.user?.id

            if (!userId) {
                return { success: false, error: 'No autenticado' }
            }

            // 1. Get current user data to find business_id
            let { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id, user_metadata')
                .eq('id', userId)
                .single()

            const typedUser = userData as { business_id: any, user_metadata: any } | null

            // 2. Auto-recovery: If no business_id, try to create/link it now
            if (!userData?.business_id) {
                console.warn('User has no business_id. Attempting auto-recovery...')
                await ensureBusinessExists()

                // Re-fetch user data after recovery attempt
                const result = await supabase
                    .from('users')
                    .select('business_id, user_metadata')
                    .eq('id', userId)
                    .single()

                userData = result.data
                userError = result.error
            }

            if (userError || !userData?.business_id) {
                console.error('Failed to resolve business_id even after recovery.')
                throw new Error('Usuario sin negocio asignado. Contacte soporte.')
            }

            const { error } = await supabase
                .from('businesses')
                .update(updates)
                .eq('id', userData.business_id)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            console.error('Update business error:', error)
            return { success: false, error: error.message }
        }
    }

    const getBusinessType = async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData?.session?.user?.id

            if (!userId) return 'retail'

            const { data, error } = await supabase
                .from('users')
                .select('business_id, businesses(business_type)')
                .eq('id', userId)
                .single()

            if (error) throw error

            const businessData = data as any
            return businessData?.businesses?.business_type || 'retail'
        } catch (error) {
            console.warn('Error fetching business type, defaulting to retail', error)
            return 'retail'
        }
    }

    return {
        user,
        register,
        login,
        logout,
        getUserProfile,
        updateProfile,
        updateBusiness,
        getBusinessType,
        ensureBusinessExists
    }
}