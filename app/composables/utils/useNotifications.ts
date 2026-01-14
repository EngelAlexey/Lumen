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


const isSubscribed = ref(false)
let realtimeChannel: any = null

export const useNotifications = () => {
    const supabase = useSupabaseClient<any>()
    const user = useSupabaseUser()
    const { profile } = useAuth()

    const notifications = useState<Notification[]>('notifications', () => [])
    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
    const loading = useState('notifications_loading', () => false)

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
                const existingIds = new Set(notifications.value.map(n => n.id))
                const newNotifs = data.filter((n: any) => !existingIds.has(n.id))
                notifications.value = [...newNotifs, ...notifications.value].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            }
        } catch (e) {

        } finally {
            loading.value = false
        }
    }

    const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        const exists = notifications.value.some(n =>
            n.type === notification.type &&
            n.data?.transaction_id === notification.data?.transaction_id &&
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

        const toast = useToast()
        toast.add({
            title: notification.title,
            description: notification.message,
            color: 'success',
            icon: 'i-heroicons-check-circle'
        })
    }

    const markAsRead = async (notificationId: string) => {
        const notif = notifications.value.find(n => n.id === notificationId)
        if (notif) notif.read = true

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        if (error) {
            if (notif) notif.read = false
        }
    }

    const markAllAsRead = async () => {
        if (!profile.value?.business_id) return

        const unreadIds = notifications.value.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        notifications.value.forEach(n => n.read = true)

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('business_id', profile.value.business_id)
            .eq('read', false)
    }

    const initSubscription = () => {
        if (isSubscribed.value || !profile.value?.business_id) return

        if (realtimeChannel) supabase.removeChannel(realtimeChannel)


        realtimeChannel = supabase
            .channel('app-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `business_id=eq.${profile.value.business_id}`
                },
                (payload: any) => {
                    const newNotif = payload.new as Notification

                    notifications.value.unshift(newNotif)

                    const toast = useToast()
                    toast.add({
                        title: newNotif.title,
                        description: newNotif.message,
                        color: 'success',
                        icon: 'i-heroicons-check-circle'
                    })
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    isSubscribed.value = true
                }
            })
    }

    const subscribe = () => {
        if (!isSubscribed.value) {
            fetchNotifications()
            initSubscription()
        }
    }

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
        subscribe
    }
}
