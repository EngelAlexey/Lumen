/**
 * Cash Register Composable
 * Manages cash session (opening/closing) operations
 */

import type { CashSession, PaymentMethod } from '~/types/database.types'

export const useCashRegister = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()

    // Reactive state
    const currentSession = ref<CashSession | null>(null)
    const loading = ref(false)
    const paymentMethods = ref<PaymentMethod[]>([])

    // Helper: Get authenticated user ID reliably
    const getAuthenticatedUserId = async (): Promise<string | null> => {
        // Try reactive ref first
        if (user.value?.id) return user.value.id

        // Fallback: Get session (doesn't make HTTP call, reads from storage)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.id) {
                return session.user.id
            }
            console.warn('No session found in getAuthenticatedUserId')
            return null
        } catch (error) {
            console.error('Error getting session:', error)
            return null
        }
    }

    // ===== FETCH CURRENT OPEN SESSION =====

    const fetchCurrentSession = async () => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return null

        loading.value = true
        try {
            // Get user's business_id first
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (userError || !userData?.business_id) {
                console.warn('User without business')
                return null
            }

            // Find open session for this business
            const { data, error } = await supabase
                .from('cash_sessions')
                .select('*')
                .eq('business_id', userData.business_id)
                .eq('status', 'open')
                .maybeSingle()

            if (error) throw error
            currentSession.value = data
            return data

        } catch (error) {
            console.error('Error fetching cash session:', error)
            return null
        } finally {
            loading.value = false
        }
    }

    // ===== OPEN CASH SESSION =====

    const openSession = async (openingCash: number) => {
        const userId = await getAuthenticatedUserId()
        if (!userId) return { success: false, error: 'No autenticado. Por favor recarga la página.' }

        try {
            // Get business_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('id', userId)
                .single()

            if (userError || !userData?.business_id) {
                return { success: false, error: 'Sin negocio asignado' }
            }

            // Check if there's already an open session
            const { data: existingSession } = await supabase
                .from('cash_sessions')
                .select('id')
                .eq('business_id', userData.business_id)
                .eq('status', 'open')
                .maybeSingle()

            if (existingSession) {
                return { success: false, error: 'Ya existe una caja abierta' }
            }

            // Create new session
            const { data, error } = await supabase
                .from('cash_sessions')
                .insert({
                    business_id: userData.business_id,
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
            console.error('Open session error:', error)
            return { success: false, error: error.message }
        }
    }

    // ===== CLOSE CASH SESSION =====

    const closeSession = async (closingCash: number, notes?: string) => {
        if (!currentSession.value?.id) {
            return { success: false, error: 'No hay sesión activa' }
        }
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            return { success: false, error: 'No autenticado. Por favor recarga la página.' }
        }

        try {
            // Calculate expected cash (opening + sales in this session)
            const { data: salesTotal } = await supabase
                .from('transactions')
                .select('total')
                .eq('cash_session_id', currentSession.value.id)
                .eq('status', 'paid')
                .not('payment_method_id', 'is', null)

            // Filter only cash payments for expected calculation
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
            console.error('Close session error:', error)
            return { success: false, error: error.message }
        }
    }

    // ===== FETCH PAYMENT METHODS =====

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

    // ===== SESSION SUMMARY (for reports) =====

    const getSessionSummary = async (sessionId: string) => {
        try {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    total,
                    status,
                    payment_methods (name, code)
                `)
                .eq('cash_session_id', sessionId)

            if (error) throw error

            const summary = {
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                transferSales: 0,
                cancelledCount: 0
            }

            transactions?.forEach((t: any) => {
                if (t.status === 'paid') {
                    summary.totalSales += t.total || 0
                    const code = t.payment_methods?.code
                    if (code === 'cash') summary.cashSales += t.total || 0
                    else if (code === 'card') summary.cardSales += t.total || 0
                    else if (code === 'transfer') summary.transferSales += t.total || 0
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