<script setup lang="ts">
import * as z from 'zod'
import { BUSINESS_TYPES } from '~/constants/businessTypes'
import { MESSAGES } from '~/constants/messages'

definePageMeta({
  layout: 'auth'
})

const { register, login } = useAuth()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

// Removed 'Pago' step
const steps = computed(() => [t('register.steps.account'), t('register.steps.business'), t('register.steps.personal')])
const currentStep = ref(0)
const loading = ref(false)
const error = ref('')

const businessTypes = BUSINESS_TYPES

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
    email: z.string()
      .min(1, { message: t('validation.required_field') })
      .email({ message: t('validation.email_invalid') }),
    password: z.string()
      .min(1, { message: t('validation.required_field') })
      .min(8, { message: t('validation.password_min_length', { min: 8 }) }),
    confirmPassword: z.string()
      .min(1, { message: t('validation.required_field') })
      .min(8, { message: t('validation.password_min_length', { min: 8 }) })
  }).refine(data => data.password === data.confirmPassword, {
    message: t('validation.passwords_dont_match'),
    path: ["confirmPassword"]
  }),
  z.object({
    businessName: z.string()
      .min(1, { message: t('validation.required_field') })
      .min(2, { message: t('validation.name_too_short') }),
    // Simplify enum validation to avoid Typescript overload issues
    businessType: z.enum(['retail', 'gastronomy', 'services', 'pharmacy', 'fashion', 'delivery']),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  z.object({
    fullName: z.string()
      .min(1, { message: t('validation.required_field') })
      .min(3, { message: t('validation.name_too_short') })
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
      
      // Step 0: Check Email Availability before proceeding
      if (currentStep.value === 0) {
          loading.value = true
          try {
            const check = await $fetch<{ exists: boolean }>('/api/auth/check-email', {
                method: 'POST',
                body: { email: state.email }
            })
            
            if (check.exists) {
                toast.add({ 
                    title: 'Correo registrado', 
                    description: 'Este correo ya tiene una cuenta. Por favor inicia sesión.', 
                    color: 'warning',
                    duration: 5000
                })
                return // Stop here
            }
          } catch (e) {
            console.error('Email check failed', e)
            // Proceed if check fails? Or block? better block or warn. 
            // For now let's assume if it fails we let auth handle it.
          } finally {
            loading.value = false
          }
      }

      currentStep.value++
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]
      toast.add({ 
        title: 'Validación', 
        description: firstError?.message || 'Error de validación',
        color: 'warning'
      })
    } else {
        console.error('Registration Step Error:', err)
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

    // Register (Trigger creates DB records)
    // Removed redundant check-email here as it's done in Step 1
    
    console.log('Starting registration for:', state.email)

    const registerResult = await register({
      email: state.email,
      password: state.password,
      fullName: state.fullName,
      phone: state.phone,
      address: state.address,
      businessName: state.businessName,
      businessType: state.businessType,
      selectedPlan: selectedPlan.value || 'solo'
    })

    if (registerResult.success) {
       // Routing
       const planName = selectedPlan.value?.toLowerCase() || 'solo'

       if (planName === 'solo') {
            // Free: Confirm Email
            toast.add({ 
                title: 'Confirma tu correo', 
                description: 'Te hemos enviado un enlace para activar tu cuenta.', 
                color: 'success', duration: 10000 
            })
            router.push('/login?verified=pending')
       } else {
            // Paid: Redirect directly to payment processing
            toast.add({ 
                title: 'Cuenta Creada', 
                description: 'Redirigiendo al pago...', 
                color: 'success' 
            })
            router.push(`/payment/processing?plan=${planName}&userId=${registerResult.user?.id}`)
       }
    } else {
      error.value = MESSAGES.AUTH.REGISTER_ERROR
    }
  } catch (err: any) {
    console.error('Registration Error:', err)
    if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        error.value = 'Este correo ya está registrado. Por favor inicia sesión.'
    } else {
        error.value = err.message || MESSAGES.GENERIC.ERROR_UNEXPECTED
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden py-12">
    <!-- Background Decoration -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 bg-grid-slate-200/[0.04] dark:bg-grid-slate-800/[0.04] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
    </div>

    <!-- Main Card -->
    <UCard class="w-full max-w-[500px] relative z-10 shadow-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-800 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
      <template #header>
        <div class="text-center pt-2">
          <div class="w-12 h-12 mx-auto bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
             <UIcon name="i-heroicons-light-bulb" class="w-7 h-7 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ $t('register.title') }}</h1>
          <p class="text-sm text-gray-500 mt-2 font-medium">{{ $t('register.subtitle') }}</p>
        </div>
      </template>

      <!-- Stepper -->
      <div class="mb-8 px-4">
        <div class="flex justify-between relative">
          <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0"></div>
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="relative z-10 flex flex-col items-center gap-2 group cursor-default"
          >
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-4 ring-white dark:ring-gray-900 shadow-sm"
              :class="[
                currentStep === index ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white scale-110 shadow-primary-500/50' : 
                currentStep > index ? 'bg-green-500 text-white' : 
                'bg-gray-100 dark:bg-gray-800 text-gray-400'
              ]"
            >
              <UIcon v-if="currentStep > index" name="i-heroicons-check" class="w-5 h-5" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span 
              class="text-xs font-semibold transition-colors duration-300 absolute -bottom-6 w-max text-center"
              :class="currentStep === index ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
            >
              {{ step }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Spacer for stepper text -->
      <div class="h-4"></div>

      <!-- Forms -->
      <div class="space-y-6 mt-4">
        <!-- Step 1: Account -->
        <div v-if="currentStep === 0" class="space-y-5 animate-fade-in">
          <UFormField :label="$t('register.labels.email')" name="email" class="w-full">
            <UInput 
                v-model="state.email" 
                icon="i-heroicons-envelope" 
                :placeholder="$t('register.labels.email_placeholder')" 
                class="w-full"
                size="lg"
            />
          </UFormField>
          
          <UFormField :label="$t('register.labels.password')" name="password" class="w-full">
            <UInput 
                v-model="state.password" 
                type="password" 
                icon="i-heroicons-key" 
                :placeholder="$t('register.labels.password_placeholder')" 
                class="w-full"
                size="lg"
            />
          </UFormField>
          
          <UFormField :label="$t('register.labels.confirm_password')" name="confirmPassword" class="w-full">
            <UInput 
                v-model="state.confirmPassword" 
                type="password" 
                icon="i-heroicons-lock-closed" 
                :placeholder="$t('register.labels.password_placeholder')" 
                class="w-full"
                size="lg"
            />
          </UFormField>
          
          <div class="pt-2">
              <UButton block size="lg" color="primary" @click="nextStep">{{ $t('register.buttons.continue') }}</UButton>
          </div>
        </div>

        <!-- Step 2: Business -->
        <div v-if="currentStep === 1" class="space-y-5 animate-fade-in">
          <UFormField :label="$t('register.labels.business_name')" name="businessName" class="w-full">
            <UInput 
                v-model="state.businessName" 
                icon="i-heroicons-building-office-2" 
                :placeholder="$t('register.labels.business_name_placeholder')" 
                class="w-full"
                size="lg"
            />
          </UFormField>
          
          <UFormField :label="$t('register.labels.category')" name="businessType" class="w-full">
            <USelectMenu 
              v-model="state.businessType" 
              :items="businessTypes"
              value-key="value"
              class="w-full"
              size="lg"
            />
          </UFormField>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="$t('register.labels.phone')" name="phone" class="w-full">
              <UInput 
                v-model="state.phone" 
                icon="i-heroicons-phone" 
                :placeholder="$t('register.labels.phone_placeholder')" 
                class="w-full"
                size="lg"
              />
            </UFormField>
            <UFormField :label="$t('register.labels.address')" name="address" class="w-full">
              <UInput 
                v-model="state.address" 
                icon="i-heroicons-map-pin" 
                :placeholder="$t('register.labels.address_placeholder')" 
                class="w-full"
                size="lg"
              />
            </UFormField>
          </div>
          
          <div class="flex gap-3 pt-2">
            <UButton size="lg" color="neutral" variant="ghost" class="flex-1" @click="prevStep">{{ $t('register.buttons.back') }}</UButton>
            <UButton size="lg" block class="flex-1" @click="nextStep">{{ $t('register.buttons.continue') }}</UButton>
          </div>
        </div>

        <!-- Step 3: Personal -->
        <div v-if="currentStep === 2" class="space-y-6 animate-fade-in">
          <UFormField :label="$t('register.labels.full_name')" name="fullName" class="w-full">
            <UInput 
                v-model="state.fullName" 
                icon="i-heroicons-user" 
                :placeholder="$t('register.labels.full_name_placeholder')" 
                class="w-full"
                size="lg"
            />
          </UFormField>
          
          <div class="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl flex gap-3 border border-indigo-100 dark:border-indigo-900/50 items-start">
            <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
            <div class="text-sm text-indigo-900 dark:text-indigo-100">
                <p class="font-bold mb-1">{{ $t('register.info.almost_done') }}</p>
                <p>{{ $t('register.info.admin_account', { business: state.businessName }) }}</p>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 text-center font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 inline-block mr-1 -mt-0.5" />
            {{ error }}
          </p>

          <div class="flex gap-3 pt-2">
            <UButton size="lg" color="neutral" variant="ghost" class="flex-1" :disabled="loading" @click="prevStep">{{ $t('register.buttons.back') }}</UButton>
            <UButton size="lg" block class="flex-1 shadow-lg shadow-primary-500/20" :loading="loading" @click="handleRegister">
                {{ $t('register.buttons.finish') }}
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="text-center pt-2 pb-2">
            <p class="text-sm text-gray-500">
            {{ $t('register.buttons.has_account') }}
            <ULink to="/login" class="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                {{ $t('register.buttons.login_link') }}
            </ULink>
            </p>
        </div>
      </template>
    </UCard>
    
    <!-- Footer links -->
    <div class="mt-8 text-center text-xs text-gray-400 space-x-4 relative z-10">
        <a href="#" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Términos</a>
        <a href="#" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacidad</a>
        <a href="#" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Ayuda</a>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-grid-slate-200 {
  background-size: 40px 40px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
}

.dark .bg-grid-slate-800 {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>