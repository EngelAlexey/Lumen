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
            const { data: business, error: businessError } = await supabase
                .rpc('create_initial_business', {
                    p_name: userData.businessName,
                    p_business_type: userData.businessType,
                    p_phone: userData.phone || null,
                    p_address: userData.address || null
                })
                .single()

            if (businessError) throw businessError

            const biz = business as any

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        phone: userData.phone || null,
                        role: 'owner',
                        business_id: biz.id
                    }
                }
            })

            if (authError) throw authError

            await supabase
                .from('businesses')
                .update({ owner_id: authData.user?.id })
                .eq('id', biz.id)

            return { success: true, user: authData.user }
        } catch (error: any) {
            console.error('Registration error:', error)
            return { success: false, error: error.message }
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

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (userError || !userData?.business_id) throw new Error('Usuario sin negocio asignado')

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
        getBusinessType
    }
}