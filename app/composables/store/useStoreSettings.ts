import type { Database } from '~/types/database.types'

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
    created_at: string
    updated_at: string
}

export const useStoreSettings = () => {
    const supabase = useSupabaseClient<Database>()
    const userStore = useUserStore()
    const { handleError } = useErrorHandler()
    const toast = useToast()

    const loading = ref(false)
    const uploading = ref(false)
    const settings = ref<StoreSettings | null>(null)

    /**
     * Load store settings for current business
     */
    const loadSettings = async () => {
        try {
            loading.value = true
            const data = await $fetch<StoreSettings>('/api/store/settings')
            settings.value = data
            return { success: true, data }
        } catch (error: any) {
            const errorMessage = handleError(error)
            toast.add({
                title: 'Error al cargar configuración',
                description: errorMessage,
                color: 'error'
            })
            return { success: false, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    /**
     * Update store settings
     */
    const updateSettings = async (updates: Partial<StoreSettings>) => {
        try {
            loading.value = true
            const { data } = await $fetch<{ success: boolean; data: StoreSettings }>('/api/store/settings', {
                method: 'PATCH',
                body: updates
            })

            settings.value = data
            toast.add({
                title: 'Cambios guardados',
                description: 'La configuración se actualizó correctamente',
                color: 'success'
            })
            return { success: true, data }
        } catch (error: any) {
            const errorMessage = handleError(error)
            toast.add({
                title: 'Error al guardar',
                description: errorMessage,
                color: 'error'
            })
            return { success: false, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    /**
     * Upload logo image
     */
    const uploadLogo = async (file: File) => {
        try {
            uploading.value = true
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'logo')

            const result = await $fetch<{ success: boolean; url?: string; error?: string }>('/api/store/upload-image', {
                method: 'POST',
                body: formData
            })

            if (result.success && result.url) {
                // Add cache-busting parameter to force reload
                const urlWithCacheBust = `${result.url}?t=${Date.now()}`
                if (settings.value) {
                    settings.value.logo_url = urlWithCacheBust
                }

                toast.add({
                    title: 'Éxito',
                    description: 'Logo actualizado correctamente',
                    color: 'success'
                })
            }

            return result
        } catch (error: any) {
            toast.add({
                title: 'Error',
                description: error.message || 'Error al subir logo',
                color: 'error'
            })
            return { success: false, error: error.message }
        } finally {
            uploading.value = false
        }
    }

    /**
     * Upload banner image
     */
    const uploadBanner = async (file: File) => {
        try {
            uploading.value = true
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'banner')

            const result = await $fetch<{ success: boolean; url?: string; error?: string }>('/api/store/upload-image', {
                method: 'POST',
                body: formData
            })

            if (result.success && result.url) {
                // Add cache-busting parameter to force reload
                const urlWithCacheBust = `${result.url}?t=${Date.now()}`
                if (settings.value) {
                    settings.value.banner_url = urlWithCacheBust
                }

                toast.add({
                    title: 'Éxito',
                    description: 'Banner actualizado correctamente',
                    color: 'success'
                })
            }

            return result
        } catch (error: any) {
            toast.add({
                title: 'Error',
                description: error.message || 'Error al subir banner',
                color: 'error'
            })
            return { success: false, error: error.message }
        } finally {
            uploading.value = false
        }
    }

    /**
     * Get store public URL
     */
    const getStoreUrl = computed(() => {
        if (!settings.value?.slug) return null
        const config = useRuntimeConfig()
        return `${config.public.siteUrl}/store/${settings.value.slug}`
    })

    return {
        loading,
        uploading,
        settings,
        loadSettings,
        updateSettings,
        uploadLogo,
        uploadBanner,
        getStoreUrl
    }
}
