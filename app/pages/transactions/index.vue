<script setup lang="ts">
import type { Transaction } from '~/types/database.types'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { transactionStatusOptions, transactionStatusColors, transactionStatusLabels } from '@/constants/statusOptions'
import { formatCurrency, formatDateTime, formatPaymentMethod } from '@/utils/formatters'

const { t } = useI18n()
const { getTodayTransactions, getTransactions, payTransaction, updateTransactionStatus, fetchPaymentMethods, loading, paymentMethods } = useTransactions()
const toast = useToast()

const transactions = ref<Transaction[]>([])
const statusFilter = ref<'pending' | 'paid' | 'delivered' | 'cancelled' | null>(null)
const expandedRow = ref<string | null>(null)

const showPayModal = ref(false) 
const selectedTransaction = ref<any>(null)
const selectedPaymentMethod = ref<string | null>(null)
const paymentReference = ref('')

const showStatusModal = ref(false)
const newStatus = ref<string | null>(null)

const statusOptions = computed(() => transactionStatusOptions.map(opt => ({
  label: opt.value === null ? t('transactions.status.all') : t(`transactions.status.${opt.value}`),
  value: opt.value
})))

const columns = computed(() => [
  { accessorKey: 'transaction_number', header: 'Folio' },
  { accessorKey: 'created_at', header: t('transactions.columns.date') },
  { accessorKey: 'quantity', header: 'Cant.' },
  { accessorKey: 'products', header: t('transactions.columns.items') },
  { accessorKey: 'total', header: t('transactions.columns.total') },
  { accessorKey: 'status', header: t('transactions.columns.status') },
  { accessorKey: 'payment_methods', header: t('transactions.columns.payment') },
  { id: 'actions', header: '' }
])

const summary = computed(() => {
  const paid = transactions.value.filter(t => t.status === 'paid')
  const pending = transactions.value.filter(t => t.status === 'pending')
  const delivered = transactions.value.filter(t => t.status === 'delivered')
  return {
    count: paid.length,
    total: paid.reduce((sum, t) => sum + (t.total || 0), 0),
    pending: pending.length,
    pendingTotal: pending.reduce((sum, t) => sum + (t.total || 0), 0),
    delivered: delivered.length,
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

function toggleRow(id: string) {
  expandedRow.value = expandedRow.value === id ? null : id
}

function openPayModal(transaction: any) {
  selectedTransaction.value = transaction
  selectedPaymentMethod.value = null
  paymentReference.value = ''
  showPayModal.value = true
}

function openStatusModal(transaction: any) {
  selectedTransaction.value = transaction
  newStatus.value = transaction.status
  showStatusModal.value = true
}

async function processPayment() {
  if (!selectedTransaction.value || !selectedPaymentMethod.value) {
    toast.add({ 
      title: t('transactions.messages.error'), 
      description: t('transactions.messages.payment_required'), 
      color: 'error' 
    })
    return
  }

  const result = await payTransaction(selectedTransaction.value.id, {
    paymentMethodId: selectedPaymentMethod.value,
    paymentReference: paymentReference.value || undefined
  })

  if (result.success) {
    toast.add({ 
      title: t('transactions.messages.paid'), 
      color: 'success' 
    })
    showPayModal.value = false
    loadTransactions()
  } else {
    toast.add({ 
      title: t('transactions.messages.error'), 
      description: result.error, 
      color: 'error' 
    })
  }
}

async function updateStatus() {
  if (!selectedTransaction.value || !newStatus.value) return

  const result = await updateTransactionStatus(selectedTransaction.value.id, newStatus.value as any)

  if (result.success) {
    toast.add({ 
      title: t('transactions.messages.status_changed'), 
      color: 'success' 
    })
    showStatusModal.value = false
    loadTransactions()
  } else {
    toast.add({ 
      title: t('transactions.messages.error'), 
      description: result.error, 
      color: 'error' 
    })
  }
}

// Helper: Get total quantity from items
function getTotalQuantity(items: any[]): number {
  if (!items?.length) return 0
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
}

// Helper: Get product names
function getProductNames(items: any[]): string {
  if (!items?.length) return '-'
  return items.map((i: any) => i.product_name).join(', ')
}

function formatPaymentEnum(method: string | null) {
    if (!method) return '-'
    const map: Record<string, string> = {
        'cash': 'Efectivo',
        'card_manual': 'Tarjeta',
        'stripe_checkout': 'Stripe (Online)',
        'transfer': 'Transferencia',
        'other': 'Otro'
    }
    return map[method] || method
}

function formatDeliveryStatus(status: string | null) {
    if (!status) return ''
    const map: Record<string, string> = {
        'pending': 'Pendiente',
        'preparing': 'Preparando',
        'ready': 'Listo',
        'in_route': 'En Ruta',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    }
    return map[status] || status
}

watch(statusFilter, () => loadTransactions())

const supabase = useSupabaseClient()
const { profile, fetchProfile } = useAuth()
const user = useSupabaseUser()
let realtimeChannel: any = null


const showLinkModal = ref(false)
const activeStripeLink = ref('')

function openStripeLinkModal(url: string) {
    activeStripeLink.value = url
    showLinkModal.value = true
}


const { copy } = useClipboard()

function copyActiveLink() {
    copy(activeStripeLink.value)
    toast.add({ title: 'Copiado', color: 'success' })
}

// async function generatePaymentLink(transaction: any) {
//     if (!transaction) return
//     
//     const result = await createStripePayment(transaction.id)
//     
//     if (result.success && result.url) {
//         toast.add({ title: 'Link Generado', description: 'El link de pago ha sido creado exitosamente.', color: 'success' })
//         loadTransactions()
//     } else {
//         toast.add({ title: 'Error', description: result.error || 'No se pudo generar el link', color: 'error' })
//     }
// }

const realtimeConnected = ref(false)

const setupRealtime = () => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeConnected.value = false
        realtimeChannel = null
    }
    
    realtimeChannel = supabase
        .channel('transactions-list-live')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'transactions'
            },
            (payload: any) => {
                if (payload.eventType === 'UPDATE' && payload.new.status === 'paid' && payload.old.status !== 'paid') {
                    toast.add({
                        title: '¡Pago Recibido!',
                        description: `La venta #${payload.new.transaction_number || payload.new.id.slice(0,8)} ha sido pagada exitosamente.`,
                        icon: 'i-heroicons-check-circle',
                        color: 'success'
                    })
                }

                loadTransactions()
            }
        )
        .subscribe((status: string) => {
            realtimeConnected.value = (status === 'SUBSCRIBED')
        })
}

