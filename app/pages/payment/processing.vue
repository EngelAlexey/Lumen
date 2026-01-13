<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <UCard class="w-full max-w-md text-center">
      <div class="flex flex-col items-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h2 class="text-xl font-bold mb-2">Configurando tu suscripción</h2>
        <p class="text-gray-500 text-sm">
          Estamos preparándonos para redirigirte a la pasarela de pago segura...
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const toast = useToast()

onMounted(async () => {
  console.log('[PaymentProcessing] Mounted')
  // Wait for user to be ready
  let attempts = 0
  while (!user.value && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200))
    attempts++
  }
  
  const plan = route.query.plan as string
  let targetUserId = user.value?.id

  // Fallback: If no session, check for userId in query (for immediate registration flow)
  if (!targetUserId && route.query.userId) {
      targetUserId = route.query.userId as string
      console.log('[PaymentProcessing] Using userId from query:', targetUserId)
  }

  if (!targetUserId) {
    console.warn('[PaymentProcessing] No user or userId found, going to login')
    router.push('/login')
    return
  }

  console.log('[PaymentProcessing] Processing for user:', targetUserId)
  
  if (!plan) {
    router.push('/pricing')
    return
  }

  try {
    console.log('[PaymentProcessing] Calling API...')
    const response = await $fetch<any>('/api/payments/create-subscription', {
        method: 'POST',
        body: { 
            userId: targetUserId,
            plan: plan,
            priceId: plan === 'startup' ? 29 : 89 
        }
    })
    
    console.log('[PaymentProcessing] Response:', response)

    if (response.url) {
        console.log('[PaymentProcessing] Redirecting to:', response.url)
        window.location.href = response.url
    } else if (response.id) {
        // Fallback: Construct URL if only ID returned
        const checkoutUrl = `https://checkout.onvopay.com/pay/${response.id}`
        console.log('[PaymentProcessing] Redirecting to (constructed):', checkoutUrl)
        window.location.href = checkoutUrl
    } else if (response.success) {
        // Free plan or internal activation
        toast.add({ title: 'Suscripción activada', color: 'success' })
        router.push('/')
    } else {
        throw new Error('No se recibió URL de pago')
    }
  } catch (error: any) {
    console.error('[PaymentProcessing] Error:', error)
    toast.add({ 
        title: 'Error', 
        description: error.message || 'No pudimos iniciar el pago.', 
        color: 'error' 
    })
    router.push('/pricing')
  }
})
</script>