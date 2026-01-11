import type { Database } from '~/types/database.types'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']

export const useProducts = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()

    const getAuthenticatedUserId = async (): Promise<string | null> => {
        if (user.value?.id) return user.value.id

        try {
            const { data: { session } } = await supabase.auth.getSession()
            return session?.user?.id || null
        } catch (error) {
            console.error('Error getting session:', error)
            return null
        }
    }

    const getProducts = async () => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('id', userId)
            .single()

        if (userError || !userData?.business_id) {
            return { success: false, error: 'Usuario sin negocio asignado' }
        }

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', userData.business_id)
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching products:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as Product[] }
    }

    const createProduct = async (product: Omit<ProductInsert, 'business_id'>) => {
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            console.error('CreateProduct: User not authenticated')
            return { success: false, error: 'No autenticado (Sesión perdida)' }
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('id', userId)
            .single()

        if (userError || !userData || !userData.business_id) {
            return { success: false, error: 'No se encontró el ID del negocio' }
        }

        const payload = {
            ...product,
            business_id: userData.business_id,
            is_active: true
        }

        const { error } = await supabase.from('products').insert(payload)

        if (error) {
            console.error('Supabase Insert Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    }

    const deleteProduct = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)

        if (error) return { success: false, error: error.message }
        return { success: true }
    }

    const updateProduct = async (id: string, updates: Partial<ProductInsert>) => {
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            return { success: false, error: 'No autenticado' }
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase Update Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    }

    return { getProducts, createProduct, updateProduct, deleteProduct }
}