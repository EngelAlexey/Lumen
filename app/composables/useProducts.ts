import type { Database } from '~/types/database.types'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']

export const useProducts = () => {
    const supabase = useSupabaseClient<any>()
    const userStore = useUserStore()

    const ensureContext = async () => {
        if (!userStore.isready) {
            await userStore.initialize()
        }

        if (!userStore.business?.id) {
            await userStore.fetchProfile()
        }

        const userId = userStore.user?.id || userStore.profile?.id
        const businessId = userStore.business?.id

        if (!businessId || !userId) {
            throw new Error('Usuario sin negocio asignado o sesión inválida')
        }
        return {
            userId,
            businessId
        }
    }

    const getProducts = async () => {
        try {
            const { businessId } = await ensureContext()

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: data as Product[] }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const createProduct = async (product: Omit<ProductInsert, 'business_id'>) => {
        try {
            const { businessId } = await ensureContext()

            const payload = {
                ...product,
                business_id: businessId,
                is_active: true
            }

            const { error } = await supabase.from('products').insert(payload)

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
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
        try {
            await ensureContext()

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
                return { success: false, error: error.message }
            }

            return { success: true, data }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const subscribeToStockUpdates = (businessId: string, onUpdate: (payload: any) => void) => {
        return supabase
            .channel(`products-live-${businessId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'products',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    onUpdate(payload)
                }
            )
            .subscribe()
    }

    return { getProducts, createProduct, updateProduct, deleteProduct, subscribeToStockUpdates }
}