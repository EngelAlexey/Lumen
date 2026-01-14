<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const { currentStore } = useStorefront()
const cart = useCart()

definePageMeta({
    layout: 'store',
})
</script>

<template>
    <div class="py-12">
        <UContainer>
            <h1 class="text-3xl font-bold mb-8">Tu Carrito</h1>

            <div v-if="cart.isEmpty" class="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl">
                 <UIcon name="i-heroicons-shopping-cart" class="w-16 h-16 text-gray-400 mb-4" />
                 <p class="text-gray-500 text-lg mb-6">Tu carrito está vacío.</p>
                 <UButton :to="`/store/${slug}`" color="primary" variant="solid" size="lg">
                    Ir a comprar
                 </UButton>
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Cart Items List -->
                <div class="lg:col-span-2 space-y-4">
                    <UCard v-for="(item, index) in cart.items" :key="item.product.id">
                        <div class="flex gap-4">
                            <!-- Image -->
                            <div class="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img 
                                    v-if="item.product.image_url" 
                                    :src="item.product.image_url" 
                                    class="w-full h-full object-cover" 
                                />
                                <UIcon v-else name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
                            </div>
                            
                            <!-- Details -->
                            <div class="flex-grow">
                                <div class="flex justify-between items-start">
                                    <h3 class="font-bold text-gray-900 dark:text-white">{{ item.product.name }}</h3>
                                    <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" @click="cart.removeItem(item.product.id)" />
                                </div>
                                <p class="text-sm text-gray-500 mb-2">{{ new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.product.price) }} c/u</p>
                                
                                <div class="flex items-center gap-3">
                                    <UButton 
                                        icon="i-heroicons-minus" 
                                        size="xs" 
                                        color="neutral" 
                                        variant="soft" 
                                        @click="cart.updateQuantity(item.product.id, item.quantity - 1)"
                                        :disabled="item.quantity <= 1" 
                                    />
                                    <span class="font-mono w-8 text-center">{{ item.quantity }}</span>
                                    <UButton 
                                        icon="i-heroicons-plus" 
                                        size="xs" 
                                        color="neutral" 
                                        variant="soft" 
                                        @click="cart.updateQuantity(item.product.id, item.quantity + 1)" 
                                    />
                                </div>
                            </div>

                            <!-- Subtotal -->
                            <div class="text-right font-bold self-end">
                                {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(item.subtotal) }}
                            </div>
                        </div>
                    </UCard>
                </div>

                <!-- Summary -->
                <div class="lg:col-span-1">
                    <UCard>
                        <template #header>
                            <h3 class="font-bold">Resumen del Pedido</h3>
                        </template>

                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Subtotal</span>
                                <span>{{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(cart.subtotal) }}</span>
                            </div>
                             <div class="flex justify-between" v-if="cart.totalDiscount > 0">
                                <span class="text-gray-500">Descuento</span>
                                <span class="text-green-500">- {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(cart.totalDiscount) }}</span>
                            </div>
                            <div class="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(cart.total) }}</span>
                            </div>
                        </div>

                        <template #footer>
                            <UButton block color="primary" size="lg" :to="`/store/${slug}/checkout`">
                                Proceder al Pago
                            </UButton>
                        </template>
                    </UCard>
                </div>
            </div>
        </UContainer>
    </div>
</template>
