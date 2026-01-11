<script setup lang="ts">
const { fetchProfile, business } = useAuth()
const router = useRouter()
const attempts = ref(0)
const maxAttempts = 30

definePageMeta({
  layout: false
})

onMounted(async () => {
  const checkStatus = setInterval(async () => {
    attempts.value++
    
    await fetchProfile()

    if (business.value && ['active', 'trialing'].includes(business.value.subscription_status)) {
      clearInterval(checkStatus)
      router.push('/dashboard')
    }

    if (attempts.value >= maxAttempts) {
      clearInterval(checkStatus)
      router.push('/dashboard')
    }
  }, 2000)
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