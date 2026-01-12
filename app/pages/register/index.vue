<script setup lang="ts">
import * as z from 'zod'

definePageMeta({
  layout: false
})

const { register } = useAuth()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const steps = ['Cuenta', 'Negocio', 'Personal', 'Pago']
const currentStep = ref(0)
const loading = ref(false)
const error = ref('')

const selectedPlan = computed(() => (route.query.plan as string) || 'startup')

onMounted(() => {
  if (!route.query.plan) {
    toast.add({
      title: 'Selecciona un plan',
      description: 'Debes elegir un plan de suscripción.',
      color: 'primary'
    })
    router.push('/pricing')
  }
})

const schema = [
  z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres')
  }).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  }),
  z.object({
    businessName: z.string().min(2, 'Nombre muy corto'),
    businessType: z.enum(['retail', 'gastronomy', 'services', 'pharmacy', 'fashion'] as const),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  z.object({
    fullName: z.string().min(3, 'Nombre muy corto')
  })
]

const state = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  businessType: 'retail' as const,
  phone: '',
  address: '',
  fullName: ''
})

async function nextStep() {
  try {
    const currentSchema = schema[currentStep.value]
    if (currentSchema) {
      currentSchema.parse(state)
      currentStep.value++
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      toast.add({ 
        title: 'Validación', 
        description: (err as any).errors[0]?.message || 'Error de validación',
        color: 'warning'
      })
    }
  }
}

function prevStep() {
  currentStep.value--
}

async function handleRegister() {
  loading.value = true
  error.value = ''
  
  try {
    const finalSchema = schema[2]
    if (finalSchema) finalSchema.parse(state)
    
    const result = await register({
      email: state.email,
      password: state.password,
      fullName: state.fullName,
      businessName: state.businessName,
      businessType: state.businessType,
      phone: state.phone,
      address: state.address,
      selectedPlan: selectedPlan.value
    })

    if (result.success) {
      toast.add({ 
        title: '¡Casi listo!', 
        description: 'Revisa tu correo para activar tu cuenta y proceder al pago.', 
        color: 'success',
        duration: 10000
      })
      router.push('/login?verified=pending')
    } else {
      error.value = 'Error al crear la cuenta'
    }
  } catch (err: any) {
    error.value = err.message || 'Error inesperado'
  } finally {
    loading.value = false
  }
}

import { BUSINESS_TYPES } from '~/constants/businessTypes'

const businessTypes = BUSINESS_TYPES
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="w-full max-w-lg">
      <template #header>
        <div class="text-center">
          <UIcon name="i-heroicons-light-bulb" class="w-8 h-8 text-primary-500 mb-2" />
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h1>
          <p class="text-sm text-gray-500 mt-1">Optimiza tu negocio en segundos</p>
        </div>
      </template>

      <div class="mb-8">
        <div class="flex justify-between relative px-2">
          <div class="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800 z-0 select-none pointer-events-none"></div>
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="relative z-10 flex flex-col items-center gap-2 group"
          >
            <div 
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-4 ring-white dark:ring-gray-900',
                currentStep === index ? 'bg-primary-500 text-white shadow-lg scale-110' : 
                currentStep > index ? 'bg-green-500 text-white' : 
                'bg-gray-200 dark:bg-gray-800 text-gray-400'
              ]"
            >
              <UIcon v-if="currentStep > index" name="i-heroicons-check" class="w-5 h-5" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span 
              class="text-xs font-medium transition-colors duration-300" 
              :class="currentStep === index ? 'text-primary-500' : 'text-gray-400'"
            >
              {{ step }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="currentStep === 0" class="space-y-4">
          <UFormField label="Email" name="Correo electrónico">
            <UInput v-model="state.email" icon="i-heroicons-envelope" placeholder="Ingresa tu correo electrónico" />
          </UFormField>
          <UFormField label="Contraseña" name="password">
            <UInput v-model="state.password" type="password" icon="i-heroicons-key" placeholder="••••••••" />
          </UFormField>
          <UFormField label="Confirmar Contraseña" name="confirmPassword">
            <UInput v-model="state.confirmPassword" type="password" icon="i-heroicons-lock-closed" placeholder="••••••••" />
          </UFormField>
          <UButton block @click="nextStep">Continuar</UButton>
        </div>

        <div v-if="currentStep === 1" class="space-y-4">
          <UFormField label="Nombre de tu negocio" name="businessName">
            <UInput v-model="state.businessName" icon="i-heroicons-building-office-2" placeholder="Mi Tienda" />
          </UFormField>
          <UFormField label="Selecciona una categoría" name="businessType">
            <USelectMenu 
              v-model="state.businessType" 
              :items="businessTypes"
              value-key="value"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="N°Teléfono" name="phone">
              <UInput v-model="state.phone" icon="i-heroicons-phone" placeholder="8888-8888" />
            </UFormField>
            <UFormField label="Ingresa tu dirección" name="address">
              <UInput v-model="state.address" icon="i-heroicons-map-pin" placeholder="San José" />
            </UFormField>
          </div>
          <div class="flex gap-3 mt-4">
            <UButton color="neutral" variant="ghost" class="flex-1" @click="prevStep">Atrás</UButton>
            <UButton block class="flex-1" @click="nextStep">Continuar</UButton>
          </div>
        </div>

        <div v-if="currentStep === 2" class="space-y-6">
          <UFormField label="Nombre Completo" name="fullName">
            <UInput v-model="state.fullName" icon="i-heroicons-user" placeholder="Juan Pérez" />
          </UFormField>
          
          <div class="bg-primary-50 dark:bg-primary-950/50 p-4 rounded-lg flex gap-3 border border-primary-100 dark:border-primary-900">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p class="text-sm text-primary-900 dark:text-primary-100">
              Estás creando una cuenta como <span class="font-semibold text-primary-600 dark:text-primary-400">Owner</span> de 
              <span class="font-semibold text-primary-600 dark:text-primary-400">{{ state.businessName }}</span>.
            </p>
          </div>

          <p v-if="error" class="text-sm text-red-500 text-center font-medium bg-red-50 dark:bg-red-950/30 p-2 rounded">{{ error }}</p>

          <div class="flex gap-3 mt-4">
            <UButton color="neutral" variant="ghost" class="flex-1" :disabled="loading" @click="prevStep">Atrás</UButton>
            <UButton block class="flex-1" :loading="loading" @click="handleRegister">Crear cuenta</UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          ¿Ya tienes cuenta?
          <ULink to="/login" class="font-medium text-primary-500 hover:text-primary-600">
            Inicia Sesión
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>