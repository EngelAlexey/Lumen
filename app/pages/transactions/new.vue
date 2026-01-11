<script setup lang="ts">
import type { Product } from '~/types/database.types'

// Composables
const { currentSession, fetchCurrentSession, loading: sessionLoading, fetchPaymentMethods, paymentMethods } = useCashRegister()
const { getProducts } = useProducts()
const { createTransaction, loading: transactionLoading } = useTransactions()
const { labels, features, loadBusinessType } = useBusinessConfig()
const cart = useCart()
const toast = useToast()
const router = useRouter()

// State
const products = ref<Product[]>([])
const productsLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedPaymentMethod = ref<string | null>(null)
const paymentReference = ref('')
const customerName = ref('')
const tableNumber = ref('')
const notes = ref('')

// Modals
const showPaymentModal = ref(false)
const showSuccessModal = ref(false)
const lastTransactionNumber = ref('')

// Computed: Filtered products
const filteredProducts = computed(() => {
  let result = products.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.barcode?.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  return result
})

// Computed: Categories from products
const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(Boolean))
  return Array.from(cats) as string[]
})

// Computed: Selected payment method requires reference
const requiresReference = computed(() => {
  const method = paymentMethods.value.find(m => m.id === selectedPaymentMethod.value)
  return method?.requires_reference || false
})

// ===== LIFECYCLE =====

onMounted(async () => {
  // Load session first
  await fetchCurrentSession()

  // If no open session, redirect to cash register
  if (!currentSession.value) {
    toast.add({
      title: 'Caja Cerrada',
      description: 'Debes abrir caja antes de realizar ventas',
      color: 'warning'
    })
    router.push('/cash-register')
    return
  }

  // Load products and payment methods
  await Promise.all([
    loadProducts(),
    fetchPaymentMethods()
  ])

  // Pre-select cash as default
  const cashMethod = paymentMethods.value.find(m => m.code === 'cash')
  if (cashMethod) selectedPaymentMethod.value = cashMethod.id

  // Handle Query Params (Table / Order)
  const route = useRoute()
  if (route.query.table) {
    tableNumber.value = route.query.table as string
  }

  if (route.query.orderId) {
    await loadExistingOrder(route.query.orderId as string)
  }
})

async function loadExistingOrder(orderId: string) {
  // We need to implement a way to fetch a single transaction
  // For now, we can reuse getTransactions with filter (not ideal but works if ID is unique)
  // Actually, let's use supabase direct for now or add getTransactionById to composable later
  // Let's iterate on useTransactions later. For now, simulate or fetch match.
  // Wait, I can't easily fetch single transaction details with items without a helper.
  // I will assume getTransactions returns items? The current implementation of getTransactions
  // does select *, transaction_items(...) ? Let's check useTransactions. 
  // If not, I'll need to update useTransactions.
  // Let's assume for this step I will implement minimal loading logic here.
  
  const client = useSupabaseClient()
  const { data, error } = await client
    .from('transactions')
    .select('*, transaction_items(*, product:products(*))')
    .eq('id', orderId)
    .single()

  if (data) {
     const order = data as any
     tableNumber.value = order.table_number || ''
     customerName.value = order.customer_name || ''
     notes.value = order.notes || ''
     
     // Hydrate Cart
     cart.clearCart()
     if (order.transaction_items) {
        order.transaction_items.forEach((item: any) => {
           if (item.product) {
              cart.addItem(item.product, item.quantity)
           }
        })
     }
     
     toast.add({ title: 'Orden Cargada', description: `Mesa ${order.table_number}`, color: 'info' })
  }
}

async function loadProducts() {
  productsLoading.value = true
  const { success, data } = await getProducts()
  if (success && data) {
    products.value = data
  }
  productsLoading.value = false
}

// ===== ACTIONS =====

function handleProductClick(product: Product) {
  // Check stock for non-service products
  if (!product.is_service && (product.stock_quantity || 0) <= 0) {
    toast.add({
      title: 'Sin Stock',
      description: `${product.name} no tiene inventario disponible`,
      color: 'warning'
    })
    return
  }

  const result = cart.addItem(product)
  if (!result.success) {
    toast.add({ title: 'Stock Insuficiente', description: result.error, color: 'warning' })
  }
}

function openPaymentModal() {
  if (cart.isEmpty) {
    toast.add({ title: 'Carrito Vacío', description: 'Agrega productos antes de cobrar', color: 'warning' })
    return
  }
  showPaymentModal.value = true
}

