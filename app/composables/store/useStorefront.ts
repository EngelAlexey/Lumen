import type { Business, Product } from '~/types/database.types'

interface StoreSettings {
    id: string
    business_id: string
    store_name: string | null
    store_description: string | null
    slug: string
    logo_url: string | null
    banner_url: string | null
    primary_color: string
    secondary_color: string
    is_enabled: boolean
    show_prices: boolean
    allow_orders: boolean
    contact_phone: string | null
    contact_email: string | null
    contact_whatsapp: string | null
    business_hours: string | null
    facebook_url: string | null
    instagram_url: string | null
}

export const useStorefront = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    const currentStore = ref<Business | null>(null)
    const storeSettings = ref<StoreSettings | null>(null)
    const products = ref<Product[]>([])

    const fetchStore = async (slug: string) => {
        try {
            loading.value = true
            error.value = null

            // Fetch business data
            const businessData = await $fetch<Business>(`/api/store/${slug}`)
            currentStore.value = businessData

            // Fetch store settings
            try {
                const settingsData = await $fetch<{ data: StoreSettings }>(`/api/store/${slug}/settings`)
                storeSettings.value = settingsData.data
            } catch (settingsError) {
                // Settings are optional, continue if not found
                console.warn('Store settings not found, using defaults')
            }

            return { success: true, data: businessData }
        } catch (e: any) {
            error.value = e.statusMessage || 'Tienda no encontrada'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

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

    const clearStore = () => {
        currentStore.value = null
        storeSettings.value = null
        products.value = []
        error.value = null
    }

    return {
        loading,
        error,
        currentStore,
        storeSettings,
        products,
        fetchStore,
        fetchProducts,
        clearStore
    }
}
