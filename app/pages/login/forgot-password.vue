<script setup lang="ts">
const email = ref('')
const loading = ref(false)
const { forgotPassword } = useAuth()
const toast = useToast()

definePageMeta({
  layout: 'auth'
})

async function handleSubmit() {
  try {
    loading.value = true
    await forgotPassword(email.value)
    toast.add({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-bold">{{ $t('login.forgot_password') }}</h1>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormField label="Correo electrónico" name="email">
            <UInput v-model="email" type="email" placeholder="tu@email.com" icon="i-heroicons-envelope" required />
        </UFormField>

        <UButton type="submit" block :loading="loading">enviar enlace de recuperación</UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm">
            <ULink to="/login" class="text-primary-600 hover:underline">Volver al inicio de sesión</ULink>
        </div>
      </template>
    </UCard>
  </div>
</template>
