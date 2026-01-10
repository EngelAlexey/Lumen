<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: false
})

const { login } = useAuth()
const toast = useToast()
const router = useRouter()

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
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
    const result = await login(event.data.email, event.data.password)
    
    if (result.success) {
      toast.add({ title: '¡Bienvenido!', color: 'success' })
      router.push('/dashboard')
    } else {
      toast.add({ 
        title: 'Error de acceso', 
        description: result.error || 'Credenciales inválidas', 
        color: 'error' 
      })
    }
  } catch (error) {
    toast.add({ title: 'Error', description: 'Ocurrió un error inesperado', color: 'error' })
  } finally {
    loading.value = false
  }
}

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  click: () => { toast.add({ title: 'Google', description: 'Próximamente', color: 'neutral' }) }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  click: () => { toast.add({ title: 'GitHub', description: 'Próximamente', color: 'neutral' }) }
}]
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-primary-500 mb-2" />
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Bienvenido</h1>
          <p class="text-sm text-gray-500 mt-1">Ingresa a tu cuenta para continuar</p>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Social Providers -->
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
            <span class="bg-white dark:bg-gray-900 px-2 text-gray-500">O continúa con email</span>
          </div>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Email" name="email">
            <UInput v-model="state.email" icon="i-heroicons-envelope" placeholder="tu@email.com" class="w-full" />
          </UFormField>

          <UFormField label="Contraseña" name="password">
            <template #hint>
              <ULink to="/forgot-password" class="text-xs text-primary-500 hover:text-primary-600">
                ¿Olvidaste tu contraseña?
              </ULink>
            </template>
            <UInput v-model="state.password" type="password" icon="i-heroicons-key" placeholder="••••••••" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="state.remember" label="Recordarme" />
          </div>

          <UButton type="submit" block :loading="loading" color="primary">
            Iniciar Sesión
          </UButton>
        </UForm>
      </div>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          ¿No tienes cuenta?
          <ULink to="/register" class="font-medium text-primary-500 hover:text-primary-600">
            Regístrate
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>
