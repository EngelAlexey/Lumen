<script setup lang="ts">
const { currentSession, fetchCurrentSession, openSession, closeSession, loading, getSessionSummary } = useCashRegister()
const toast = useToast()

// Modal states
const showOpenModal = ref(false)
const showCloseModal = ref(false)
const processing = ref(false)

// Form states
const openingAmount = ref(0)
const closingAmount = ref(0)
const closingNotes = ref('')

// Session summary (for close modal)
const sessionSummary = ref<any>(null)

onMounted(() => {
  fetchCurrentSession()
})

// When opening close modal, fetch summary
watch(showCloseModal, async (isOpen) => {
  if (isOpen && currentSession.value?.id) {
    const { success, summary } = await getSessionSummary(currentSession.value.id)
    if (success) {
      sessionSummary.value = summary
    }
  }
})

async function handleOpenSession() {
  processing.value = true
  const { success, error } = await openSession(openingAmount.value)
  processing.value = false

  if (success) {
    showOpenModal.value = false
    openingAmount.value = 0
    toast.add({ title: 'Caja Aperturada', description: 'Puedes comenzar a vender', color: 'success' })
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}

async function handleCloseSession() {
  processing.value = true
  const { success, error, summary } = await closeSession(closingAmount.value, closingNotes.value)
  processing.value = false

  if (success) {
    showCloseModal.value = false
    closingAmount.value = 0
    closingNotes.value = ''
    sessionSummary.value = null

    const diff = summary?.difference || 0
    const diffText = diff === 0 ? 'Sin diferencia' : diff > 0 ? `Sobrante: ₡${diff}` : `Faltante: ₡${Math.abs(diff)}`

    toast.add({
      title: 'Caja Cerrada',
      description: `Turno finalizado. ${diffText}`,
      color: diff === 0 ? 'success' : 'warning'
    })
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-primary-500" />
        Control de Caja
      </h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- Closed State -->
    <UCard v-else-if="!currentSession" class="text-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 text-gray-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">La caja está cerrada</h3>
          <p class="text-gray-500">Debes abrir caja para comenzar a realizar ventas.</p>
        </div>
        <UButton size="lg" color="primary" icon="i-heroicons-key" @click="showOpenModal = true">
          Abrir Caja
        </UButton>
      </div>
    </UCard>

    <!-- Open State -->
    <div v-else class="grid gap-6">
      <UCard class="border-l-4 border-l-green-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">Estado Actual</p>
            <h3 class="text-2xl font-bold text-green-600 flex items-center gap-2 mt-1">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              Abierta
            </h3>
            <p class="text-sm text-gray-400 mt-2">
              Iniciada: {{ new Date(currentSession.opened_at).toLocaleString() }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 font-medium">Monto Inicial</p>
            <p class="text-2xl font-mono font-bold">₡{{ (currentSession.opening_cash || 0).toLocaleString() }}</p>
          </div>
        </div>
      </UCard>

      <div class="flex gap-4">
        <UButton
          block
          size="xl"
          color="error"
          variant="soft"
          icon="i-heroicons-lock-closed"
          @click="showCloseModal = true"
        >
          Cerrar Caja (Corte Z)
        </UButton>
        <UButton
          block
          size="xl"
          color="primary"
          icon="i-heroicons-shopping-cart"
          to="/transactions/new"
        >
          Ir a Ventas
        </UButton>
      </div>
    </div>

    <!-- Open Modal -->
    <UModal v-model:open="showOpenModal" title="Apertura de Caja">
      <template #body>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500">Ingresa el monto de efectivo inicial en la caja.</p>
          <UInput
            v-model.number="openingAmount"
            type="number"
            size="xl"
            autofocus
            placeholder="0.00"
          >
            <template #leading><span class="text-gray-500">₡</span></template>
          </UInput>
          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="showOpenModal = false">Cancelar</UButton>
            <UButton :loading="processing" @click="handleOpenSession">Abrir Turno</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Close Modal -->
    <UModal v-model:open="showCloseModal" title="Cierre de Caja">
      <template #body>
        <div class="p-6 space-y-4">
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="subtle"
            title="Acción Irreversible"
            description="Al cerrar caja se generará el reporte final del turno."
          />

          <!-- Session Summary -->
          <div v-if="sessionSummary" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <h4 class="font-semibold text-sm uppercase tracking-wider text-gray-500">Resumen del Turno</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <span class="text-gray-500">Ventas Totales:</span>
              <span class="font-bold text-right">₡{{ sessionSummary.totalSales?.toLocaleString() }}</span>
              <span class="text-gray-500">Efectivo:</span>
              <span class="text-right">₡{{ sessionSummary.cashSales?.toLocaleString() }}</span>
              <span class="text-gray-500">Tarjeta:</span>
              <span class="text-right">₡{{ sessionSummary.cardSales?.toLocaleString() }}</span>
              <span class="text-gray-500">Transferencia:</span>
              <span class="text-right">₡{{ sessionSummary.transferSales?.toLocaleString() }}</span>
            </div>
          </div>

          <UFormField label="Efectivo Final (Conteo)" name="closingAmount">
            <UInput
              v-model.number="closingAmount"
              type="number"
              size="xl"
            >
              <template #leading><span class="text-gray-500">₡</span></template>
            </UInput>
          </UFormField>

          <UFormField label="Notas / Observaciones" name="notes">
            <UTextarea v-model="closingNotes" placeholder="Diferencias, novedades..." />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="showCloseModal = false">Cancelar</UButton>
            <UButton color="error" :loading="processing" @click="handleCloseSession">Confirmar Cierre</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>