/**
 * Transactions Composable
 * Handles CRUD operations for sales transactions
 */

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

    // ===== PAYMENT METHODS =====

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

    // ===== CREATE TRANSACTION =====

    const createTransaction = async (data: {
        cashSessionId: string
        paymentMethodId: string
        items: CartItem[]
        customerName?: string
        tableNumber?: string
        notes?: string
        paymentReference?: string
    }) => {
        if (!user.value?.id) return { success: false, error: 'No autenticado' }

        loading.value = true

        try {
            // 1. Get business_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', user.value.id)
                .single()

            if (userError || !userData?.business_id) {
                throw new Error('Usuario sin negocio asignado')
            }

            // 2. Calculate totals
            const subtotal = data.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
            const discount = data.items.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
            const total = data.items.reduce((sum, item) => sum + item.subtotal, 0)

            // 3. Insert transaction header
            const transactionPayload: TransactionInsert = {
                business_id: userData.business_id,
                cash_session_id: data.cashSessionId,
                payment_method_id: data.paymentMethodId,
                status: 'paid',
                subtotal,
                tax: 0, // TODO: Implement tax calculation
                discount,
                total,
                customer_name: data.customerName || null,
                table_number: data.tableNumber || null,
                notes: data.notes || null,
                payment_reference: data.paymentReference || null,
                served_by: user.value.id,
                paid_at: new Date().toISOString()
            }

            const { data: transaction, error: txnError } = await supabase
                .from('transactions')
                .insert(transactionPayload)
                .select()
                .single()

            if (txnError) throw txnError

            // 4. Insert transaction items
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

            // 5. Inventory is automatically decreased by SQL trigger!

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

    // ===== GET TODAY'S TRANSACTIONS =====

    const getTodayTransactions = async () => {
        if (!user.value?.id) return { success: false, error: 'No autenticado', data: [] }

        loading.value = true

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', user.value.id)
                .single()

            if (!userData?.business_id) throw new Error('Sin negocio asignado')

            // Get today's date range
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

    // ===== GET ALL TRANSACTIONS (with optional filters) =====

    const getTransactions = async (filters?: {
        status?: string
        startDate?: string
        endDate?: string
        cashSessionId?: string
    }) => {
        if (!user.value?.id) return { success: false, error: 'No autenticado', data: [] }

        loading.value = true

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', user.value.id)
                .single()

            if (!userData?.business_id) throw new Error('Sin negocio asignado')

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    payment_methods (name, code)
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

    // ===== CANCEL TRANSACTION =====

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

            // TODO: Consider reversing inventory (would need separate logic)

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    return {
        loading,
        paymentMethods,
        fetchPaymentMethods,
        createTransaction,
        getTodayTransactions,
        getTransactions,
        cancelTransaction
    }
}
