<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <UCard class="w-full max-w-md text-center">
            <h1 class="text-xl font-bold mb-4">Prueba de Pasarela Onvo</h1>
            <p class="text-sm text-gray-500 mb-6">Esta es una prueba aislada con datos genéricos.</p>

            <UButton 
                size="xl" 
                block 
                :loading="loading" 
                @click="startTest"
            >
                Iniciar Prueba de Pago ($10.00)
            </UButton>

            <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm text-left overflow-auto">
                {{ error }}
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
const loading = ref(false)
const error = ref('')

definePageMeta({
    layout: false
})

async function startTest() {
    loading.value = true
    error.value = ''
    try {
        const response = await $fetch<any>('/api/payments/test-checkout', {
            method: 'POST'
        })
        
        if (response.url) {
            window.location.href = response.url
        } else if (response.id) {
            window.location.href = `https://checkout.onvopay.com/pay/${response.id}`
        } else {
            throw new Error('No URL returned')
        }
    } catch (e: any) {
        error.value = e.message

    } finally {
        loading.value = false
    }
}
</script>
