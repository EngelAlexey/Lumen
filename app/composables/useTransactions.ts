import type {
    Transaction,
    TransactionInsert,
    TransactionItem,
    TransactionItemInsert,
    PaymentMethod
} from '~/types/database.types'
import type { CartItem } from './useCart'

export const useTransactions = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()

    const loading = ref(false)
    const paymentMethods = ref<PaymentMethod[]>([])

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

    const fetchPaymentMethods = async () => {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (!error && data) {
            paymentMethods.value = data
        }
        return paymentMethods.value
    }

    const createTransaction = async (data: {
        cashSessionId: string
        paymentMethodId?: string | null
        items: CartItem[]
        customerName?: string
        tableNumber?: string
        notes?: string
        paymentReference?: string
        status?: 'pending' | 'paid'
        customerId?: string
        deliveryStatus?: 'pending' | 'preparing' | 'ready' | 'in_route' | 'delivered' | 'cancelled'
        paymentMethod?: 'cash' | 'card_manual' | 'stripe_checkout' | 'transfer' | 'other'
    }) => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        loading.value = true

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (userError || !userData?.business_id) {
                throw new Error('Usuario sin negocio asignado')
            }

            const subtotal = data.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
            const discount = data.items.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
            const total = data.items.reduce((sum, item) => sum + item.subtotal, 0)
            const transactionStatus = data.status || 'paid'
            const isPaid = transactionStatus === 'paid'

            const transactionPayload: TransactionInsert = {
                business_id: userData.business_id,
                cash_session_id: data.cashSessionId,
                payment_method_id: isPaid ? data.paymentMethodId || null : null,
                status: transactionStatus,
                subtotal,
                tax: 0, // TODO: Implement tax calculation
                discount,
                total,
                customer_name: data.customerName || null,
                table_number: data.tableNumber || null,
                notes: data.notes || null,
                payment_reference: isPaid ? (data.paymentReference || null) : null,
                served_by: userId,
                paid_at: isPaid ? new Date().toISOString() : null,
                customer_id: data.customerId || null,
                delivery_status: data.deliveryStatus || 'delivered',
                payment_method: data.paymentMethod || (isPaid ? 'cash' : 'other')
            }

            const { data: transaction, error: txnError } = await supabase
                .from('transactions')
                .insert(transactionPayload)
                .select()
                .single()

            if (txnError) throw txnError

            const itemsPayload: TransactionItemInsert[] = data.items.map(item => ({
                transaction_id: transaction.id,
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price: item.product.price,
                discount: item.discount,
                subtotal: item.subtotal
            }))

            const { error: itemsError } = await supabase
                .from('transaction_items')
                .insert(itemsPayload)

            if (itemsError) throw itemsError

            return {
                success: true,
                transactionNumber: transaction.transaction_number,
                transactionId: transaction.id
            }

        } catch (error: any) {
            console.error('Create transaction error:', error)
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    const payTransaction = async (transactionId: string, data: {
        paymentMethodId: string
        paymentReference?: string
    }) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    payment_method_id: data.paymentMethodId,
                    payment_reference: data.paymentReference || null,
                    paid_at: new Date().toISOString()
                })
                .eq('id', transactionId)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const updateTransactionStatus = async (transactionId: string, status: 'pending' | 'delivered' | 'paid' | 'cancelled') => {
        try {
            const updates: any = { status }

            if (status === 'delivered') {
                updates.delivered_at = new Date().toISOString()
            } else if (status === 'cancelled') {
                updates.cancelled_at = new Date().toISOString()
            } else if (status === 'paid') {
                updates.paid_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', transactionId)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const getTodayTransactions = async () => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return { success: false, error: 'No autenticado', data: [] }

        loading.value = true

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (!userData?.business_id) throw new Error('Sin negocio asignado')

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    payment_methods (name, code)
                `)
                .eq('business_id', userData.business_id)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, data: data as Transaction[] }

        } catch (error: any) {
            console.error('Get transactions error:', error)
            return { success: false, error: error.message, data: [] }
        } finally {
            loading.value = false
        }
    }

    const getTransactions = async (filters?: {
        status?: string
        startDate?: string
        endDate?: string
        cashSessionId?: string
    }) => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return { success: false, error: 'No autenticado', data: [] }

        loading.value = true

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (!userData?.business_id) throw new Error('Sin negocio asignado')

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    payment_methods (name, code),
                    transaction_items (id, product_name, quantity, unit_price, subtotal)
                `)
                .eq('business_id', userData.business_id)
                .order('created_at', { ascending: false })

            if (filters?.status) {
                query = query.eq('status', filters.status)
            }
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate)
            }
            if (filters?.cashSessionId) {
                query = query.eq('cash_session_id', filters.cashSessionId)
            }

            const { data, error } = await query.limit(100)

            if (error) throw error

            return { success: true, data: data as Transaction[] }

        } catch (error: any) {
            console.error('Get transactions error:', error)
            return { success: false, error: error.message, data: [] }
        } finally {
            loading.value = false
        }
    }

    const cancelTransaction = async (transactionId: string, reason?: string) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
                })
                .eq('id', transactionId)

            if (error) throw error

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const createStripePayment = async (transactionId: string) => {
        try {
            const { url } = await $fetch<{ url: string }>('/api/stripe/create-payment', {
                method: 'POST',
                body: { transactionId }
            })
            return { success: true, url }
        } catch (error: any) {
            console.error('Stripe payment error:', error)
            return { success: false, error: error.message || 'Error generando link de pago' }
        }
    }

    return {
        loading,
        paymentMethods,
        fetchPaymentMethods,
        createTransaction,
        payTransaction,
        updateTransactionStatus,
        getTodayTransactions,
        getTransactions,
        cancelTransaction,
        createStripePayment
    }
}