async function processPayment() {
  if (!selectedPaymentMethod.value) {
    toast.add({ title: 'Error', description: 'Selecciona un método de pago', color: 'error' })
    return
  }

  if (requiresReference.value && !paymentReference.value.trim()) {
    toast.add({ title: 'Error', description: 'Ingresa la referencia del pago', color: 'error' })
    return
  }

  if (!currentSession.value?.id) {
    toast.add({ title: 'Error', description: 'No hay sesión de caja activa', color: 'error' })
    return
  }

  const result = await createTransaction({
    cashSessionId: currentSession.value.id,
    paymentMethodId: selectedPaymentMethod.value,
    items: cart.items,
    customerName: customerName.value || undefined,
    tableNumber: tableNumber.value || undefined,
    notes: notes.value || undefined,
    paymentReference: paymentReference.value || undefined,
    status: 'paid'
  })

  if (result.success) {
    lastTransactionNumber.value = result.transactionNumber || ''
    showPaymentModal.value = false
    showSuccessModal.value = true

    // Reset form
    cart.clearCart()
    customerName.value = ''
    tableNumber.value = ''
    notes.value = ''
    paymentReference.value = ''
    
    // Reload products to update stock
    await loadProducts()
  } else {
    toast.add({ title: 'Error', description: result.error, color: 'error' })
  }
}

// Guardar como cuenta pendiente (para restaurantes)
async function savePendingOrder() {
  if (cart.isEmpty) {
    toast.add({ title: 'Carrito Vacío', description: 'Agrega productos antes de guardar', color: 'warning' })
    return
  }

  if (!currentSession.value?.id) {
    toast.add({ title: 'Error', description: 'No hay sesión de caja activa', color: 'error' })
    return
  }

  const result = await createTransaction({
    cashSessionId: currentSession.value.id,
    items: cart.items,
    customerName: customerName.value || undefined,
    tableNumber: tableNumber.value || undefined,
    notes: notes.value || undefined,
    status: 'pending' // Cuenta abierta
  })

  if (result.success) {
    toast.add({ 
      title: 'Cuenta Guardada', 
      description: `Folio: ${result.transactionNumber}. Podrás cobrar después.`, 
      color: 'success' 
    })

    // Reset form
    cart.clearCart()
    customerName.value = ''
    tableNumber.value = ''
    notes.value = ''
    
    // Reload products to update stock
    await loadProducts()
  } else {
    toast.add({ title: 'Error', description: result.error, color: 'error' })
  }
}

function updateItemQuantity(productId: string, quantity: number) {
  const result = cart.updateQuantity(productId, quantity)
  if (!result.success && result.error) {
    toast.add({ title: 'Stock Insuficiente', description: result.error, color: 'warning' })
  }
}

function continueSelling() {
  showSuccessModal.value = false
}

function goToHistory() {
  router.push('/transactions')
}
</script>

