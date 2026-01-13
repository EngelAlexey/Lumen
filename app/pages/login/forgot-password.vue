<script setup lang="ts">
const email = ref('')
const loading = ref(false)
const { forgotPassword } = useAuth()
const toast = useToast()
const { t } = useI18n()

definePageMeta({
  layout: 'auth'
})

async function handleSubmit() {
  try {
    loading.value = true
    await forgotPassword(email.value)
    toast.add({ title: t('login.recovery_sent_title'), description: t('login.recovery_sent_desc'), color: 'success' })
  } catch (error: any) {
    toast.add({ title: t('cash_register.toasts.error_title'), description: error.message, color: 'error' })
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
        <UFormField :label="$t('register.labels.email')" name="email">
            <UInput v-model="email" type="email" :placeholder="$t('register.labels.email_placeholder')" icon="i-heroicons-envelope" required />
        </UFormField>

        <UButton type="submit" block :loading="loading">{{ $t('login.send_recovery_link') }}</UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm">
            <ULink to="/login" class="text-primary-600 hover:underline">{{ $t('login.back_to_login') }}</ULink>
        </div>
      </template>
    </UCard>
  </div>
</template>
