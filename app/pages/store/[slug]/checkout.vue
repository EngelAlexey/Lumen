<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const route = useRoute()
const { currentStore, fetchStore } = useStorefront()
const cart = useCart()
const router = useRouter()
const toast = useToast()
const loading = ref(false)

definePageMeta({
    layout: 'store',
})

// Fetch store data and redirect if cart empty
onMounted(async () => {
    const slug = route.params.slug as string
    if (slug) {
        await fetchStore(slug)
    }
    
    if (cart.isEmpty) {
        router.push(`/store/${slug}/cart`)
    }
})

// Schema for Customer Details
const schema = z.object({
    full_name: z.string().min(1, 'El nombre es obligatorio'),
    phone: z.string().min(1, 'El teléfono es obligatorio'),
    email: z.string().email('Correo inválido').or(z.literal('')),
    address: z.string().min(1, 'La dirección es obligatoria'),
    notes: z.string().optional(),
    payment_method: z.enum(['online', 'cash', 'transfer']).default('online')
})

const state = reactive({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    payment_method: 'online' as 'online' | 'cash' | 'transfer'
})

const paymentMethods = [
    { value: 'online', label: 'Pagar Ahora (Tarjeta Online)', icon: 'i-heroicons-credit-card' },
    { value: 'cash', label: 'Efectivo Contra Entrega', icon: 'i-heroicons-banknotes' },
    { value: 'transfer', label: 'Transferencia (Enviar Comprobante)', icon: 'i-heroicons-arrow-path' }
]

