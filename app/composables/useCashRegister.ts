import type { Database } from '~/types/database.types'

export const useCashRegister = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()

    // Estado reactivo de la sesión actual
    const currentSession = ref<any>(null)
    const loading = ref(false)

    // Obtener la sesión activa (si existe)
    const fetchCurrentSession = async () => {
        if (!user.value?.id) return

        loading.value = true
        try {
            // Buscamos una sesión con status = 'open' del usuario actual
            // Nota: Podríamos filtrar por business_id también si queremos caja compartida
            const { data, error } = await supabase
                .from('cash_sessions')
                .select('*')
                .eq('user_id', user.value.id)
                .eq('status', 'open')
                .maybeSingle()

            if (error) throw error
            currentSession.value = data
        } catch (error) {
            console.error('Error fetching cash session:', error)
        } finally {
            loading.value = false
        }
    }

    // Abrir Caja
    const openSession = async (amount: number) => {
        if (!user.value?.id) return { success: false, error: 'No autenticado' }

        try {
            // Obtener business_id
            const { data: userData } = await supabase.from('users').select('business_id').eq('id', user.value.id).single()
            if (!userData?.business_id) return { success: false, error: 'Sin negocio asignado' }

            const { data, error } = await supabase
                .from('cash_sessions')
                .insert({
                    business_id: userData.business_id,
                    user_id: user.value.id,
                    start_amount: amount,
                    status: 'open',
                    opened_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            currentSession.value = data
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    // Cerrar Caja
    const closeSession = async (endAmount: number, notes?: string) => {
        if (!currentSession.value?.id) return { success: false, error: 'No hay sesión activa' }

        try {
            const { error } = await supabase
                .from('cash_sessions')
                .update({
                    end_amount: endAmount,
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    notes: notes
                })
                .eq('id', currentSession.value.id)

            if (error) throw error

            currentSession.value = null // Limpiar estado
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    return {
        currentSession,
        loading,
        fetchCurrentSession,
        openSession,
        closeSession
    }
}