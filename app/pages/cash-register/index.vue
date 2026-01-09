<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { currentSession, fetchCurrentSession, openSession, closeSession, loading } = useCashRegister()
const toast = useToast()

// Estados de modales
const showOpenModal = ref(false)
const showCloseModal = ref(false)
const processing = ref(false)

// Formularios
const openState = reactive({ amount: 0 })
const closeState = reactive({ amount: 0, notes: '' })

// Inicializar
onMounted(() => {
  fetchCurrentSession()
})

// Acciones
async function handleOpen() {
  processing.value = true
  const { success, error } = await openSession(openState.amount)
  processing.value = false
  
  if (success) {
    showOpenModal.value = false
    toast.add({ title: 'Caja Aperturada', color: 'success' })
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}

async function handleClose() {
  processing.value = true
  const { success, error } = await closeSession(closeState.amount, closeState.notes)
  processing.value = false
  
  if (success) {
    showCloseModal.value = false
    toast.add({ title: 'Caja Cerrada', description: 'El turno ha finalizado correctamente', color: 'success' })
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-primary-500" />
        Control de Caja
      </h2>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

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

    <div v-else class="grid gap-6">
      <UCard class="border-l-4 border-l-green-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">Estado Actual</p>
            <h3 class="text-2xl font-bold text-green-600 flex items-center gap-2 mt-1">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Abierta
            </h3>
            <p class="text-sm text-gray-400 mt-2">
              Iniciada: {{ new Date(currentSession.opened_at).toLocaleString() }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 font-medium">Monto Inicial</p>
            <p class="text-2xl font-mono font-bold">₡{{ currentSession.start_amount.toLocaleString() }}</p>
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

    <UModal v-model:open="showOpenModal" title="Apertura de Caja">
      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-500">Ingresa el monto de efectivo inicial en la caja.</p>
        <UInput 
          v-model.number="openState.amount" 
          type="number" 
          size="xl" 
          autofocus
          placeholder="0.00"
        >
          <template #leading><span class="text-gray-500">₡</span></template>
        </UInput>
        <div class="flex justify-end gap-2 pt-4">
          <UButton color="neutral" variant="ghost" @click="showOpenModal = false">Cancelar</UButton>
          <UButton :loading="processing" @click="handleOpen">Abrir Turno</UButton>
        </div>
      </div>
    </UModal>

    <UModal v-model:open="showCloseModal" title="Cierre de Caja">
      <div class="p-6 space-y-4">
        <UAlert 
          icon="i-heroicons-exclamation-triangle"
          color="warning"
          variant="subtle"
          title="Acción Irreversible"
          description="Al cerrar caja se generará el reporte final del turno."
        />
        
        <UFormField label="Efectivo Final (Conteo)" name="endAmount">
          <UInput 
            v-model.number="closeState.amount" 
            type="number" 
            size="xl"
          >
            <template #leading><span class="text-gray-500">₡</span></template>
          </UInput>
        </UFormField>

        <UFormField label="Notas / Observaciones" name="notes">
          <UTextarea v-model="closeState.notes" placeholder="Diferencias, novedades..." />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton color="neutral" variant="ghost" @click="showCloseModal = false">Cancelar</UButton>
          <UButton color="error" :loading="processing" @click="handleClose">Confirmar Cierre</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>