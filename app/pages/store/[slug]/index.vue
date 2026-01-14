<script setup lang="ts">
import { useStorefront } from '~/composables/useStorefront'

definePageMeta({
    layout: 'store',
})

const route = useRoute()
const slug = route.params.slug as string
const { fetchStore, fetchProducts, currentStore, products, loading, error } = useStorefront()
const cart = useCart()

const showToast = ref(false)

// Initialize Store
onMounted(async () => {
    const storeResult = await fetchStore(slug)
    if (storeResult.success && storeResult.data?.id) {
        await fetchProducts(storeResult.data.id)
    }
})

function addToCart(product: any) {
    cart.addItem(product, 1)
    
    // Simple visual feedback
    const toast = useToast()
    toast.add({
        title: 'Producto agregado',
        description: `${product.name} agregado al carrito.`,
        color: 'success',
        icon: 'i-heroicons-shopping-bag',
        timeout: 2000
    } as any)
}
</script>

<template>
    <div class="py-8">
        <UContainer>
            <!-- Loading State -->
             <div v-if="loading && !currentStore" class="flex justify-center py-20">
                <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-20">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tienda no disponible</h2>
                <p class="text-gray-500">{{ error }}</p>
                <UButton to="/" color="neutral" variant="ghost" class="mt-4">Volver al inicio</UButton>
            </div>

            <!-- Store Content -->
            <div v-else-if="currentStore">
                 <!-- Hero / Welcome -->
                <div class="text-center mb-12 animate-fade-in">
                    <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {{ currentStore.name }}
                    </h1>
                     <p class="text-lg text-gray-500 max-w-2xl mx-auto">
                        Bienvenido a nuestra tienda en línea. Explora nuestros productos y haz tu pedido fácilmente.
                    </p>
                </div>

                <!-- Products Grid -->
                <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div 
                        v-for="product in products" 
                        :key="product.id"
                        class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col group"
                    >
                        <!-- Product Image -->
                        <div class="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden group">
                            <img 
                                v-if="product.image_url" 
                                :src="product.image_url" 
                                :alt="product.name"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                                <UIcon name="i-heroicons-photo" class="w-12 h-12" />
                            </div>
                            <!-- Overlay Button -->
                             <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
                                 <UButton 
                                    block 
                                    color="neutral" 
                                    variant="solid" 
                                    class="text-gray-900 font-bold"
                                    @click="addToCart(product)"
                                >
                                    Agregar al Carrito
                                 </UButton>
                             </div>
                        </div>

                        <div class="p-4 flex-grow flex flex-col">
                            <div class="mb-2">
                                <h3 class="font-bold text-gray-900 dark:text-white line-clamp-1" :title="product.name">
                                    {{ product.name }}
                                </h3>
                                <p class="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[2.5em]">
                                    {{ product.description || 'Sin descripción' }}
                                </p>
                            </div>
                            
                            <div class="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                                    {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(product.price) }}
                                </span>
                                <UButton 
                                    icon="i-heroicons-plus"
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    class="md:hidden"
                                    @click="addToCart(product)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty Products -->
                <div v-else class="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800">
                    <UIcon name="i-heroicons-archive-box" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Catálogo vacío</h3>
                    <p class="text-gray-500">Este negocio aún no tiene productos disponibles.</p>
                </div>
            </div>
        </UContainer>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
