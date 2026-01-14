import type {
    Transaction,
    TransactionInsert,
    TransactionItem,
    TransactionItemInsert,
    PaymentMethod
} from '~/types/database.types'
import type { CartItem } from '../cart/useCart'
import { useI18n } from 'vue-i18n'

export const useTransactions = () => {
    const { t } = useI18n()
    const supabase = useSupabaseClient<any>()
    const userStore = useUserStore()
    // ...

    const loading = ref(false)
    const paymentMethods = ref<PaymentMethod[]>([])
    const user = useSupabaseUser()

    const ensureContext = async () => {
        if (!user.value) throw new Error(t('messages.auth.invalid_session'))

        // Get business_id from profile, not from user_metadata
        const businessId = userStore.profile?.business_id

        if (!businessId) {
            throw new Error(t('messages.auth.invalid_session'))
        }

        return {
            userId: user.value.id,
            businessId
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
        cashSessionId?: string | null
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
        source?: 'pos' | 'online_store'
    }) => {
        loading.value = true

        try {
            const { userId, businessId } = await ensureContext()
            const { config } = useBusinessConfig()

            const requiresCashSession = config.value.customizations.transactions.requireCashSession
            const isOnlineSource = data.source === 'online_store'

            if (requiresCashSession && !isOnlineSource && !data.cashSessionId) {
                throw new Error(t('messages.transactions.require_cash_session'))
            }

            const finalCashSessionId = isOnlineSource ? null : data.cashSessionId

            const subtotal = data.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
            const discount = data.items.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
            const total = data.items.reduce((sum, item) => sum + item.subtotal, 0)
            const transactionStatus = data.status || 'paid'
            const isPaid = transactionStatus === 'paid'

            const transactionPayload: TransactionInsert = {
                business_id: businessId,
                cash_session_id: finalCashSessionId,
                payment_method_id: isPaid ? data.paymentMethodId || null : null,
                status: transactionStatus,
                subtotal,
                tax: 0,
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
            const { data: transaction, error } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    payment_method_id: data.paymentMethodId,
                    payment_reference: data.paymentReference || null,
                    paid_at: new Date().toISOString()
                })
                .eq('id', transactionId)
                .select()
                .single()

            if (error) throw error

            if (transaction) {
                const { error: notifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: user.value?.id,
                        business_id: transaction.business_id,
                        type: 'transaction_paid',
                        title: t('messages.transactions.payment_received'),
                        message: t('messages.transactions.sale_charged', { number: transaction.transaction_number }),
                        data: { transaction_id: transaction.id },
                        read: false
                    })


            }

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
        loading.value = true

        try {
            const { businessId } = await ensureContext()

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
                .eq('business_id', businessId)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, data: data as Transaction[] }

        } catch (error: any) {

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
        loading.value = true

        try {
            const { businessId } = await ensureContext()

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    payment_methods (name, code),
                    transaction_items (id, product_name, quantity, unit_price, subtotal)
                `)
                .eq('business_id', businessId)
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

    const createOnvoPayment = async (transactionId: string) => {
        try {
            const { url } = await $fetch<{ url: string }>('/api/payments/create-payment', {
                method: 'POST',
                body: { transactionId }
            })
            return { success: true, url }
        } catch (error: any) {

            return { success: false, error: error.message || t('messages.transactions.payment_link_error') }
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
        createOnvoPayment
    }
}
