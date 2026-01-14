import { useTransactions } from './useTransactions'
import { useCashRegister } from './useCashRegister'

export const useDashboard = () => {
    const { getTodayTransactions, getTransactions } = useTransactions()
    const { currentSession, fetchCurrentSession } = useCashRegister()

    const loading = ref(false)
    const todaySales = ref(0)
    const todayTransactionsCount = ref(0)
    const pendingTransactionsCount = ref(0)
    const recentTransactions = ref<any[]>([])

    const calculateMetrics = async () => {
        loading.value = true
        try {
            const { success: todaySuccess, data: todayData } = await getTodayTransactions()
            if (todaySuccess && todayData) {
                todaySales.value = todayData
                    .filter(t => t.status === 'paid')
                    .reduce((sum, t) => sum + (t.total || 0), 0)

                todayTransactionsCount.value = todayData.length
            }

            const { success: pendingSuccess, data: pendingData } = await getTransactions({ status: 'pending' })
            if (pendingSuccess && pendingData) {
                pendingTransactionsCount.value = pendingData.length
            }

            const { success: recentSuccess, data: recentData } = await getTransactions()
            if (recentSuccess && recentData) {
                recentTransactions.value = recentData.slice(0, 5)
            }

            if (!currentSession.value) {
                await fetchCurrentSession()
            }

        } catch (e) {

        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        todaySales,
        todayTransactionsCount,
        pendingTransactionsCount,
        recentTransactions,
        cashInRegister: computed(() => currentSession.value?.opening_cash || 0),
        refreshDashboard: calculateMetrics
    }
}