async function onSubmit(event: FormSubmitEvent<any>) {
    try {
        loading.value = true
        
        // Ensure store is loaded
        if (!currentStore.value?.id) {
            throw new Error('La tienda no está disponible en este momento')
        }
        
        // 1. Submit Order to API (Create Customer + Transaction)
        const result = await $fetch('/api/store/order', {
            method: 'POST',
            body: {
                businessId: currentStore.value.id,
                customer: event.data,
                paymentMethod: event.data.payment_method,
                items: cart.items.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price,
                    discount: item.discount
                }))
            }
        }) as any

        if (result.success) {
            cart.clearCart()
            
            // If online payment, redirect to payment link
            if (event.data.payment_method === 'online' && result.paymentUrl) {
                window.location.href = result.paymentUrl
                return
            }
            
            // For cash/transfer, show success and go back to store
            toast.add({
                title: 'Pedido Confirmado',
                description: event.data.payment_method === 'cash' 
                    ? 'Tu pedido ha sido confirmado. Paga en efectivo al recibir.'
                    : 'Tu pedido ha sido confirmado. Envía el comprobante de transferencia.',
                color: 'success',
                duration: 6000
            })
            router.push(`/store/${currentStore.value.slug}`)
        } else {
            throw new Error(result.error || 'Error al procesar pedido')
        }

    } catch (e: any) {
        toast.add({
            title: 'Error',
            description: e.message || 'Ocurrió un error inesperado',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="py-12 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <UContainer class="max-w-6xl">
            <UButton 
                :to="`/store/${currentStore?.slug}/cart`" 
                variant="ghost" 
                icon="i-heroicons-arrow-left" 
                class="mb-8 hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
                Volver al carrito
            </UButton>

            <h1 class="text-4xl font-bold mb-10 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Finalizar Pedido
            </h1>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Customer Form - Takes 2 columns -->
                <div class="lg:col-span-2">
                    <UCard class="shadow-xl border-0">
                        <template #header>
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                    <UIcon name="i-heroicons-user-circle" class="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 class="text-xl font-bold">Información de Entrega</h3>
                            </div>
                        </template>

                        <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-6">
                            <!-- Name and Phone Row -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <UFormField label="Nombre Completo" name="full_name" required>
                                    <UInput 
                                        v-model="state.full_name" 
                                        icon="i-heroicons-user" 
                                        size="lg"
                                        placeholder="Juan Pérez"
                                    />
                                </UFormField>

                                <UFormField label="Teléfono / WhatsApp" name="phone" required>
                                    <UInput 
                                        v-model="state.phone" 
                                        icon="i-heroicons-phone" 
                                        size="lg"
                                        placeholder="8888-8888"
                                    />
                                </UFormField>
                            </div>

                            <!-- Address -->
                            <UFormField label="Dirección de Entrega" name="address" required>
                                <UTextarea 
                                    v-model="state.address" 
                                    :rows="3"
                                    size="lg"
                                    placeholder="Calle, número, referencias..."
                                />
                            </UFormField>

                            <!-- Email -->
                            <UFormField label="Correo Electrónico (Opcional)" name="email">
                                <UInput 
                                    v-model="state.email" 
                                    icon="i-heroicons-envelope" 
                                    size="lg"
                                    placeholder="correo@ejemplo.com"
                                />
                            </UFormField>

                            <!-- Payment Method - Visual Cards -->
                            <UFormField label="Método de Pago" name="payment_method" required>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                    <button
                                        v-for="method in paymentMethods"
                                        :key="method.value"
                                        type="button"
                                        @click="state.payment_method = method.value as 'online' | 'cash' | 'transfer'"
                                        :class="[
                                            'relative p-4 rounded-xl border-2 transition-all duration-200',
                                            'hover:shadow-md flex flex-col items-center gap-2 text-center',
                                            state.payment_method === method.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg ring-2 ring-primary-500/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                                        ]"
                                    >
                                        <UIcon 
                                            :name="method.icon" 
                                            :class="[
                                                'w-8 h-8 mb-1',
                                                state.payment_method === method.value 
                                                    ? 'text-primary-600' 
                                                    : 'text-gray-500 dark:text-gray-400'
                                            ]"
                                        />
                                        <span 
                                            :class="[
                                                'text-sm font-medium',
                                                state.payment_method === method.value 
                                                    ? 'text-primary-900 dark:text-primary-100' 
                                                    : 'text-gray-700 dark:text-gray-300'
                                            ]"
                                        >
                                            {{ method.label }}
                                        </span>
                                        <UIcon 
                                            v-if="state.payment_method === method.value"
                                            name="i-heroicons-check-circle-solid"
                                            class="absolute top-2 right-2 w-5 h-5 text-primary-600"
                                        />
                                    </button>
                                </div>
                            </UFormField>

                            <!-- Notes -->
                            <UFormField label="Notas del Pedido (Opcional)" name="notes">
                                <UTextarea 
                                    v-model="state.notes" 
                                    placeholder="Instrucciones especiales para tu pedido..."
                                    :rows="3"
                                />
                            </UFormField>

                            <!-- Submit Button -->
                            <div class="pt-4">
                                <UButton 
                                    type="submit" 
                                    block 
                                    size="xl"
                                    :loading="loading" 
                                    class="shadow-lg"
                                    icon="i-heroicons-check-circle"
                                >
                                    {{ state.payment_method === 'online' ? 'Continuar al Pago' : 'Confirmar Pedido' }}
                                </UButton>
                            </div>
                        </UForm>
                    </UCard>
                </div>

                <!-- Order Summary - Sticky Sidebar -->
                <div class="lg:col-span-1">
                    <div class="sticky top-24">
                        <UCard class="shadow-xl border-0">
                            <template #header>
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <UIcon name="i-heroicons-shopping-bag" class="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 class="text-xl font-bold">Resumen</h3>
                                </div>
                            </template>

                            <div class="space-y-4">
                                <!-- Items List -->
                                <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div 
                                        v-for="item in cart.items" 
                                        :key="item.product.id" 
                                        class="flex justify-between items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                                                    {{ item.quantity }}
                                                </span>
                                                <span class="text-sm font-medium truncate">{{ item.product.name }}</span>
                                            </div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(item.subtotal) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Total -->
                                <div class="border-t-2 border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <div class="flex justify-between items-center">
                                        <span class="text-lg font-bold">Total</span>
                                        <span class="text-2xl font-bold text-primary-600">
                                            {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(cart.total) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Payment Method Preview -->
                                <div v-if="state.payment_method" class="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <div class="flex items-center gap-2 text-sm">
                                        <UIcon :name="paymentMethods.find(m => m.value === state.payment_method)?.icon || 'i-heroicons-credit-card'" class="w-5 h-5 text-blue-600" />
                                        <span class="text-blue-900 dark:text-blue-100 font-medium">
                                            {{ paymentMethods.find(m => m.value === state.payment_method)?.label }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </UCard>

                        <!-- Security Badge -->
                        <div class="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-green-600 flex-shrink-0" />
                                <div class="text-xs text-green-800 dark:text-green-200">
                                    <p class="font-semibold">Compra Segura</p>
                                    <p class="opacity-90">Tus datos están protegidos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UContainer>
    </div>
</template>
