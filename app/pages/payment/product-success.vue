<script setup lang="ts">
definePageMeta({
  layout: false
})

// Auto-close window after 3 seconds
onMounted(() => {
  setTimeout(() => {
    window.close()
    // If window.close() doesn't work (blocked by browser), redirect
    if (!window.closed) {
      window.location.href = 'about:blank'
    }
  }, 3000)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-green-50 dark:bg-green-950 p-4">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500" />
      </div>
      
      <h1 class="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
        ¡Pago Exitoso!
      </h1>
      
      <p class="text-green-600 dark:text-green-400 mb-4">
        Tu pago ha sido procesado correctamente
      </p>
      
      <p class="text-sm text-gray-500">
        Esta ventana se cerrará automáticamente...
      </p>
    </div>
  </div>
</template>
