import type { Business, Product } from '~/types/database.types'

export const useStorefront = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    // State for the active store session
    const currentStore = ref<Business | null>(null)
    const products = ref<Product[]>([])

    // 1. Get Business Public Info by Slug
    const fetchStore = async (slug: string) => {
        try {
            loading.value = true
            error.value = null

            // Use our public API endpoint (bypasses RLS for public fields)
            const data = await $fetch<Business>(`/api/store/${slug}`)

            currentStore.value = data
            return { success: true, data }
        } catch (e: any) {

            error.value = e.statusMessage || 'Tienda no encontrada'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    // 2. Get Active Products for the store
    const fetchProducts = async (businessId: string) => {
        try {
            loading.value = true

            const data = await $fetch<Product[]>('/api/store/products', {
                query: { businessId }
            })

            products.value = data || []
            return { success: true, data }
        } catch (e: any) {

            return { success: false, error: e.message }
        } finally {
            loading.value = false
        }
    }

    // Unload store (e.g. leaving the page)
    const clearStore = () => {
        currentStore.value = null
        products.value = []
        error.value = null
    }

    return {
        loading,
        error,
        currentStore,
        products,
        fetchStore,
        fetchProducts,
        clearStore
    }
}
