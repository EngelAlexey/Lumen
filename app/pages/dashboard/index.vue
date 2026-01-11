<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card fade-in">
        <div class="stat-icon success"><BanknotesIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">Ventas Hoy</p>
          <h3 class="stat-value">₡{{ formatNumber(todaySales) }}</h3>
          <p class="stat-change positive">+12% vs ayer</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.1s">
        <div class="stat-icon primary"><ChartBarSquareIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">Transacciones</p>
          <h3 class="stat-value">{{ todayTransactionsCount }}</h3>
          <p class="stat-change positive">+5 vs ayer</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.2s">
        <div class="stat-icon warning"><ClockIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">Pendientes</p>
          <h3 class="stat-value">{{ pendingTransactionsCount }}</h3>
          <p class="stat-change neutral">3 entregados</p>
        </div>
      </div>
      
      <div class="stat-card fade-in" style="animation-delay: 0.3s">
        <div class="stat-icon info"><CreditCardIcon class="icon" /></div>
        <div class="stat-content">
          <p class="stat-label">Efectivo en Caja</p>
          <h3 class="stat-value">₡{{ formatNumber(cashInRegister) }}</h3>
          <p class="stat-change neutral">Desde apertura</p>
        </div>
      </div>
    </div>
    
    <div class="content-grid">
      <div class="card recent-transactions">
        <h3 class="card-title">Transacciones Recientes</h3>
        <div v-if="recentTransactions.length === 0" class="empty-state">
          <p>No hay transacciones aún</p>
          <button class="btn btn-primary" @click="$router.push('/transactions')">Crear Primera Transacción</button>
        </div>
        <div v-else class="transactions-list">
          <div v-for="txn in recentTransactions" :key="txn.id" class="transaction-row">
            <div class="txn-status">
              <span :class="['badge', `badge-${getStatusBadge(txn.status)}`]">{{ getStatusLabel(txn.status) }}</span>
            </div>
            <div class="txn-info">
              <p class="txn-number">{{ txn.transaction_number }}</p>
              <p class="txn-customer">{{ txn.customer_name || 'Cliente general' }}</p>
            </div>
            <div class="txn-amount">
              <p class="amount">₡{{ formatNumber(txn.total) }}</p>
              <p class="payment-method">{{ txn.payment_methods?.name || txn.payment_method }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card quick-actions">
        <h3 class="card-title">Acciones Rápidas</h3>
        <div class="actions-grid">
          <button class="action-btn" @click="newTransaction">
            <PlusCircleIcon class="action-icon" /><span class="action-label">Nueva Venta</span>
          </button>
          <button class="action-btn" @click="openCashRegister">
            <LockOpenIcon class="action-icon" /><span class="action-label">Abrir Caja</span>
          </button>
          <button class="action-btn" @click="viewReports">
            <ChartBarSquareIcon class="action-icon" /><span class="action-label">Ver Reportes</span>
          </button>
          <button class="action-btn" @click="manageProdcuts">
            <CubeIcon class="action-icon" /><span class="action-label">Productos</span>
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

const router = useRouter()
const { ensureBusinessExists } = useAuth()
// Usar el nuevo composable
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
const getStatusLabel = (status) => ({ 'paid': 'Pagado', 'delivered': 'Entregado', 'pending': 'Pendiente', 'cancelled': 'Cancelado' }[status] || status)

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
.dashboard { max-width: 1400px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8); }
.stat-card { display: flex; gap: var(--space-4); background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm); transition: all var(--transition-base); }
.stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.stat-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-lg); font-size: 1.75rem; flex-shrink: 0; }
.stat-icon .icon { width: 2rem; height: 2rem; }
.stat-icon.success { background: var(--color-success-50); } .stat-icon.success .icon { color: var(--color-success-700); }
.stat-icon.primary { background: var(--color-primary-50); } .stat-icon.primary .icon { color: var(--color-primary-700); }
.stat-icon.warning { background: var(--color-warning-50); } .stat-icon.warning .icon { color: var(--color-warning-700); }
.stat-icon.info { background: var(--color-gray-100); } .stat-icon.info .icon { color: var(--color-gray-700); }
.stat-content { flex: 1; }
.stat-label { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 var(--space-2); font-weight: 500; }
.stat-value { font-size: 1.75rem; font-weight: 700; margin: 0 0 var(--space-2); color: var(--text-primary); }
.stat-change { font-size: 0.813rem; margin: 0; font-weight: 600; }
.stat-change.positive { color: var(--color-success-700); }
.stat-change.neutral { color: var(--text-tertiary); }
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); }
.recent-transactions { min-height: 400px; }
.transactions-list { display: flex; flex-direction: column; gap: var(--space-3); }
.transaction-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-md); transition: background var(--transition-fast); }
.transaction-row:hover { background: var(--color-gray-100); }
.txn-info { flex: 1; }
.txn-number { font-size: 0.938rem; font-weight: 600; margin: 0 0 var(--space-1); color: var(--text-primary); }
.txn-customer { font-size: 0.813rem; color: var(--text-secondary); margin: 0; }
.txn-amount { text-align: right; }
.amount { font-size: 1rem; font-weight: 700; margin: 0 0 var(--space-1); color: var(--text-primary); }
.payment-method { font-size: 0.813rem; color: var(--text-tertiary); margin: 0; }
.empty-state { text-align: center; padding: var(--space-10) var(--space-6); }
.empty-state p { color: var(--text-secondary); margin-bottom: var(--space-4); }
.quick-actions { height: fit-content; }
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.action-btn { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-5); background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-base); }
.action-btn:hover { background: var(--color-primary-50); border-color: var(--color-primary-200); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.action-btn:hover .action-icon { color: var(--color-primary-700); }
.action-icon { width: 2.5rem; height: 2.5rem; color: var(--text-secondary); transition: color var(--transition-base); }
.action-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
@media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
</style>