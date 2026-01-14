<script setup lang="ts">
definePageMeta({
  layout: false
})

onMounted(() => {
  setTimeout(() => {
    window.close()
    if (!window.closed) {
    }
  }, 5000)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-red-950 p-4">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <UIcon name="i-heroicons-x-circle" class="w-12 h-12 text-red-500" />
      </div>
      
      <h1 class="text-3xl font-bold text-red-700 dark:text-red-300 mb-2">
        Pago Cancelado
      </h1>
      
      <p class="text-red-600 dark:text-red-400 mb-4">
        El proceso de pago fue cancelado o interrumpido.
      </p>
      
      <p class="text-sm text-gray-500">
        Esta ventana se cerrará automáticamente...
      </p>
    </div>
  </div>
</template>
