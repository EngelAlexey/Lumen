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
    const onvoSubscriptionId = ref<string | null>(null)
    const initialized = ref(false)
    const loading = ref(false)
    const debugMsg = ref<string>('') // Debugging helper

    // Actions
    const fetchSessionData = async (forceRefetch = false) => {
        console.log('[BusinessStore] fetchSessionData called. Force:', forceRefetch)
        console.log('[BusinessStore] Current User Ref:', user.value)

        // If already initialized and not forced, return early (Cache Hit)
        if (initialized.value && !forceRefetch && userProfile.value && business.value) {
            console.log('[BusinessStore] Cache hit. Returning.')
            return
        }

        // Checking auth user
        if (!user.value?.id) {
            console.warn('[BusinessStore] No user ID in store ref. Attempting to fetch user...')
            const { data: userData } = await useAsyncData('auth_user_check', () => supabase.auth.getUser())

            if (userData.value?.data?.user) {
                console.log('[BusinessStore] User recovered via auth.getUser()')
                // Manually set internal reference if needed, but we rely on fetching session next
            } else {
                console.warn('[BusinessStore] Still no user. Resetting state.')
                resetState()
                return
            }
        }

        try {
            loading.value = true
            debugMsg.value = 'Fetching...'

            // Fetch everything from server endpoint (Bypasses RLS)
            const response = await $fetch<{ user: User, business: Business | null }>(`/api/auth/session?t=${Date.now()}`)
            const { user, business: businessData } = response

            console.log('[BusinessStore] Raw User Data from API:', user)

            userProfile.value = user as User

            if (businessData) {
                console.log('[BusinessStore] Raw Business Data:', businessData)
                business.value = businessData as Business
            } else {
                console.log('[BusinessStore] No business linked to user.')
                business.value = null
            }

            // Subscription status map (FROM USER TABLE)
            subscriptionStatus.value = userProfile.value?.subscription_status || null
            onvoSubscriptionId.value = userProfile.value?.onvo_subscription_id || null

            console.log('[BusinessStore] SubStatus from User:', subscriptionStatus.value)

            debugMsg.value = `Success: Active=${subscriptionStatus.value}, BusinessID=${business.value?.id}`

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

        // Subscribe to users table for subscription/status changes
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

                    // Update local state
                    userProfile.value = newUser
                    subscriptionStatus.value = newUser.subscription_status || null
                    onvoSubscriptionId.value = newUser.onvo_subscription_id || null

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

        // Subscribe to changes on the businesses table (Just for business data)
        if (business.value?.id) {
            supabase
                .channel('business-watchdog')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'businesses',
                        filter: `id=eq.${business.value.id}`
                    },
                    (payload: any) => {
                        console.log('[BusinessWatchdog] Business update received:', payload)
                        const newBusiness = payload.new as Business
                        business.value = newBusiness
                        // Removed subscription updates from here
                    }
                )
                .subscribe()
        }
    }

    const resetState = () => {
        userProfile.value = null
        business.value = null
        subscriptionStatus.value = null
        onvoSubscriptionId.value = null
        initialized.value = false
    }

    // Getters (Computed)
    const isSubscriptionActive = computed(() => {
        // return true // TEMPORARY BYPASS REMOVED
        const status = subscriptionStatus.value
        // Assume 'solo' plan is always active if status is 'active' or even null? 
        // Better rely on status being 'active' or 'trialing'.
        // If plan is 'solo', it should be 'active'.
        return status === 'active' || status === 'trialing'
    })

    return {
        // State
        userProfile,
        business,
        subscriptionStatus,
        onvoSubscriptionId,
        initialized,
        loading,
        debugMsg,

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
