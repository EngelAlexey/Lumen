import { useTransactions } from './useTransactions'
import { useCashRegister } from './useCashRegister'

export const useDashboard = () => {
    const { getTodayTransactions, getTransactions } = useTransactions()
    const { currentSession, fetchCurrentSession } = useCashRegister()

    // State
    const loading = ref(false)
    const todaySales = ref(0)
    const todayTransactionsCount = ref(0)
    const pendingTransactionsCount = ref(0)
    const recentTransactions = ref<any[]>([])

    const calculateMetrics = async () => {
        loading.value = true
        try {
            // 1. Get Today's Stats
            const { success: todaySuccess, data: todayData } = await getTodayTransactions()
            if (todaySuccess && todayData) {
                todaySales.value = todayData
                    .filter(t => t.status === 'paid')
                    .reduce((sum, t) => sum + (t.total || 0), 0)

                todayTransactionsCount.value = todayData.length
            }

            // 2. Get Pending Count (Global, not just today usually, or maybe active orders)
            // For now let's query open/pending transactions recent likely
            const { success: pendingSuccess, data: pendingData } = await getTransactions({ status: 'pending' })
            if (pendingSuccess && pendingData) {
                pendingTransactionsCount.value = pendingData.length
            }

            // 3. Recent Transactions (Limit 5)
            const { success: recentSuccess, data: recentData } = await getTransactions()
            if (recentSuccess && recentData) {
                recentTransactions.value = recentData.slice(0, 5)
            }

            // 4. Ensure Cash Register is loaded
            if (!currentSession.value) {
                await fetchCurrentSession()
            }

        } catch (e) {
            console.error('Error calculating dashboard metrics:', e)
        } finally {
            loading.value = false
        }
    }

    // Helper for refLike generic if needed, or just use regular refs 
    // actually standard Typescript:

    return {
        loading,
        todaySales,
        todayTransactionsCount,
        pendingTransactionsCount,
        recentTransactions,
        cashInRegister: computed(() => currentSession.value?.opening_cash || 0), // Note: This might need to add accumulated cash sales if we want "Live Cash"
        refreshDashboard: calculateMetrics
    }
}
