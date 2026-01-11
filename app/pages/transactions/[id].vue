<script setup lang="ts">
import type { Database } from '~/types/database.types'

const route = useRoute()
const transactionId = route.params.id as string
const isSuccess = route.query.payment === 'success'
const client = useSupabaseClient<Database>()

const { data: transaction, error, refresh } = await useAsyncData(`transaction-${transactionId}`, async () => {
  const { data, error } = await client
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal
      ),
      customers (
        full_name,
        email
      )
    `)
    .eq('id', transactionId)
    .single()
  
  if (error) throw error
  return data as any // Force any to avoid 'never' inference on complex joins
})

// Auto-verify payment if returning from Stripe
const verifying = ref(false)
if (isSuccess && transaction.value?.status !== 'paid') {
    onMounted(async () => {
        verifying.value = true
        try {
             await $fetch('/api/stripe/verify-payment', {
                method: 'POST',
                body: { transactionId }
            })
            // Refresh transaction data to show 'paid' status
            await refresh()
            toast.add({ title: 'Pago Verificado', description: 'La transacción se ha actualizado correctamente.' })
        } catch (err) {
            console.error('Verification failed', err)
            toast.add({ title: 'Error', description: 'No se pudo verificar el pago automáticamente.', color: 'error' })
        } finally {
            verifying.value = false
        }
    })
}

// Ensure toast is available
const toast = useToast()

const statusLabel = computed(() => {
    switch(transaction.value?.status) {
        case 'paid': return 'Pagado'
        case 'pending': return 'Pendiente'
        case 'cancelled': return 'Cancelado'
        default: return transaction.value?.status
    }
})

const statusColor = computed(() => {
    switch(transaction.value?.status) {
        case 'paid': return 'success'
        case 'pending': return 'warning'
        case 'cancelled': return 'error'
        default: return 'neutral'
    }
})

</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div v-if="isSuccess" class="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
      <h2 class="text-2xl font-bold text-green-700 mb-2">¡Pago Exitoso!</h2>
      <p class="text-green-600">La transacción ha sido procesada correctamente.</p>
    </div>

    <UCard v-if="transaction">
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold">Detalle de Transacción</h1>
          <UBadge :color="statusColor" size="lg">{{ statusLabel }}</UBadge>
        </div>
        <div class="text-sm text-gray-500 mt-1">
          Folio: {{ transaction.transaction_number }}
        </div>
      </template>

      <div class="space-y-6">
        <!-- Customer Info -->
        <div v-if="transaction.customers">
          <h3 class="font-semibold mb-2">Cliente</h3>
          <p>{{ transaction.customers.full_name }}</p>
          <p class="text-sm text-gray-500">{{ transaction.customers.email }}</p>
        </div>

        <!-- Items -->
        <div>
          <h3 class="font-semibold mb-3">Productos</h3>
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th class="px-4 py-2">Producto</th>
                  <th class="px-4 py-2 text-center">Cant.</th>
                  <th class="px-4 py-2 text-right">Precio</th>
                  <th class="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in transaction.transaction_items" :key="item.id">
                  <td class="px-4 py-2">
                    <NuxtLink :to="`/products?edit=${item.product_id}`" class="text-primary-600 hover:underline">
                        {{ item.product_name }}
                    </NuxtLink>
                  </td>
                  <td class="px-4 py-2 text-center">{{ item.quantity }}</td>
                  <td class="px-4 py-2 text-right">₡{{ item.unit_price }}</td>
                  <td class="px-4 py-2 text-right">₡{{ item.subtotal }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totals -->
        <div class="flex justify-end border-t pt-4">
            <div class="text-right">
                <div class="text-2xl font-bold text-primary">
                    Total: ₡{{ transaction.total }}
                </div>
            </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
            <UButton to="/transactions" variant="ghost" icon="i-heroicons-arrow-left">
                Ver todas las transacciones
            </UButton>
            <UButton to="/transactions/new" color="primary" icon="i-heroicons-plus">
                Nueva Venta
            </UButton>
        </div>
      </template>
    </UCard>

    <div v-else-if="error" class="text-center text-red-500 py-8">
        No se pudo cargar la transacción.
    </div>
    <div v-else class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
  </div>
</template>
