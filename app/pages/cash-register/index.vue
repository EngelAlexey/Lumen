<script setup lang="ts">
const { currentSession, fetchCurrentSession, openSession, closeSession, loading, getSessionSummary } = useCashRegister()
const toast = useToast()
const { t } = useI18n()

const showOpenModal = ref(false)
const showCloseModal = ref(false)
const processing = ref(false)

const openingAmount = ref(0)
const closingAmount = ref(0)
const closingNotes = ref('')

const sessionSummary = ref<any>(null)

const expectedCash = computed(() => {
  if (!currentSession.value || !sessionSummary.value) return 0
  return (currentSession.value.opening_cash || 0) + (sessionSummary.value.cashSales || 0)
})

const cashDifference = computed(() => {
  return closingAmount.value - expectedCash.value
})

onMounted(() => {
  fetchCurrentSession()
})

watch(showCloseModal, async (isOpen) => {
  if (isOpen && currentSession.value?.id) {
    const { success, summary } = await getSessionSummary(currentSession.value.id)
    if (success) {
      sessionSummary.value = summary
      closingAmount.value = (currentSession.value.opening_cash || 0) + (summary?.cashSales || 0)
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
    toast.add({ title: t('cash_register.toasts.opened_title'), description: t('cash_register.toasts.opened_desc'), color: 'success' })
  } else {
    toast.add({ title: t('cash_register.toasts.error_title'), description: error, color: 'error' })
  }
}

async function handleCloseSession() {
  processing.value = true
  const finalAmount = expectedCash.value
  const { success, error, summary } = await closeSession(finalAmount, closingNotes.value)
  processing.value = false

  if (success) {
    showCloseModal.value = false
    closingAmount.value = 0
    closingNotes.value = ''
    sessionSummary.value = null

    const diff = summary?.difference || 0
    const diffText = diff === 0 ? t('cash_register.diff.none') : diff > 0 ? t('cash_register.diff.surplus', { amount: diff }) : t('cash_register.diff.shortage', { amount: Math.abs(diff) })

    toast.add({
      title: t('cash_register.toasts.closed_title'),
      description: t('cash_register.toasts.closed_desc', { diffText }),
      color: diff === 0 ? 'success' : 'warning'
    })
  } else {
    toast.add({ title: t('cash_register.toasts.error_title'), description: error, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-primary-500" />
        {{ $t('cash_register.title') }}
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
          <h3 class="text-lg font-semibold">{{ $t('cash_register.status.closed_title') }}</h3>
          <p class="text-gray-500">{{ $t('cash_register.status.closed_desc') }}</p>
        </div>
        <UButton size="lg" color="primary" icon="i-heroicons-key" @click="showOpenModal = true">
          {{ $t('cash_register.actions.open') }}
        </UButton>
      </div>
    </UCard>

    <!-- Open State -->
    <div v-else class="grid gap-6">
      <UCard class="border-l-4 border-l-green-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">{{ $t('cash_register.status.current_status') }}</p>
            <h3 class="text-2xl font-bold text-green-600 flex items-center gap-2 mt-1">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              {{ $t('cash_register.status.open') }}
            </h3>
            <p class="text-sm text-gray-400 mt-2">
              {{ $t('cash_register.status.started_at') }} {{ new Date(currentSession.opened_at).toLocaleString() }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 font-medium">{{ $t('cash_register.status.opening_amount') }}</p>
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
          {{ $t('cash_register.actions.close') }}
        </UButton>
        <UButton
          block
          size="xl"
          color="primary"
          icon="i-heroicons-shopping-cart"
          to="/transactions/new"
        >
          {{ $t('cash_register.actions.go_to_sales') }}
        </UButton>
      </div>
    </div>

    <!-- Open Modal -->
    <UModal v-model:open="showOpenModal" :title="$t('cash_register.modals.open_title')">
      <template #body>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500">{{ $t('cash_register.modals.open_desc') }}</p>
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
            <UButton color="neutral" variant="ghost" @click="showOpenModal = false">{{ $t('cash_register.actions.cancel') }}</UButton>
            <UButton :loading="processing" @click="handleOpenSession">{{ $t('cash_register.actions.confirm_open') }}</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Close Modal -->
    <UModal v-model:open="showCloseModal" :title="$t('cash_register.modals.close_title')">
      <template #body>
        <div class="p-6 space-y-4">
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="subtle"
            :title="$t('cash_register.alerts.irreversible_title')"
            :description="$t('cash_register.alerts.irreversible_desc')"
          />

          <!-- Session Summary -->
          <div v-if="sessionSummary" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 class="font-semibold text-sm uppercase tracking-wider text-gray-500">{{ $t('cash_register.summary.title') }}</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <span class="text-gray-500">{{ $t('cash_register.summary.opening') }}</span>
              <span class="font-bold text-right">₡{{ (currentSession?.opening_cash || 0).toLocaleString() }}</span>
              
              <span class="text-gray-500">{{ $t('cash_register.summary.total_sales') }}</span>
              <span class="font-bold text-right">₡{{ sessionSummary.totalSales?.toLocaleString() }}</span>
              
              <span class="text-gray-500 pl-2">• {{ $t('cash_register.summary.cash') }}</span>
              <span class="text-right text-green-600">₡{{ sessionSummary.cashSales?.toLocaleString() }}</span>
              
              <span class="text-gray-500 pl-2">• {{ $t('cash_register.summary.card') }}</span>
              <span class="text-right">₡{{ sessionSummary.cardSales?.toLocaleString() }}</span>
              
              <span class="text-gray-500 pl-2">• {{ $t('cash_register.summary.transfer') }}</span>
              <span class="text-right">₡{{ sessionSummary.transferSales?.toLocaleString() }}</span>

              <span v-if="sessionSummary.onlineSales > 0" class="text-gray-500 pl-2">• {{ $t('cash_register.summary.online') }}</span>
              <span v-if="sessionSummary.onlineSales > 0" class="text-right">₡{{ sessionSummary.onlineSales?.toLocaleString() }}</span>

              <span v-if="sessionSummary.otherSales > 0" class="text-gray-500 pl-2">• {{ $t('cash_register.summary.other') }}</span>
              <span v-if="sessionSummary.otherSales > 0" class="text-right">₡{{ sessionSummary.otherSales?.toLocaleString() }}</span>
              
              <div class="col-span-2 border-t border-gray-200 dark:border-gray-700 my-2" />
              
              <span class="text-gray-900 dark:text-white font-semibold">{{ $t('cash_register.summary.expected_total') }}</span>
              <span class="font-bold text-right text-lg text-primary-600">₡{{ expectedCash.toLocaleString() }}</span>
            </div>
          </div>

          <UFormField :label="$t('cash_register.labels.notes')" name="notes">
            <UTextarea v-model="closingNotes" :placeholder="$t('cash_register.placeholders.notes')" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="showCloseModal = false">{{ $t('cash_register.actions.cancel') }}</UButton>
            <UButton color="error" :loading="processing" @click="handleCloseSession">{{ $t('cash_register.actions.confirm_close') }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>