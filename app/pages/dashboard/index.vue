<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card fade-in">
        <div class="stat-icon success"><BanknotesIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">{{ $t('dashboard.stats.sales_today') }}</p>
          <h3 class="stat-value">₡{{ formatNumber(todaySales) }}</h3>
          <p class="stat-change positive">{{ $t('dashboard.stats.vs_yesterday', { value: '+12%' }) }}</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.1s">
        <div class="stat-icon primary"><ChartBarSquareIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">{{ $t('dashboard.stats.transactions') }}</p>
          <h3 class="stat-value">{{ todayTransactionsCount }}</h3>
          <p class="stat-change positive">{{ $t('dashboard.stats.vs_yesterday', { value: '+5' }) }}</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.2s">
        <div class="stat-icon warning"><ClockIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">{{ $t('dashboard.stats.pending') }}</p>
          <h3 class="stat-value">{{ pendingTransactionsCount }}</h3>
          <p class="stat-change neutral">{{ $t('dashboard.stats.delivered_count', { count: 3 }) }}</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.3s">
        <div class="stat-icon info"><CreditCardIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">{{ $t('dashboard.stats.cash_in_register') }}</p>
          <h3 class="stat-value">₡{{ formatNumber(cashInRegister) }}</h3>
          <p class="stat-change neutral">{{ $t('dashboard.stats.since_opening') }}</p>
        </div>
      </div>
    </div>
    
    <div class="content-grid">
      <div class="card recent-transactions">
        <h3 class="card-title">{{ $t('dashboard.sections.recent_transactions') }}</h3>
        <div v-if="recentTransactions.length === 0" class="empty-state">
          <p>{{ $t('dashboard.empty.no_transactions') }}</p>
          <button class="btn btn-primary" @click="$router.push('/transactions')">{{ $t('dashboard.empty.create_first') }}</button>
        </div>
        <div v-else class="transactions-list">
          <div v-for="txn in recentTransactions" :key="txn.id" class="transaction-row">
            <div class="txn-status">
              <span :class="['badge', `badge-${getStatusBadge(txn.status)}`]">{{ getStatusLabel(txn.status) }}</span>
            </div>
            <div class="txn-info">
              <p class="txn-number">{{ txn.transaction_number }}</p>
              <p class="txn-customer">{{ txn.customer_name || $t('dashboard.transactions.general_customer') }}</p>
            </div>
            <div class="txn-amount">
              <p class="amount">₡{{ formatNumber(txn.total) }}</p>
              <p class="payment-method">{{ txn.payment_methods?.name || txn.payment_method }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card quick-actions">
        <h3 class="card-title">{{ $t('dashboard.sections.quick_actions') }}</h3>
        <div class="actions-grid">
          <button class="action-btn" @click="newTransaction">
            <PlusCircleIcon class="action-icon" /><span class="action-label">{{ $t('dashboard.actions.new_sale') }}</span>
          </button>
          <button class="action-btn" @click="openCashRegister">
            <LockOpenIcon class="action-icon" /><span class="action-label">{{ $t('dashboard.actions.open_register') }}</span>
          </button>
          <button class="action-btn" @click="viewReports">
            <ChartBarSquareIcon class="action-icon" /><span class="action-label">{{ $t('dashboard.actions.view_reports') }}</span>
          </button>
          <button class="action-btn" @click="manageProdcuts">
            <CubeIcon class="action-icon" /><span class="action-label">{{ $t('dashboard.actions.products') }}</span>
          </button>
        </div>
      </div>
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
const { ensureBusinessExists } = useAuth()

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
const getStatusBadge = (status) => ({ 'paid': 'success', 'delivered': 'warning', 'pending': 'primary', 'cancelled': 'error' }[status] || 'primary')
const getStatusLabel = (status) => t(`dashboard.transactions.status.${status}`) || status

const newTransaction = () => router.push('/transactions/new')
const openCashRegister = () => router.push('/cash-register')
const viewReports = () => router.push('/reports')
const manageProdcuts = () => router.push('/products')

onMounted(async () => {
    await ensureBusinessExists()
    await refreshDashboard()
})
</script>

<style scoped>
@import url('@/assets/css/dashboard.css');
</style>