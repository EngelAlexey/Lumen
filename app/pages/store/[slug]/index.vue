<script setup lang="ts">
import { useStorefront } from '~/composables/store/useStorefront'

definePageMeta({
    layout: 'store',
})

const route = useRoute()
const slug = route.params.slug as string
const { fetchStore, fetchProducts, currentStore, storeSettings, products, loading, error } = useStorefront()
const cart = useCart()

const showToast = ref(false)

// Initialize Store
onMounted(async () => {
    const storeResult = await fetchStore(slug)
    if (storeResult.success && storeResult.data?.id) {
        await fetchProducts(storeResult.data.id)
    }
})

// Apply custom colors as CSS variables
const customStyles = computed(() => {
    if (!storeSettings.value) return {}
    
    return {
        '--store-primary': storeSettings.value.primary_color,
        '--store-secondary': storeSettings.value.secondary_color
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

// SEO Meta Tags
useSeoMeta({
    title: () => storeSettings.value?.store_name || currentStore.value?.name || 'Lumen Store',
    ogTitle: () => storeSettings.value?.store_name || currentStore.value?.name || 'Lumen Store',
    description: () => storeSettings.value?.store_description || `Bienvenido a ${currentStore.value?.name || 'nuestra tienda'}`,
    ogDescription: () => storeSettings.value?.store_description || `Bienvenido a ${currentStore.value?.name || 'nuestra tienda'}`,
    ogImage: () => storeSettings.value?.banner_url || storeSettings.value?.logo_url || '/images/default-store.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <div class="py-8" :style="customStyles">
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
                <!-- Banner -->
                <div v-if="storeSettings?.banner_url" class="mb-8 -mx-4 sm:mx-0">
                    <div class="aspect-[21/5] sm:rounded-2xl overflow-hidden">
                        <img 
                            :src="storeSettings.banner_url" 
                            :alt="`${currentStore.name} Banner`"
                            class="w-full h-full object-cover"
                        />
                    </div>
                </div>

                 <!-- Hero / Welcome -->
                <div class="text-center mb-12 animate-fade-in">
                    <!-- Logo -->
                    <div v-if="storeSettings?.logo_url" class="mb-6 flex justify-center">
                        <img 
                            :src="storeSettings.logo_url" 
                            :alt="`${currentStore.name} Logo`"
                            class="h-24 w-auto object-contain"
                        />
                    </div>

                    <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {{ storeSettings?.store_name || currentStore.name }}
                    </h1>
                     <p class="text-lg text-gray-500 max-w-2xl mx-auto">
                        {{ storeSettings?.store_description || 'Bienvenido a nuestra tienda en línea. Explora nuestros productos y haz tu pedido fácilmente.' }}
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
                                <span v-if="storeSettings?.show_prices !== false" class="text-lg font-bold" :style="{ color: storeSettings?.primary_color || '#4F46E5' }">
                                    {{ new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(product.price) }}
                                </span>
                                <UButton 
                                    v-if="storeSettings?.allow_orders !== false"
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

                <!-- Contact Information Footer -->
                <div v-if="storeSettings && (storeSettings.contact_phone || storeSettings.contact_email || storeSettings.contact_whatsapp || storeSettings.facebook_url || storeSettings.instagram_url)" class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div class="text-center mb-6">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Contáctanos</h3>
                        <p class="text-gray-500">¿Tienes alguna pregunta? Estamos aquí para ayudarte</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <!-- Phone -->
                        <div v-if="storeSettings.contact_phone" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                            <UIcon name="i-heroicons-phone" class="w-6 h-6" :style="{ color: storeSettings.primary_color }" />
                            <span class="font-medium text-gray-900 dark:text-white">Teléfono</span>
                            <a :href="`tel:${storeSettings.contact_phone}`" class="text-gray-600 dark:text-gray-400 hover:underline">
                                {{ storeSettings.contact_phone }}
                            </a>
                        </div>

                        <!-- Email -->
                        <div v-if="storeSettings.contact_email" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                            <UIcon name="i-heroicons-envelope" class="w-6 h-6" :style="{ color: storeSettings.primary_color }" />
                            <span class="font-medium text-gray-900 dark:text-white">Email</span>
                            <a :href="`mailto:${storeSettings.contact_email}`" class="text-gray-600 dark:text-gray-400 hover:underline break-all">
                                {{ storeSettings.contact_email }}
                            </a>
                        </div>

                        <!-- WhatsApp -->
                        <div v-if="storeSettings.contact_whatsapp" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6" :style="{ color: storeSettings.primary_color }" />
                            <span class="font-medium text-gray-900 dark:text-white">WhatsApp</span>
                            <a :href="`https://wa.me/${storeSettings.contact_whatsapp.replace(/[^0-9]/g, '')}`" target="_blank" class="text-gray-600 dark:text-gray-400 hover:underline">
                                {{ storeSettings.contact_whatsapp }}
                            </a>
                        </div>
                    </div>

                    <!-- Social Media -->
                    <div v-if="storeSettings.facebook_url || storeSettings.instagram_url" class="flex justify-center gap-4 mt-8">
                        <a v-if="storeSettings.facebook_url" :href="storeSettings.facebook_url" target="_blank" class="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <UIcon name="i-simple-icons-facebook" class="w-6 h-6" :style="{ color: storeSettings.primary_color }" />
                        </a>
                        <a v-if="storeSettings.instagram_url" :href="storeSettings.instagram_url" target="_blank" class="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <UIcon name="i-simple-icons-instagram" class="w-6 h-6" :style="{ color: storeSettings.primary_color }" />
                        </a>
                    </div>

                    <!-- Business Hours -->
                    <div v-if="storeSettings.business_hours" class="text-center mt-6 text-sm text-gray-500">
                        <p class="font-medium text-gray-700 dark:text-gray-300 mb-1">Horario de Atención</p>
                        <p class="whitespace-pre-line">{{ storeSettings.business_hours }}</p>
                    </div>
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
