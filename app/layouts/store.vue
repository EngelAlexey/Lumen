<script setup lang="ts">
const route = useRoute()
const { currentStore } = useStorefront()
const cart = useCart()

onMounted(() => {
    const _ = cart.items.length
})

</script>

<template>
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans">
        <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <UContainer class="h-16 flex items-center justify-between">
                <div class="flex items-center gap-2">
                   <div class="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                       <UIcon name="i-heroicons-building-storefront" class="w-6 h-6 text-primary-500" />
                   </div>
                   <span class="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[200px]">
                       {{ currentStore?.name || 'Tienda' }}
                   </span>
                </div>

                <div class="flex items-center gap-2">
                    <UButton 
                        icon="i-heroicons-shopping-bag" 
                        color="neutral" 
                        variant="ghost" 
                        :to="`/store/${route.params.slug}/cart`"
                        class="relative"
                    >
                        <UBadge 
                            v-if="cart.itemCount > 0"
                            color="primary" 
                            variant="solid" 
                            class="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] rounded-full"
                        >
                            {{ cart.itemCount }}
                        </UBadge>
                    </UButton>
                </div>
            </UContainer>
        </header>

        <main class="flex-grow">
            <slot />
        </main>
        <footer v-if="currentStore" class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 mt-auto">
            <UContainer>
                <div class="test-center md:text-left grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white mb-2">{{ currentStore.name }}</h3>
                        <p class="text-sm text-gray-500 max-w-xs">{{ currentStore.address || 'Ubicación no disponible' }}</p>
                    </div>
                    <div class="text-center md:text-right text-sm text-gray-500">
                         <p>Powered by <span class="font-bold text-primary-500">Lumen</span></p>
                    </div>
                </div>
            </UContainer>
        </footer>
    </div>
</template>
