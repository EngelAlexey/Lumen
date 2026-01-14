import type { Customer, CustomerInsert } from '~/types/database.types'

export const useCustomers = () => {
    const supabase = useSupabaseClient()
    const userStore = useUserStore()
    const toast = useToast()

    const loading = ref(false)

    const getCustomers = async (search?: string) => {
        try {
            loading.value = true
            let query = supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })

            if (search) {
                query = query.ilike('full_name', `%${search}%`)
            }

            const { data, error } = await query

            if (error) throw error

            return { success: true, data: data as Customer[] }
        } catch (error: any) {

            toast.add({ title: 'Error', description: error.message, color: 'error' })
            return { success: false, data: [], error: error.message }
        } finally {
            loading.value = false
        }
    }

    const createCustomer = async (customerData: Omit<CustomerInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
        try {
            loading.value = true
            if (!userStore.business?.id) throw new Error('No business ID found')

            const { data, error } = await (supabase
                .from('customers') as any)
                .insert({
                    ...customerData,
                    business_id: userStore.business.id
                })
                .select()
                .single()

            if (error) throw error

            return { success: true, data }
        } catch (error: any) {

            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        try {
            loading.value = true
            const { data, error } = await (supabase
                .from('customers') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            return { success: true, data }
        } catch (error: any) {

            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    const deleteCustomer = async (id: string) => {
        try {
            loading.value = true
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) throw error

            return { success: true }
        } catch (error: any) {

            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        getCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer
    }
}
