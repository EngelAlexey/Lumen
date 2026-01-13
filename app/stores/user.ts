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
        // REMOVED: Early return if !user.value?.id. 
        // We trust the server-side session check (cookie) to handle auth validation.
        // This avoids race conditions where useSupabaseUser() is not yet ready on the client.

        try {
            loading.value = true
            error.value = null // Clear previous errors

            const { user: userProfile, business: userBusiness } = await $fetch<{ user: any, business: any }>('/api/auth/session', {
                headers: useRequestHeaders(['cookie'])
            })

            console.log('[UserStore] Session API returned:', { hasUser: !!userProfile, hasBusiness: !!userBusiness })

            profile.value = userProfile
            business.value = userBusiness || null

            if (!business.value) {
                console.warn('[UserStore] Business is null after fetch. User Profile:', userProfile?.id)
            }

        } catch (e: any) {
            console.error('[UserStore] Initial fetch error:', e)
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
                console.log('[UserStore] Profile updated realtime:', payload)
                profile.value = { ...profile.value, ...payload.new }

                // If business_id changed, refetch business
                if (payload.old && payload.new.business_id !== payload.old.business_id) {
                    fetchProfile()
                }
            })
            .subscribe()

        // Watch (Business Changes) - Only if we have a business
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
                        console.log('[UserStore] Business updated realtime:', payload)
                        business.value = { ...business.value, ...payload.new }
                    })
                    .subscribe()
            }
        }, { immediate: true })
    }

    // Watch for Auth changes (Supabase user)
    watch(user, async (newUser, oldUser) => {
        if (newUser?.id !== oldUser?.id) {
            // Only refetch if the user ID has actually changed
            if (newUser) {
                console.log('[UserStore] User changed, fetching profile...', newUser.id)
                await fetchProfile()
            } else {
                console.log('[UserStore] User logged out, clearing store.')
                clear()
            }
        }
    })

    return {
        // State
        user,
        profile,
        business,
        loading,
        initialized,
        error,
        // Getters
        isready,
        hasBusiness,
        businessType,
        // Actions
        fetchProfile,
        initialize,
        clear
    }
})
