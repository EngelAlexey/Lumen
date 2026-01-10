<script setup lang="ts">
import type { Transaction } from '~/types/database.types'

const { getTodayTransactions, getTransactions, loading } = useTransactions()
const toast = useToast()

const transactions = ref<Transaction[]>([])
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Pagado', value: 'paid' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' }
]

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'primary' | 'secondary' | 'neutral'> = {
  pending: 'warning',
  delivered: 'info',
  paid: 'success',
  cancelled: 'error'
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
  paid: 'Pagado',
  cancelled: 'Cancelado'
}

const columns = [
  { accessorKey: 'transaction_number', header: 'Folio' },
  { accessorKey: 'created_at', header: 'Hora' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'payment_methods', header: 'Método' },
  { id: 'actions', header: '' }
]

// Today's summary
const summary = computed(() => {
  const paid = transactions.value.filter(t => t.status === 'paid')
  return {
    count: paid.length,
    total: paid.reduce((sum, t) => sum + (t.total || 0), 0),
    cancelled: transactions.value.filter(t => t.status === 'cancelled').length
  }
})

async function loadTransactions() {
  const filters = statusFilter.value ? { status: statusFilter.value } : undefined
  const { success, data } = await getTransactions(filters)
  if (success) {
    transactions.value = data as any[]
  }
}

watch(statusFilter, () => loadTransactions())

onMounted(() => loadTransactions())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-primary-500" />
          Historial de Ventas
        </h1>
        <p class="text-sm text-gray-500">Transacciones del día</p>
      </div>
      <div class="flex gap-2">
        <UButton color="primary" icon="i-heroicons-plus" to="/transactions/new">
          Nueva Venta
        </UButton>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 uppercase tracking-wider">Ventas Hoy</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ summary.count }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 uppercase tracking-wider">Total Vendido</p>
          <p class="text-3xl font-bold text-green-600">₡{{ summary.total.toLocaleString() }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 uppercase tracking-wider">Canceladas</p>
          <p class="text-3xl font-bold" :class="summary.cancelled > 0 ? 'text-red-500' : 'text-gray-400'">
            {{ summary.cancelled }}
          </p>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <USelectMenu
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        placeholder="Filtrar por estado"
        class="w-48"
      />
    </div>

    <!-- Table -->
    <UCard>
      <UTable :columns="columns" :data="transactions" :loading="loading">
        <template #transaction_number-cell="{ row }">
          <span class="font-mono font-medium text-primary-600">{{ row.original.transaction_number }}</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm">
            {{ new Date(row.original.created_at).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </template>

        <template #total-cell="{ row }">
          <span class="font-bold">₡{{ row.original.total?.toLocaleString() }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColors[row.original.status] || 'neutral'" variant="subtle">
            {{ statusLabels[row.original.status] || row.original.status }}
          </UBadge>
        </template>

        <template #payment_methods-cell="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ (row.original as any).payment_methods?.name || '-' }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UButton variant="ghost" color="neutral" icon="i-heroicons-eye" size="xs" />
        </template>

        <template #empty>
          <div class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay transacciones</p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>