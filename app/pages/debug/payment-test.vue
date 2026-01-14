<script setup lang="ts">
const user = useSupabaseUser()
const loading = ref(false)
const result = ref('')

async function testPayment(plan: string) {
  loading.value = true
  result.value = 'Testing...'
  
  try {
     const endpoint = '/api/payments/create-subscription' 
     
     const body = {
        userId: user.value?.id,
        plan: plan,
        priceId: plan === 'startup' ? 29 : 89
     }

     result.value += `\nCalling ${endpoint} with ${JSON.stringify(body)}`
     
     const response = await $fetch<any>(endpoint, {
        method: 'POST',
        body
     })
     
     result.value += `\nResponse: ${JSON.stringify(response)}`
     
     if (response.url) {
        result.value += `\nRedirecting to: ${response.url}`
        window.location.href = response.url 
     } else {
        result.value += `\nNo URL returned!`
     }

  } catch (e: any) {
    result.value += `\nError: ${e.message} \nData: ${JSON.stringify(e.data)}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-8 space-y-4">
    <h1 class="text-2xl font-bold">Debug Payment Flow</h1>
    <div v-if="user">
        <p>User: {{ user.id }}</p>
        <p>Email: {{ user.email }}</p>
        <div class="flex gap-4">
            <UButton @click="testPayment('startup')" :loading="loading">Test Startup Plan ($29)</UButton>
            <UButton @click="testPayment('organization')" :loading="loading" color="neutral">Test Org Plan ($89)</UButton>
        </div>
    </div>
    <div v-else>
        <p>Please login first.</p>
        <UButton to="/login">Go to Login</UButton>
    </div>

    <pre class="bg-gray-100 p-4 rounded mt-4 text-xs overflow-auto max-h-96">{{ result }}</pre>
  </div>
</template>