<template>
  <div class="h-[calc(100vh-120px)] flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-shopping-cart" class="w-6 h-6 text-primary-500" />
          {{ labels.newTransaction }}
        </h1>
        <p class="text-sm text-gray-500">
          Caja: <span class="font-medium text-green-600">Abierta</span>
          <span class="mx-2">•</span>
          Inicio: {{ currentSession?.opening_cash ? `₡${currentSession.opening_cash.toLocaleString()}` : '-' }}
          <span v-if="tableNumber" class="ml-4 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-bold">
            Mesa {{ tableNumber }}
          </span>
        </p>
      </div>
      <div class="flex gap-2">
        <UButton variant="soft" color="neutral" icon="i-heroicons-clock" to="/transactions">
          Historial
        </UButton>
        <UButton variant="soft" color="warning" icon="i-heroicons-banknotes" to="/cash-register">
          Ir a Caja
        </UButton>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex gap-4 flex-1 min-h-0">
      <!-- Left: Products Grid -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Search and Filters -->
        <div class="flex gap-3 mb-4">
          <UInput
            v-model="searchQuery"
            placeholder="Buscar producto o código..."
            icon="i-heroicons-magnifying-glass"
            class="flex-1"
            size="lg"
          />
          <USelectMenu
            v-model="selectedCategory"
            :items="[{ label: 'Todas', value: null }, ...categories.map(c => ({ label: c, value: c }))]"
            value-key="value"
            placeholder="Categoría"
            class="w-48"
          />
        </div>

        <!-- Products Grid -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="productsLoading" class="flex justify-center items-center h-40">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
          </div>

          <div v-else-if="filteredProducts.length === 0" class="text-center py-12 text-gray-500">
            <UIcon name="i-heroicons-cube" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron productos</p>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="product in filteredProducts"
              :key="product.id"
              class="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-left transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 hover:scale-[1.02] active:scale-[0.98]"
              :class="{
                'opacity-50 cursor-not-allowed': !product.is_service && (product.stock_quantity || 0) <= 0
              }"
              @click="handleProductClick(product)"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {{ product.category || 'General' }}
                </span>
                <span v-if="!product.is_service" class="text-xs font-mono" :class="(product.stock_quantity || 0) < 5 ? 'text-red-500' : 'text-gray-400'">
                  {{ product.stock_quantity || 0 }}
                </span>
                <UIcon v-else name="i-heroicons-wrench-screwdriver" class="w-4 h-4 text-blue-500" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600">
                {{ product.name }}
              </h3>
              <p class="text-lg font-bold text-primary-600 mt-1">
                ₡{{ product.price.toLocaleString() }}
              </p>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Cart Panel -->
      <div class="w-96 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <!-- Cart Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
              Carrito
            </h2>
            <UBadge v-if="cart.itemCount > 0" color="primary">{{ cart.itemCount }} items</UBadge>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="cart.isEmpty" class="text-center py-8 text-gray-400">
            <UIcon name="i-heroicons-shopping-cart" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Agrega productos</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in cart.items"
              :key="item.product.id"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 dark:text-white truncate">{{ item.product.name }}</h4>
                  <p class="text-sm text-gray-500">₡{{ item.product.price.toLocaleString() }} c/u</p>
                </div>
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  @click="cart.removeItem(item.product.id)"
                />
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-heroicons-minus"
                    size="xs"
                    @click="updateItemQuantity(item.product.id, item.quantity - 1)"
                  />
                  <span class="w-8 text-center font-mono font-bold">{{ item.quantity }}</span>
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-heroicons-plus"
                    size="xs"
                    @click="updateItemQuantity(item.product.id, item.quantity + 1)"
                  />
                </div>
                <span class="font-bold text-gray-900 dark:text-white">
                  ₡{{ item.subtotal.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>₡{{ cart.subtotal.toLocaleString() }}</span>
          </div>
          <div v-if="cart.totalDiscount > 0" class="flex justify-between text-sm text-green-600">
            <span>Descuentos</span>
            <span>-₡{{ cart.totalDiscount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
            <span>TOTAL</span>
            <span class="text-primary-600">₡{{ cart.total.toLocaleString() }}</span>
          </div>

          <UButton
            block
            size="xl"
            color="primary"
            icon="i-heroicons-banknotes"
            :disabled="cart.isEmpty"
            class="mt-4"
            @click="openPaymentModal"
          >
            Cobrar ₡{{ cart.total.toLocaleString() }}
          </UButton>
          
          <!-- Botón para guardar como cuenta pendiente (solo si feature pendingOrders está activo) -->
          <UButton
            v-if="features.pendingOrders"
            block
            size="lg"
            color="warning"
            variant="outline"
            icon="i-heroicons-clock"
            :disabled="cart.isEmpty"
            @click="savePendingOrder"
          >
            Guardar Cuenta (Cobrar Después)
          </UButton>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <UModal v-model:open="showPaymentModal" title="Procesar Pago">
      <template #body>
        <div class="p-6 space-y-6">
          <div class="text-center py-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
            <p class="text-sm text-gray-500 uppercase tracking-wider">Total a Cobrar</p>
            <p class="text-4xl font-bold text-primary-600">₡{{ cart.total.toLocaleString() }}</p>
          </div>

          <UFormField label="Método de Pago" name="paymentMethod" required>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.id"
                type="button"
                class="p-4 rounded-lg border-2 transition-all text-center"
                :class="selectedPaymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'"
                @click="selectedPaymentMethod = method.id"
              >
                <UIcon
                  :name="method.code === 'cash' ? 'i-heroicons-banknotes' : method.code === 'card' ? 'i-heroicons-credit-card' : 'i-heroicons-device-phone-mobile'"
                  class="w-6 h-6 mx-auto mb-1"
                  :class="selectedPaymentMethod === method.id ? 'text-primary-600' : 'text-gray-400'"
                />
                <span class="text-sm font-medium" :class="selectedPaymentMethod === method.id ? 'text-primary-600' : ''">
                  {{ method.name }}
                </span>
              </button>
            </div>
          </UFormField>

          <UFormField v-if="requiresReference" label="Referencia / Últimos 4 dígitos" name="reference">
            <UInput v-model="paymentReference" placeholder="Ej: 1234" size="lg" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Cliente (Opcional)" name="customer">
              <UInput v-model="customerName" placeholder="Nombre" icon="i-heroicons-user" />
            </UFormField>
            <UFormField label="Mesa / Orden" name="table">
              <UInput v-model="tableNumber" placeholder="Mesa 1" icon="i-heroicons-hashtag" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <UButton color="neutral" variant="ghost" @click="showPaymentModal = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="lg"
              icon="i-heroicons-check"
              :loading="transactionLoading"
              @click="processPayment"
            >
              Confirmar Pago
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Success Modal -->
    <UModal v-model:open="showSuccessModal" :dismissible="false">
      <template #body>
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Venta Exitosa!</h3>
          <p class="text-gray-500 mb-4">La transacción se ha procesado correctamente</p>

          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p class="text-sm text-gray-500">Número de Folio</p>
            <p class="text-2xl font-mono font-bold text-primary-600">{{ lastTransactionNumber }}</p>
          </div>

          <div class="flex gap-3 justify-center">
            <UButton color="neutral" variant="soft" icon="i-heroicons-document-text" @click="goToHistory">
              Ver Historial
            </UButton>
            <UButton color="primary" icon="i-heroicons-plus" @click="continueSelling">
              Nueva Venta
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>