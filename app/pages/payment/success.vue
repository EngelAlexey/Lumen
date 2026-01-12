<script setup lang="ts">
const { fetchProfile } = useAuth()
const router = useRouter()

definePageMeta({
  layout: false
})

onMounted(async () => {
  // Wait briefly for webhook to process, then redirect to dashboard
  setTimeout(async () => {
    await fetchProfile()
    router.push('/dashboard')
  }, 3000) // 3 seconds is enough for the webhook to process
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="w-full max-w-md text-center">
      <div class="flex flex-col items-center py-8">
        <div class="mb-6 relative">
          <div class="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
          <UIcon name="i-heroicons-check-circle" class="w-20 h-20 text-green-500 relative z-10" />
        </div>
        
        <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">¡Pago Exitoso!</h2>
        <p class="text-gray-500 mb-6">
          Estamos terminando de configurar tu entorno. Esto tomará solo unos segundos...
        </p>

        <div class="flex items-center gap-3 text-sm text-primary-600 bg-primary-50 px-4 py-2 rounded-full">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
          <span>Sincronizando licencia...</span>
        </div>
      </div>
    </UCard>
  </div>
</template>