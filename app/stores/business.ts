import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Business = Database['public']['Tables']['businesses']['Row']

export const useBusinessStore = defineStore('business', () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    // State
    const userProfile = ref<User | null>(null)
    const business = ref<Business | null>(null)
    const subscriptionStatus = ref<string | null>(null)
    const stripeSubscriptionId = ref<string | null>(null)
    const initialized = ref(false)
    const loading = ref(false)
    const debugMsg = ref<string>('') // Debugging helper

    // Actions
    const fetchSessionData = async (forceRefetch = false) => {
        // If already initialized and not forced, return early (Cache Hit)
        if (initialized.value && !forceRefetch && userProfile.value && business.value) {
            return
        }

        // Checking auth user
        if (!user.value?.id) {
            resetState()
            return
        }

        try {
            loading.value = true
            debugMsg.value = 'Fetching...'

            // Fetch everything from server endpoint (Bypasses RLS)
            const response = await $fetch<{ user: User, business: Business | null }>('/api/auth/session')
            const { user, business: businessData } = response

            userProfile.value = user as User

            if (businessData) {
                console.log('[BusinessStore] Business fetched from server:', businessData)
                business.value = businessData as Business
                // Subscription status map
                subscriptionStatus.value = (businessData as any).subscription_status || null
                stripeSubscriptionId.value = (businessData as any).stripe_subscription_id || null

                debugMsg.value = `Success: Active=${subscriptionStatus.value}, ID=${(businessData as any).id}`
            } else {
                console.log('[BusinessStore] No business linked to user.')
                business.value = null
                subscriptionStatus.value = null
                stripeSubscriptionId.value = null
                debugMsg.value = 'Success: Business is NULL'
            }

            // 3. Initialize Security Watchdog (Realtime)
            initWatchdog()

            initialized.value = true

        } catch (error: any) {
            console.error('[BusinessStore] Error fetching session:', error)
            debugMsg.value = `Error: ${error.message || error}`
            // If unauthorized, reset state
            // resetState() 
        } finally {
            loading.value = false
        }
    }

    const initWatchdog = () => {
        if (!user.value?.id) return

        // Subscribe to changes on the users table for this specific user
        supabase
            .channel('security-watchdog')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${user.value.id}`
                },
                async (payload: any) => {
                    console.log('[SecurityWatchdog] User update received:', payload)
                    const newUser = payload.new as User

                    // Check if deactivated
                    // Note: is_active might be null in DB types, treat falsy as inactive if explicit false
                    if (newUser.is_active === false) {
                        console.warn('[SecurityWatchdog] User deactivated! Logging out...')
                        await supabase.auth.signOut()
                        resetState()
                        navigateTo('/login?error=account_disabled')
                    }
                }
            )
            .subscribe()
    }

    const resetState = () => {
        userProfile.value = null
        business.value = null
        subscriptionStatus.value = null
        stripeSubscriptionId.value = null
        initialized.value = false
    }

    // Getters (Computed)
    const isSubscriptionActive = computed(() => {
        const status = subscriptionStatus.value
        return status === 'active' || (status === 'trialing' && !!stripeSubscriptionId.value)
    })

    return {
        // State
        userProfile,
        business,
        subscriptionStatus,
        stripeSubscriptionId,
        initialized,
        loading,

        // Getters
        isSubscriptionActive,

        // Actions
        fetchSessionData,
        resetState,
        initWatchdog
    }
}, {
    persist: true
})
