<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Hola, {{ userName }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          {{ $t('dashboard.welcome_subtitle', 'Esto es lo que está pasando en tu negocio hoy.') }}
        </p>
      </div>
      <div class="flex gap-3">
        <UButton icon="i-heroicons-plus" color="primary" variant="solid" size="md" @click="newTransaction">
          {{ $t('dashboard.actions.new_sale') }}
        </UButton>
        <UButton 
            v-if="business?.slug" 
            icon="i-heroicons-building-storefront" 
            :to="`/store/${business.slug}`" 
            target="_blank"
            variant="soft" 
            color="gray"
            size="md"
        >
            Ver Tienda
        </UButton>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard 
        v-for="(stat, index) in [
          { label: $t('dashboard.stats.sales_today'), value: `₡${formatNumber(todaySales)}`, icon: BanknotesIcon, color: 'green', change: '+12%', changeLabel: 'vs ayer', delay: '0ms' },
          { label: $t('dashboard.stats.transactions'), value: todayTransactionsCount, icon: ChartBarSquareIcon, color: 'blue', change: '+5', changeLabel: 'vs ayer', delay: '100ms' },
          { label: $t('dashboard.stats.pending'), value: pendingTransactionsCount, icon: ClockIcon, color: 'orange', change: `3 ${$t('dashboard.stats.delivered_count', { count: 3 })}`, changeLabel: '', delay: '200ms' },
          { label: $t('dashboard.stats.cash_in_register'), value: `₡${formatNumber(cashInRegister)}`, icon: CreditCardIcon, color: 'purple', change: $t('dashboard.stats.since_opening'), changeLabel: '', delay: '300ms' }
        ]"
        :key="index"
        :ui="{ body: { padding: 'p-6' } }" 
        class="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-l-4"
        :class="`border-l-${stat.color}-500`"
        :style="{ animationDelay: stat.delay }"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{{ stat.label }}</p>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ stat.value }}</h3>
          </div>
          <div :class="`p-2 bg-${stat.color}-50 dark:bg-${stat.color}-900/30 rounded-lg transition-transform duration-300 group-hover:scale-110`">
            <component :is="stat.icon" :class="`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs font-medium">
          <span v-if="stat.changeLabel" :class="`text-${stat.color}-600 dark:text-${stat.color}-400 flex items-center gap-1`">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
            {{ stat.change }}
          </span>
          <span v-else class="text-gray-500 dark:text-gray-400">
            {{ stat.change }}
          </span>
          <span v-if="stat.changeLabel" class="text-gray-400 ml-2">{{ stat.changeLabel }}</span>
        </div>
      </UCard>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Recent Transactions -->
      <UCard class="lg:col-span-2 flex flex-col" :ui="{ body: { padding: 'p-0 sm:p-0' }, header: { padding: 'p-4 sm:p-6' } }">
        <template #header>
          <div class="flex items-center justify-between">
             <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-400" />
                {{ $t('dashboard.sections.recent_transactions') }}
             </h3>
             <UButton variant="ghost" color="gray" size="sm" to="/transactions" icon="i-heroicons-arrow-right">Ver todas</UButton>
          </div>
        </template>

        <div v-if="recentTransactions.length === 0" class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
             <UIcon name="i-heroicons-receipt-refund" class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ $t('dashboard.empty.no_transactions') }}</p>
          <UButton color="primary" @click="newTransaction">{{ $t('dashboard.empty.create_first') }}</UButton>
        </div>
        
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="txn in recentTransactions" :key="txn.id" class="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group cursor-pointer" @click="router.push(`/transactions/${txn.id}`)">
            <div class="flex items-center gap-4">
              <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-gray-700 transition-all">
                <UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{{ txn.transaction_number }}</p>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                        <UIcon name="i-heroicons-user" class="w-3 h-3" />
                         {{ txn.customer_name || $t('dashboard.transactions.general_customer') }}
                    </span>
                    <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{{ txn.payment_methods?.name || txn.payment_method }}</span>
                </div>
              </div>
            </div>
            
            <div class="text-right">
              <p class="font-bold text-gray-900 dark:text-white mb-1">₡{{ formatNumber(txn.total) }}</p>
              <UBadge :color="getStatusBadge(txn.status)" variant="subtle" size="xs">{{ getStatusLabel(txn.status) }}</UBadge>
            </div>
          </div>
        </div>
      </UCard>
      
      <!-- Quick Actions -->
      <UCard :ui="{ body: { padding: 'p-4 sm:p-6' } }">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('dashboard.sections.quick_actions') }}</h3>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <button class="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 rounded-xl transition-all duration-200 group text-center h-40" @click="newTransaction">
            <div class="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <PlusCircleIcon class="w-8 h-8 text-primary-500" />
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ $t('dashboard.actions.new_sale') }}</span>
          </button>

          <button class="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 rounded-xl transition-all duration-200 group text-center h-40" @click="openCashRegister">
            <div class="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <LockOpenIcon class="w-8 h-8 text-green-500" />
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400">{{ $t('dashboard.actions.open_register') }}</span>
          </button>

          <button class="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-all duration-200 group text-center h-40" @click="viewReports">
            <div class="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <ChartBarSquareIcon class="w-8 h-8 text-blue-500" />
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ $t('dashboard.actions.view_reports') }}</span>
          </button>

          <button class="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 rounded-xl transition-all duration-200 group text-center h-40" @click="manageProducts">
            <div class="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <CubeIcon class="w-8 h-8 text-purple-500" />
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">{{ $t('dashboard.actions.products') }}</span>
          </button>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import {
  BanknotesIcon, ChartBarSquareIcon, ClockIcon, CreditCardIcon,
  PlusCircleIcon, LockOpenIcon, CubeIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const { ensureBusinessExists, business } = useAuth()
const user = useSupabaseUser()

const userName = computed(() => {
    return user.value?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'
})

const { 
    loading, 
    todaySales, 
    todayTransactionsCount, 
    pendingTransactionsCount, 
    recentTransactions, 
    cashInRegister,
    refreshDashboard 
} = useDashboard()

const formatNumber = (num) => num.toLocaleString('es-CR')
const getStatusBadge = (status) => ({ 'paid': 'green', 'delivered': 'orange', 'pending': 'primary', 'cancelled': 'red' }[status] || 'gray')
const getStatusLabel = (status) => t(`dashboard.transactions.status.${status}`) || status

const newTransaction = () => router.push('/transactions/new')
const openCashRegister = () => router.push('/cash-register')
const viewReports = () => router.push('/reports')
const manageProducts = () => router.push('/products')

onMounted(async () => {
    await ensureBusinessExists()
    await refreshDashboard()
})
</script>