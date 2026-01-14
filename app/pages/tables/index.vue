<template>
  <div class="tables-page">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mesas</h1>
        <p class="text-gray-600 dark:text-gray-400">Gestión de mesas y cuentas abiertas</p>
      </div>
      <div class="flex gap-2">
        <UButton icon="i-heroicons-arrow-path" variant="soft" @click="loadTables" :loading="loading" />
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <UCard>
        <div class="text-center">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</span>
          <p class="text-xs text-gray-500 uppercase font-semibold mt-1">Total Mesas</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <span class="text-2xl font-bold text-green-600">{{ stats.free }}</span>
          <p class="text-xs text-gray-500 uppercase font-semibold mt-1">Libres</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <span class="text-2xl font-bold text-red-600">{{ stats.busy }}</span>
          <p class="text-xs text-gray-500 uppercase font-semibold mt-1">Ocupadas</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <span class="text-2xl font-bold text-indigo-600">{{ formatCurrency(stats.pendingAmount) }}</span>
          <p class="text-xs text-gray-500 uppercase font-semibold mt-1">Por Cobrar</p>
        </div>
      </UCard>
    </div>

    <!-- Tables Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div 
        v-for="table in tables" 
        :key="table.id"
        @click="handleTableClick(table)"
        class="relative aspect-square rounded-xl transition-all duration-200 cursor-pointer border-2 flex flex-col justify-center items-center p-4 hover:shadow-md"
        :class="getTableClasses(table)"
      >
        <!-- Table Number -->
        <span class="text-3xl font-bold mb-2">{{ table.number }}</span>
        
        <!-- Status Icon/Text -->
        <div v-if="table.status === 'free'" class="text-sm text-gray-500 font-medium flex items-center gap-1">
          <UIcon name="i-heroicons-check-circle" />
          Libre
        </div>
        
        <div v-else class="text-center">
          <span class="text-xs font-semibold px-2 py-1 rounded-full bg-white/50 mb-1 block">
             {{ formatCurrency(table.currentOrder?.total || 0) }}
          </span>
          <p class="text-[10px] opacity-75 truncate max-w-[100px]">
            {{ timeAgo(table.currentOrder?.created_at) }}
          </p>
        </div>

        <!-- Notification Badge if unpaid for long time (mock) -->
        <div v-if="table.status === 'busy' && isLongWait(table.currentOrder?.created_at)" class="absolute top-2 right-2">
           <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Types
type TableStatus = 'free' | 'busy'
interface Table {
  id: string
  number: string
  status: TableStatus
  currentOrder?: any
}

// Composables
const { getTransactions } = useTransactions()
const router = useRouter()

// State
const loading = ref(false)
const tables = ref<Table[]>([])

// Mock config for tables (could be in DB later)
const TOTAL_TABLES = 15

// Computed Stats
const stats = computed(() => {
  const busy = tables.value.filter(t => t.status === 'busy').length
  const pendingAmount = tables.value.reduce((sum, t) => sum + (t.currentOrder?.total || 0), 0)
  return {
    total: TOTAL_TABLES,
    free: TOTAL_TABLES - busy,
    busy,
    pendingAmount
  }
})

// Methods
const getTableClasses = (table: Table) => {
  if (table.status === 'free') {
    return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:border-primary-500 hover:text-primary-500'
  }
  return 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
}

const isLongWait = (dateStr?: string) => {
  if (!dateStr) return false
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff > 1000 * 60 * 60 // > 1 hour
}

const loadTables = async () => {
  loading.value = true
  try {
    // 1. Get all pending transactions (Open Tabs)
    const { success, data } = await getTransactions({ status: 'pending' })
    const pendingOrders = success && data ? data : []

    // 2. Build tables array
    const tempTables: Table[] = []
    
    for (let i = 1; i <= TOTAL_TABLES; i++) {
        const num = i.toString()
        // Find if this table has a pending order
        // Note: We assume table_number is stored in transactions
        const order = pendingOrders.find((t: any) => t.table_number === num)

        tempTables.push({
            id: `tab-${i}`,
            number: num,
            status: order ? 'busy' : 'free',
            currentOrder: order
        })
    }
    
    tables.value = tempTables
  } catch (e) {

  } finally {
    loading.value = false
  }
}

const handleTableClick = (table: Table) => {
  if (table.status === 'free') {
    // Open new order for this table
    router.push({ path: '/transactions/new', query: { table: table.number } })
  } else {
    // View/Edit existing order
    // Assuming we can edit by transaction ID or just view details
    // For now, let's go to POS with this transaction loaded (Edit Mode)
    // We haven't implemented "Edit Transaction" fully yet, so maybe we pass the ID
    // Or we could implement a quick view modal.
    // Let's assume we go to POS to "Add items" or "Pay"
    if (table.currentOrder?.id) {
       router.push({ path: '/transactions/new', query: { orderId: table.currentOrder.id } })
    }
  }
}

// Init
onMounted(() => {
  loadTables()
})
</script>