onMounted(async () => {
  loadTransactions()
  fetchPaymentMethods()
  
  if (!profile.value) {
      await fetchProfile()
  }
  
  setupRealtime()
  
  watch(() => profile.value, (newVal, oldVal) => {
      if (newVal?.id !== oldVal?.id) {
          setupRealtime()
      }
  })
})

onUnmounted(() => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-primary-500" />
          Historial de Ventas
        </h1>
      </div>

      <div class="flex gap-2">
          <UButton 
              icon="i-heroicons-arrow-path" 
              variant="ghost" 
              color="neutral" 
              :loading="loading"
              @click="loadTransactions"
          />
          <UButton color="primary" icon="i-heroicons-plus" to="/transactions/new">
            Nueva Venta
          </UButton>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Ventas Hoy</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.count }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Total Vendido</p>
          <ClientOnly>
            <p class="text-2xl font-bold text-green-600">₡{{ summary.total.toLocaleString() }}</p>
          </ClientOnly>
        </div>
      </UCard>
      <UCard v-if="summary.pending > 0">
        <div class="text-center">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Pendientes</p>
          <p class="text-2xl font-bold text-yellow-500">{{ summary.pending }}</p>
          <ClientOnly>
             <p class="text-xs text-yellow-600">₡{{ summary.pendingTotal.toLocaleString() }}</p>
          </ClientOnly>
        </div>
      </UCard>
      <UCard v-if="summary.delivered > 0">
        <div class="text-center">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Entregados</p>
          <p class="text-2xl font-bold text-blue-500">{{ summary.delivered }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Canceladas</p>
          <p class="text-2xl font-bold" :class="summary.cancelled > 0 ? 'text-red-500' : 'text-gray-400'">
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
          <NuxtLink 
            :to="`/transactions/${row.original.id}`"
            class="font-mono font-medium text-primary-600 hover:underline cursor-pointer"
          >
            {{ row.original.transaction_number }}
          </NuxtLink>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm">
            <ClientOnly>
              {{ new Date(row.original.created_at).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) }}
            </ClientOnly>
          </span>
        </template>

        <template #quantity-cell="{ row }">
          <UBadge v-if="(row.original as any).transaction_items?.length" color="neutral" variant="subtle">
            {{ getTotalQuantity((row.original as any).transaction_items) }}
          </UBadge>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #products-cell="{ row }">
          <div v-if="(row.original as any).transaction_items?.length" class="max-w-xs flex flex-wrap gap-1">
            <template v-for="(item, index) in (row.original as any).transaction_items" :key="item.id">
                <span v-if="(index as number) > 0" class="text-gray-400">, </span>
                <NuxtLink 
                    :to="`/products?edit=${item.product_id}`"
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                    {{ item.product_name }}
                </NuxtLink>
            </template>
          </div>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #total-cell="{ row }">
          <ClientOnly>
            <span class="font-bold">₡{{ row.original.total?.toLocaleString() }}</span>
          </ClientOnly>
        </template>

        <template #status-cell="{ row }">
          <div class="flex flex-col gap-1 items-start">
              <button 
                :disabled="['paid', 'cancelled'].includes(row.original.status)"
                :class="['paid', 'cancelled'].includes(row.original.status) ? 'cursor-default' : 'cursor-pointer hover:opacity-80'"
                @click="!['paid', 'cancelled'].includes(row.original.status) && openStatusModal(row.original)"
              >
                <StatusBadge 
                  :status="row.original.status" 
                  type="transaction"
                />
              </button>

              <UBadge 
                v-if="row.original.delivery_status && 
                      row.original.delivery_status !== 'delivered' && 
                      row.original.delivery_status !== 'pending'"
                color="info" 
                variant="outline" 
                size="xs"
              >
                {{ formatDeliveryStatus(row.original.delivery_status) }}
              </UBadge>
          </div>
        </template>

        <template #payment_methods-cell="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ (row.original as any).payment_methods?.name || formatPaymentEnum((row.original as any).payment_method) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-1">
            <UButton 
              v-if="row.original.status === 'pending'" 
              variant="soft" 
              color="success" 
              icon="i-heroicons-banknotes" 
              size="xs"
              @click="openPayModal(row.original)"
            >
              Cobrar
            </UButton>
            
            <UTooltip text="Ver Recibo">
                <UButton 
                    :to="`/transactions/${row.original.id}`"
                    variant="ghost" 
                    color="neutral" 
                    icon="i-heroicons-document-text" 
                    size="xs" 
                />
            </UTooltip>
            
            <UTooltip v-if="row.original.stripe_payment_url && row.original.status === 'pending'" text="Ver Link de Pago">
                <UButton 
                    variant="ghost" 
                    color="primary" 
                    icon="i-heroicons-link" 
                    size="xs" 
                    @click="openStripeLinkModal(row.original.stripe_payment_url)"
                />
            </UTooltip>
            
            <!-- Commented out - generatePaymentLink function not available
            <UTooltip v-else-if="row.original.status === 'pending'" text="Generar Link de Pago">
                <UButton 
                    variant="ghost" 
                    color="primary" 
                    icon="i-heroicons-globe-alt" 
                    size="xs" 
                    @click="generatePaymentLink(row.original)"
                />
            </UTooltip>
            -->
            
            <!-- Hide edit status button if final state -->
            <UButton 
              v-if="!['paid', 'cancelled'].includes(row.original.status)"
              variant="ghost" 
              color="neutral" 
              icon="i-heroicons-pencil-square" 
              size="xs" 
              @click="openStatusModal(row.original)"
            />
          </div>
        </template>

        <!-- Expanded Row -->
        <template #expanded="{ row }">
          <div v-if="expandedRow === row.original.id" class="p-4 bg-gray-50 dark:bg-gray-800">
            <h4 class="font-semibold mb-2">Detalle de Productos</h4>
            <div class="grid gap-2">
              <div 
                v-for="item in (row.original as any).transaction_items" 
                :key="item.id"
                class="flex justify-between items-center text-sm"
              >
                <span class="flex-1">{{ item.product_name }}</span>
                <span class="w-20 text-center">
                    <ClientOnly>
                        {{ item.quantity }} x ₡{{ item.unit_price?.toLocaleString() }}
                    </ClientOnly>
                </span>
                <span class="w-24 text-right font-semibold">
                    <ClientOnly>
                        ₡{{ item.subtotal?.toLocaleString() }}
                    </ClientOnly>
                </span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold">
              <span>Total</span>
              <span>₡{{ row.original.total?.toLocaleString() }}</span>
            </div>
            <div v-if="row.original.table_number" class="mt-2 text-sm text-gray-500">
              Mesa: {{ row.original.table_number }}
            </div>
            <div v-if="row.original.customer_name" class="text-sm text-gray-500">
              Cliente: {{ row.original.customer_name }}
            </div>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay transacciones</p>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Pay Modal -->
    <UModal v-model:open="showPayModal">
      <template #body>
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4">Cobrar Cuenta</h3>
          
          <div v-if="selectedTransaction" class="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Folio:</span>
              <span class="font-mono font-bold">{{ selectedTransaction.transaction_number }}</span>
            </div>
            <div v-if="selectedTransaction.table_number" class="flex justify-between mb-2">
              <span class="text-gray-600">Mesa:</span>
              <span>{{ selectedTransaction.table_number }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span>Total a cobrar:</span>
              <span class="text-primary-600">₡{{ selectedTransaction.total?.toLocaleString() }}</span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Método de Pago</label>
              <div class="grid grid-cols-2 gap-2">
                <UButton
                  v-for="method in paymentMethods"
                  :key="method.id"
                  :color="selectedPaymentMethod === method.id ? 'primary' : 'neutral'"
                  :variant="selectedPaymentMethod === method.id ? 'solid' : 'outline'"
                  class="justify-center"
                  @click="selectedPaymentMethod = method.id"
                >
                  {{ method.name }}
                </UButton>
              </div>
            </div>

            <UFormField label="Referencia (opcional)">
              <UInput v-model="paymentReference" placeholder="Número de referencia" />
            </UFormField>
          </div>

          <div class="flex gap-3 mt-6">
            <UButton color="neutral" variant="outline" class="flex-1" @click="showPayModal = false">
              Cancelar
            </UButton>
            <UButton 
              color="primary" 
              class="flex-1" 
              :disabled="!selectedPaymentMethod"
              @click="processPayment"
            >
              Confirmar Cobro
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Change Status Modal -->
    <UModal v-model:open="showStatusModal">
      <template #body>
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4">Cambiar Estado</h3>
          
          <div v-if="selectedTransaction" class="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Folio:</span>
              <span class="font-mono font-bold">{{ selectedTransaction.transaction_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">{{ t('transactions.columns.status') }}:</span>
              <StatusBadge 
                :status="selectedTransaction.status" 
                type="transaction"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium mb-2">Nuevo Estado</label>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                :color="newStatus === 'pending' ? 'warning' : 'neutral'"
                :variant="newStatus === 'pending' ? 'solid' : 'outline'"
                class="justify-center"
                icon="i-heroicons-clock"
                @click="newStatus = 'pending'"
              >
                Pendiente
              </UButton>
              <UButton
                :color="newStatus === 'delivered' ? 'info' : 'neutral'"
                :variant="newStatus === 'delivered' ? 'solid' : 'outline'"
                class="justify-center"
                icon="i-heroicons-truck"
                @click="newStatus = 'delivered'"
              >
                Entregado
              </UButton>
              <UButton
                :color="newStatus === 'paid' ? 'success' : 'neutral'"
                :variant="newStatus === 'paid' ? 'solid' : 'outline'"
                class="justify-center"
                icon="i-heroicons-check-circle"
                @click="newStatus = 'paid'"
              >
                Pagado
              </UButton>
              <UButton
                :color="newStatus === 'cancelled' ? 'error' : 'neutral'"
                :variant="newStatus === 'cancelled' ? 'solid' : 'outline'"
                class="justify-center"
                icon="i-heroicons-x-circle"
                @click="newStatus = 'cancelled'"
              >
                Cancelado
              </UButton>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <UButton color="neutral" variant="outline" class="flex-1" @click="showStatusModal = false">
              Cancelar
            </UButton>
            <UButton 
              color="primary" 
              class="flex-1" 
              :disabled="!newStatus || newStatus === selectedTransaction?.status"
              @click="updateStatus"
            >
              Guardar Cambio
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
    <!-- Stripe Link Viewer Modal -->
    <UModal v-model:open="showLinkModal">
      <template #body>
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Link de Pago Activo</h3>
          
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 break-all text-sm font-mono text-gray-600 mb-4 select-all">
              {{ activeStripeLink }}
          </div>
          <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="ghost" @click="showLinkModal = false">Cerrar</UButton>
              <UButton color="neutral" icon="i-heroicons-clipboard" @click="copyActiveLink">Copiar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
  
  <div class="fixed bottom-4 right-4 z-50">
      <UBadge :color="realtimeConnected ? 'success' : 'neutral'" variant="soft" class="opacity-75 hover:opacity-100 transition">
          <UIcon name="i-heroicons-signal" class="w-4 h-4 mr-1" />
          {{ realtimeConnected ? 'En Vivo' : 'Conectando...' }}
      </UBadge>
  </div>
</template>