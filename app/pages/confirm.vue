
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <UCard class="w-full max-w-md text-center">
      <div class="flex flex-col items-center py-8">
        <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mb-4 animate-bounce" />
        <h1 class="text-2xl font-bold mb-2">¡Cuenta Confirmada!</h1>
        <p class="text-gray-500 mb-6">
            Estamos configurando tu sesión, serás redirigido en unos segundos...
        </p>
        <UProgress animation="carousel" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

// Use a watcher to detect when the user becomes available
watch(user, (newUser) => {
    if (newUser) {
        // Add a small delay for UX and to ensure state propagation
        setTimeout(() => {
            router.push('/dashboard')
        }, 1500)
    }
}, { immediate: true })

onMounted(() => {
    // Fallback if watch doesn't trigger (e.g. already logged in but slow hydration)
    setTimeout(() => {
        if (user.value) {
             router.push('/dashboard')
        } else {
            // If still no user after timeout, maybe redirect to login with a message
             router.push('/login?verified=true')
        }
    }, 4000)
})
</script>
