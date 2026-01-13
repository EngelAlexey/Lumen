<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const user = useSupabaseUser()
const { getBusinessType } = useAuth() // Assuming useAuth has business logic access or store
const loading = ref(false)

// We can reuse the plans data or fetch it
const plans = computed(() => [
  {
    name: 'Solo',
    title: t('pricing.plans.solo.name'),
    price: 0,
    current: false // TODO: Check actual current plan
  },
  {
    name: 'Startup',
    title: t('pricing.plans.startup.name'),
    price: 29,
    current: false
  },
  {
    name: 'Organization',
    title: t('pricing.plans.organization.name'),
    price: 89,
    current: false
  }
])

async function handleDowngrade() {
    // Logic for downgrading or cancelling
    alert('Contact support to downgrade')
}

async function handleUpgrade(plan: any) {
    // Similar logic to pricing.vue but for existing user
    loading.value = true
    try {
        const response = await $fetch<{ success: boolean; url?: string }>('/api/payments/create-subscription', {
            method: 'POST',
            body: { 
                plan: plan.name.toLowerCase(),
                // priceId: plan.price // Server handles price ID lookup now
            }
        })
        if (response.url) {
            window.location.href = response.url
        } else {
             // Success internal
             alert('Plan actualizado')
        }
    } catch (e) {
        console.error(e)
        alert('Error changing plan')
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Facturación y Planes</h1>
    </div>

    <UCard>
        <template #header>
            <h3 class="font-semibold">Plan Actual</h3>
        </template>
        <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-300">Estás en el plan <strong>Startup</strong> (Ejemplo)</p>
            <div class="flex gap-4">
                <UButton color="error" variant="soft">Cancelar Suscripción</UButton>
            </div>
        </div>
    </UCard>

    <UCard>
        <template #header>
            <h3 class="font-semibold">Cambiar Plan</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="plan in plans" :key="plan.name" class="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold">{{ plan.title }}</h4>
                    <p class="text-2xl font-bold mt-2">${{ plan.price }}</p>
                </div>
                <div class="mt-4">
                    <UButton block :disabled="plan.current" @click="handleUpgrade(plan)">
                        {{ plan.current ? 'Plan Actual' : 'Cambiar' }}
                    </UButton>
                </div>
            </div>
        </div>
    </UCard>
  </div>
</template>
