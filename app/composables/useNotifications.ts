export interface Notification {
    id: string
    user_id: string
    business_id: string
    type: 'transaction_paid' | 'transaction_created' | 'user_action' | 'system'
    title: string
    message: string
    data?: any
    read: boolean
    created_at: string
}


// Global state to track subscription status
const isSubscribed = ref(false)
let realtimeChannel: any = null

export const useNotifications = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()
    const { profile } = useAuth()

    const notifications = useState<Notification[]>('notifications', () => [])
    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
    const loading = useState('notifications_loading', () => false)

    // Fetch notifications from database
    const fetchNotifications = async () => {
        if (!user.value?.id || !profile.value?.business_id) return

        loading.value = true
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('business_id', profile.value.business_id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!error && data) {
                // Merge new notifications avoiding duplicates
                const existingIds = new Set(notifications.value.map(n => n.id))
                const newNotifs = data.filter((n: any) => !existingIds.has(n.id))
                notifications.value = [...newNotifs, ...notifications.value].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            }
        } catch (e) {
            console.error('Error fetching notifications:', e)
        } finally {
            loading.value = false
        }
    }

    // Add a new notification (in-memory & UI update)
    const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        // Check if already exists to prevent duplication
        const exists = notifications.value.some(n =>
            n.type === notification.type &&
            n.data?.transaction_id === notification.data?.transaction_id &&
            // Simple debounce: avoid duplicate within last 5 seconds
            (new Date().getTime() - new Date(n.created_at).getTime() < 5000)
        )

        if (exists) return

        const newNotif: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            created_at: new Date().toISOString()
        }
        notifications.value.unshift(newNotif)

        // Show Toast
        const toast = useToast()
        toast.add({
            title: notification.title,
            description: notification.message,
            color: 'success',
            icon: 'i-heroicons-check-circle'
        })
    }

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        // Optimistic update
        const notif = notifications.value.find(n => n.id === notificationId)
        if (notif) notif.read = true

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        if (error) {
            // Revert if failed
            if (notif) notif.read = false
        }
    }

    // Mark all as read
    const markAllAsRead = async () => {
        if (!profile.value?.business_id) return

        const unreadIds = notifications.value.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        // Optimistic update
        notifications.value.forEach(n => n.read = true)

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('business_id', profile.value.business_id)
            .eq('read', false)

        if (error) {
            // Revert logic is complex here, generally okay to leave as read in UI until refresh
            console.error('Error marking all read:', error)
        }
    }

    // Initialize Subscription
    const initSubscription = () => {
        if (isSubscribed.value || !profile.value?.business_id) return

        // Cleanup existing channel if any (safety)
        if (realtimeChannel) supabase.removeChannel(realtimeChannel)

        console.log('[Notifications] Initializing Realtime Subscription...')

        realtimeChannel = supabase
            .channel('app-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'transactions',
                    filter: `business_id=eq.${profile.value.business_id}`
                },
                async (payload: any) => {
                    console.log('[Notifications] Transaction Realtime Event:', payload)

                    // Transaction Paid
                    if (payload.new.status === 'paid' && payload.old.status === 'pending') {
                        // Fetch partial details needed for notification
                        const { data: transaction } = await supabase
                            .from('transactions')
                            .select('transaction_number, transaction_items(product:products(name))')
                            .eq('id', payload.new.id)
                            .single()

                        if (transaction) {
                            const productNames = transaction.transaction_items
                                ?.map((item: any) => item.product?.name)
                                .filter(Boolean)
                                .join(', ') || 'Productos varios'

                            addNotification({
                                user_id: user.value!.id,
                                business_id: profile.value!.business_id,
                                type: 'transaction_paid',
                                title: '¡Pago Recibido!',
                                message: `Venta #${transaction.transaction_number} pagada. ${productNames}`,
                                data: { transaction_id: payload.new.id }
                            })
                        }
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    isSubscribed.value = true
                    console.log('[Notifications] Subscribed successfully')
                }
            })
    }

    // Public method to start listening
    const subscribe = () => {
        if (!isSubscribed.value) {
            fetchNotifications()
            initSubscription()
        }
    }

    // Setup watcher to init when profile loads
    watch(() => profile.value?.business_id, (newId) => {
        if (newId) {
            subscribe()
        }
    }, { immediate: true })

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        subscribe // Expose subscribe explicitly
    }
}
