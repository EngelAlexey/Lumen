<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <UCard class="w-full max-w-md text-center">
      <div class="flex flex-col items-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h2 class="text-xl font-bold mb-2">Configurando tu suscripción</h2>
        <p class="text-gray-500 text-sm">
          Estamos preparándonos para redirigirte a la pasarela de pago segura...
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

onMounted(async () => {
  const plan = route.query.plan as string
  
  if (!plan) {
    router.push('/pricing')
    return
  }

  try {
    const response = await $fetch('/api/stripe/create-checkout', {
        method: 'POST',
        body: { plan }
    })
    
    if (response.url) {
        window.location.href = response.url
    } else {
        throw new Error('No se recibió URL de pago')
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No pudimos iniciar el pago. Intenta nuevamente.', color: 'error' })
    router.push('/pricing')
  }
})
</script>