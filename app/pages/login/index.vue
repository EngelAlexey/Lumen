<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

const { login } = useAuth()
const toast = useToast()
const router = useRouter()

const { t } = useI18n()

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: '',
  remember: false
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await login({
        email: event.data.email, 
        password: event.data.password
    })
    
    if (result.success) {
      const user = useSupabaseUser()
      let attempts = 0
      while (!user.value && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      toast.add({ title: '¡Bienvenido!', color: 'success' })
      router.push('/dashboard')
    } else {
      toast.add({ 
        title: t('auth.access_error'), 
        description: result.error || t('auth.invalid_credentials'), 
        color: 'error' 
      })
    }
  } catch (error) {
    toast.add({ title: t('cash_register.toasts.error_title'), description: t('generic.error_unexpected'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  click: () => { toast.add({ title: 'Google', description: t('auth.provider_soon'), color: 'neutral' }) }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  click: () => { toast.add({ title: 'GitHub', description: t('auth.provider_soon'), color: 'neutral' }) }
}]
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-primary-500 mb-2" />
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ $t('login.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ $t('login.subtitle') }}</p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <UButton 
            v-for="provider in providers" 
            :key="provider.label"
            :label="provider.label"
            :icon="provider.icon"
            color="neutral"
            variant="ghost"
            block
            @click="provider.click"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white dark:bg-gray-900 px-2 text-gray-500">{{ $t('login.divider') }}</span>
          </div>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField :label="$t('register.labels.email')" name="email">
            <UInput v-model="state.email" icon="i-heroicons-envelope" :placeholder="$t('register.labels.email_placeholder')" class="w-full" />
          </UFormField>

          <UFormField :label="$t('register.labels.password')" name="password">
            <template #hint>
              <ULink to="/forgot-password" class="text-xs text-primary-500 hover:text-primary-600">
                {{ $t('login.forgot_password') }}
              </ULink>
            </template>
            <UInput v-model="state.password" type="password" icon="i-heroicons-key" :placeholder="$t('register.labels.password_placeholder')" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="state.remember" :label="$t('login.remember_me')" />
          </div>

          <UButton type="submit" block :loading="loading" color="primary">
            {{ $t('login.submit') }}
          </UButton>
        </UForm>
      </div>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          {{ $t('login.no_account') }}
          <ULink to="/register" class="font-medium text-primary-500 hover:text-primary-600">
            {{ $t('login.register_link') }}
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>