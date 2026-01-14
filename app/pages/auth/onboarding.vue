<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

definePageMeta({
  layout: false
})

onMounted(async () => {
  let attempts = 0
  while (!user.value && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 200))
    attempts++
  }


  if (!user.value) {
    return router.push('/login?error=link_expired')
  }

  const plan = user.value.user_metadata?.selected_plan || 'startup'

  if (plan === 'solo') {
      return navigateTo('/')
  }

  return navigateTo(`/payment/processing?plan=${plan}`, { replace: true })
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
    <UIcon name="i-heroicons-check-badge" class="w-16 h-16 text-green-500 mb-4" />
    <h1 class="text-2xl font-bold mb-2">¡Correo Confirmado!</h1>
    <p class="text-gray-500">Te estamos redirigiendo al paso final...</p>
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-500 animate-spin mt-6" />
  </div>
</template>
