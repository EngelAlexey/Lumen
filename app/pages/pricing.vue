<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const loadingPlans = ref<Record<string, boolean>>({})

const plans = computed(() => [
  {
    name: 'Solo',
    title: t('pricing.plans.solo.name'),
    description: t('pricing.plans.solo.description'),
    price: 0,
    features: [
      t('pricing.plans.solo.features.admin'),
      t('pricing.plans.solo.features.sales'),
      t('pricing.plans.solo.features.inventory'),
      t('pricing.plans.solo.features.reports'),
      t('pricing.plans.solo.features.support')
    ],
    button: t('pricing.plans.solo.button'),
    highlight: false,
    trial: t('pricing.trial_days')
  },
  {
    name: 'Startup',
    title: t('pricing.plans.startup.name'),
    description: t('pricing.plans.startup.description'),
    price: 29,
    features: [
      t('pricing.plans.startup.features.users'),
      t('pricing.plans.startup.features.audit'),
      t('pricing.plans.startup.features.cash'),
      t('pricing.plans.startup.features.crm'),
      t('pricing.plans.startup.features.support'),
      t('pricing.plans.startup.features.integration')
    ],
    button: t('pricing.plans.startup.button'),
    highlight: true,
    trial: t('pricing.trial_days')
  },
  {
    name: 'Organization',
    title: t('pricing.plans.organization.name'),
    description: t('pricing.plans.organization.description'),
    price: 89,
    features: [
      t('pricing.plans.organization.features.users'),
      t('pricing.plans.organization.features.branches'),
      t('pricing.plans.organization.features.api'),
      t('pricing.plans.organization.features.reports'),
      t('pricing.plans.organization.features.manager'),
      t('pricing.plans.organization.features.sla')
    ],
    button: t('pricing.plans.organization.button'),
    highlight: false,
    trial: t('pricing.trial_days')
  }
])

async function selectPlan(plan: any) {
  if (plan.name === 'Organization') {
    window.location.href = 'mailto:ventas@lumen.com?subject=Interés en Plan Organization'
    return
  }

  // If user is already logged in, go to checkout. If not, go to register.
  const user = useSupabaseUser()
  if (!user.value || !user.value.id) {
    router.push(`/register?plan=${plan.name.toLowerCase()}`)
    return
  }

  loadingPlans.value[plan.name] = true
  console.log('Sending subscription request:', { userId: user.value.id, plan: plan.name, price: plan.price }) // Debug
  try {
    const response = await $fetch<{ success: boolean; url?: string }>('/api/payments/create-subscription', {
      method: 'POST',
      body: { 
        userId: user.value.id,
        plan: plan.name.toLowerCase(),
        priceId: plan.price
      }
    })
    
    if (response.url) {
      window.location.href = response.url
    } else {
       toast.add({
        title: 'Suscripción Iniciada',
        description: 'Se ha creado la suscripción. Revisa tu correo.',
        color: 'primary'
      })
    }
  } catch (err: any) {
    console.error('Subscription Error:', err)
    toast.add({
      title: t('pricing.errors.payment_title'),
      description: err.data?.message || t('pricing.errors.payment_desc'),
      color: 'error'
    })
  } finally {
    loadingPlans.value[plan.name] = false
  }
}
const route = useRoute()

const store = useBusinessStore()
const { userProfile } = storeToRefs(store)
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950 flex-1 flex flex-col justify-center py-12 px-4">
    

    <div class="max-w-7xl mx-auto space-y-16">
      
      <!-- Title Section -->
      <div class="text-center space-y-4 max-w-3xl mx-auto pt-10">
        <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {{ $t('pricing.title') }}
        </h2>
        <p class="text-xl text-gray-500">
          {{ $t('pricing.subtitle') }}
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
            {{ $t('pricing.most_popular') }}
          </div>

          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
            <p class="text-sm text-gray-500 mt-2 min-h-[40px]">{{ plan.description }}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-extrabold text-gray-900 dark:text-white">${{ plan.price }}</span>
              <span class="text-gray-500 font-medium">{{ $t('pricing.per_month') }}</span>
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
              {{ $t('pricing.includes_trial', { trial: plan.trial }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- FAQ Placeholder -->
      <div class="text-center pt-12">
        <p class="text-gray-500 text-sm">
          {{ $t('pricing.contact_support') }} <a href="mailto:soporte@lumen.com" class="text-primary-600 font-medium hover:underline">soporte@lumen.com</a>
        </p>
      </div>
    </div>
  </div>
</template>
