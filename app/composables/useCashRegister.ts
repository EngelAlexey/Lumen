import type { CashSession, PaymentMethod } from '~/types/database.types'

export const useCashRegister = () => {
    const supabase = useSupabaseClient<any>()
    const userStore = useUserStore()

    const currentSession = ref<CashSession | null>(null)
    const loading = ref(false)
    const paymentMethods = ref<PaymentMethod[]>([])

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

    const fetchCurrentSession = async () => {
        loading.value = true
        try {
            const { businessId } = await ensureContext()

            const { data, error } = await supabase
                .from('cash_sessions')
                .select('*')
                .eq('business_id', businessId)
                .eq('status', 'open')
                .maybeSingle()

            if (error) throw error
            currentSession.value = data
            return data

        } catch (error) {
            return null
        } finally {
            loading.value = false
        }
    }

    const openSession = async (openingCash: number) => {
        try {
            const { userId, businessId } = await ensureContext()

            const { data: existingSession } = await supabase
                .from('cash_sessions')
                .select('id')
                .eq('business_id', businessId)
                .eq('status', 'open')
                .maybeSingle()

            if (existingSession) {
                return { success: false, error: 'Ya existe una caja abierta' }
            }

            const { data, error } = await supabase
                .from('cash_sessions')
                .insert({
                    business_id: businessId,
                    opened_by: userId,
                    opening_cash: openingCash,
                    status: 'open',
                    opened_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            currentSession.value = data
            return { success: true, session: data }

        } catch (error: any) {

            return { success: false, error: error.message }
        }
    }

    const closeSession = async (closingCash: number, notes?: string) => {
        if (!currentSession.value?.id) {
            return { success: false, error: 'No hay sesión activa' }
        }

        try {
            const { userId } = await ensureContext()

            const { data: salesTotal } = await supabase
                .from('transactions')
                .select('total')
                .eq('cash_session_id', currentSession.value.id)
                .eq('status', 'paid')
                .not('payment_method_id', 'is', null)

            const { data: cashPayments } = await supabase
                .from('transactions')
                .select('total, payment_methods!inner(code)')
                .eq('cash_session_id', currentSession.value.id)
                .eq('status', 'paid')
                .eq('payment_methods.code', 'cash')

            const cashSalesTotal = cashPayments?.reduce((sum: number, t: any) => sum + (t.total || 0), 0) || 0
            const expectedCash = (currentSession.value.opening_cash || 0) + cashSalesTotal
            const cashDifference = closingCash - expectedCash

            const { error } = await supabase
                .from('cash_sessions')
                .update({
                    closing_cash: closingCash,
                    expected_cash: expectedCash,
                    cash_difference: cashDifference,
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    closed_by: userId,
                    notes: notes || null
                })
                .eq('id', currentSession.value.id)

            if (error) throw error

            currentSession.value = null
            return {
                success: true,
                summary: {
                    expectedCash,
                    closingCash,
                    difference: cashDifference
                }
            }

        } catch (error: any) {

            return { success: false, error: error.message }
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

    const getSessionSummary = async (sessionId: string) => {
        try {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    total,
                    status,
                    payment_method,
                    payment_methods (name, code)
                `)
                .eq('cash_session_id', sessionId)

            if (error) throw error

            const summary = {
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                transferSales: 0,
                onlineSales: 0,
                otherSales: 0,
                cancelledCount: 0
            }

            transactions?.forEach((t: any) => {
                if (t.status === 'paid') {
                    summary.totalSales += t.total || 0

                    const code = t.payment_methods?.code || t.payment_method

                    if (code === 'cash') summary.cashSales += t.total || 0
                    else if (code === 'card' || code === 'card_manual') summary.cardSales += t.total || 0
                    else if (code === 'transfer') summary.transferSales += t.total || 0
                    else if (code === 'stripe_checkout' || code === 'stripe') summary.onlineSales += t.total || 0
                    else summary.otherSales += t.total || 0

                } else if (t.status === 'cancelled') {
                    summary.cancelledCount++
                }
            })

            return { success: true, summary }

        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    return {
        currentSession,
        loading,
        paymentMethods,
        fetchCurrentSession,
        openSession,
        closeSession,
        fetchPaymentMethods,
        getSessionSummary
    }
}