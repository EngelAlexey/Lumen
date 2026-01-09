<script setup lang="ts">
definePageMeta({
  layout: false
})

const plans = [
  {
    name: 'Solo',
    description: 'Para emprendedores individuales que inician.',
    price: 0,
    features: [
      '1 Usuario Administrador',
      'Registro de ventas básico',
      'Gestión de inventario simple',
      'Reportes diarios por email',
      'Soporte por comunidad'
    ],
    button: 'Comenzar Gratis',
    highlight: false,
    trial: '14 días de prueba'
  },
  {
    name: 'Startup',
    description: 'Optimiza tu pequeña empresa con herramientas avanzadas.',
    price: 29,
    features: [
      'Hasta 5 Usuarios',
      'Auditoría en tiempo real',
      'Control de caja multi-sesión',
      'Gestión de clientes (CRM)',
      'Soporte prioritario',
      'Integración con Facturación'
    ],
    button: 'Elegir Startup',
    highlight: true,
    trial: '14 días de prueba'
  },
  {
    name: 'Organization',
    description: 'Escabilidad total para empresas con múltiples sucursales.',
    price: 89,
    features: [
      'Usuarios Ilimitados',
      'Múltiples Sucursales',
      'API de integración personalizada',
      'Reportes corporativos avanzados',
      'Account Manager dedicado',
      'SLA del 99.9%'
    ],
    button: 'Contactar Ventas',
    highlight: false,
    trial: '14 días de prueba'
  }
]

const router = useRouter()
const toast = useToast()
const loadingPlans = ref<Record<string, boolean>>({})

async function selectPlan(plan: any) {
  if (plan.name === 'Organization') {
    window.location.href = 'mailto:ventas@lumen.com?subject=Interés en Plan Organization'
    return
  }

  // If user is already logged in, go to checkout. If not, go to register.
  const user = useSupabaseUser()
  if (!user.value) {
    router.push(`/register?plan=${plan.name.toLowerCase()}`)
    return
  }

  loadingPlans.value[plan.name] = true
  try {
    const { url } = await $fetch('/api/stripe/create-checkout', {
      method: 'POST',
      body: { plan: plan.name.toLowerCase() }
    })
    
    if (url) {
      window.location.href = url
    }
  } catch (err: any) {
    toast.add({
      title: 'Error de cobro',
      description: err.data?.message || 'No se pudo iniciar el proceso de pago.',
      color: 'error'
    })
  } finally {
    loadingPlans.value[plan.name] = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4">
    <UNotifications></UNotifications>
    <div class="max-w-7xl mx-auto space-y-16">
      <!-- Title Section -->
      <div class="text-center space-y-4 max-w-3xl mx-auto">
        <div class="flex items-center justify-center gap-2 mb-4 group cursor-pointer" @click="router.push('/')">
          <UIcon name="i-heroicons-light-bulb" class="w-8 h-8 text-primary-600 transition-transform group-hover:scale-110"></UIcon>
          <span class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Lumen</span>
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Planes simples para cada etapa
        </h2>
        <p class="text-xl text-gray-500">
          Prueba cualquier plan gratis por 14 días. Sin tarjeta de crédito.
        </p>
      </div>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
          v-for="plan in plans" 
          :key="plan.name"
          :class="[
            'relative bg-white dark:bg-gray-900 rounded-2xl p-8 flex flex-col h-full border transition-all duration-300',
            plan.highlight ? 'ring-2 ring-primary-600 shadow-2xl scale-105 z-10' : 'border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl'
          ]"
        >
          <div v-if="plan.highlight" class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Más Popular
          </div>

          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
            <p class="text-sm text-gray-500 mt-2 min-h-[40px]">{{ plan.description }}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-extrabold text-gray-900 dark:text-white">${{ plan.price }}</span>
              <span class="text-gray-500 font-medium">/mes</span>
            </div>
          </div>

          <ul class="space-y-4 mb-8 flex-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-3">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 shrink-0"></UIcon>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ feature }}</span>
            </li>
          </ul>

          <div class="space-y-4">
            <UButton 
              :color="plan.highlight ? 'primary' : 'neutral'" 
              :variant="plan.highlight ? 'solid' : 'outline'"
              block 
              size="xl" 
              class="font-bold py-4"
              :loading="loadingPlans[plan.name]"
              @click="selectPlan(plan)"
            >
              {{ plan.button }}
            </UButton>
            <p class="text-center text-xs text-gray-400 font-medium">
              Incluye {{ plan.trial }}
            </p>
          </div>
        </div>
      </div>

      <!-- FAQ Placeholder -->
      <div class="text-center pt-12">
        <p class="text-gray-500 text-sm">
          Preguntas? Contacta a nuestro equipo en <a href="mailto:soporte@lumen.com" class="text-primary-600 font-medium hover:underline">soporte@lumen.com</a>
        </p>
      </div>
    </div>
  </div>
</template>
