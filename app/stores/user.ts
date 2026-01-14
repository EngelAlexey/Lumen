import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    // State
    const profile = ref<any>(null)
    const business = ref<any>(null)
    const loading = ref(false)
    const initialized = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isready = computed(() => initialized.value && !loading.value && !error.value)
    const hasBusiness = computed(() => !!business.value)
    const businessType = computed(() => business.value?.business_type)

    // Actions
    const fetchProfile = async () => {
        try {
            loading.value = true
            error.value = null // Clear previous errors

            const { user: userProfile, business: userBusiness } = await $fetch<{ user: any, business: any }>('/api/auth/session', {
                headers: useRequestHeaders(['cookie'])
            })

            profile.value = userProfile
            business.value = userBusiness || null

        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
            initialized.value = true
        }
    }

    const initialize = async () => {
        if ((initialized.value && !error.value) || loading.value) return
        await fetchProfile()
        initRealtime()
    }

    const clear = () => {
        profile.value = null
        business.value = null
        initialized.value = false
        error.value = null
    }

    // Realtime Subscriptions
    let profileSub: any = null
    let businessSub: any = null

    const initRealtime = () => {
        if (profileSub) return // Already subscribed

        // Watch (User Profile Changes)
        profileSub = supabase
            .channel('public:users')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${user.value?.id}`
            }, (payload) => {
                profile.value = { ...profile.value, ...payload.new }

                if (payload.old && payload.new.business_id !== payload.old.business_id) {
                    fetchProfile()
                }
            })
            .subscribe()

        watch(business, (newBiz) => {
            if (newBiz?.id && !businessSub) {
                businessSub = supabase
                    .channel(`public:businesses:${newBiz.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'businesses',
                        filter: `id=eq.${newBiz.id}`
                    }, (payload) => {
                        business.value = { ...business.value, ...payload.new }
                    })
                    .subscribe()
            }
        }, { immediate: true })
    }

    watch(user, async (newUser, oldUser) => {
        if (newUser?.id !== oldUser?.id) {
            if (newUser) {
                await fetchProfile()
            } else {
                clear()
            }
        }
    })

    return {
        user,
        profile,
        business,
        loading,
        initialized,
        error,
        isready,
        hasBusiness,
        businessType,
        fetchProfile,
        initialize,
        clear
    }
})
