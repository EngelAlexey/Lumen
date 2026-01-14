export const useOptions = () => {
    const { t } = useI18n()

    const roles = computed(() => [
        { label: t('roles.manager'), value: 'manager' },
        { label: t('roles.cashier'), value: 'cashier' },
        { label: t('roles.staff'), value: 'staff' }
    ])

    const roleOptions = computed(() => [
        { label: t('roles.all'), value: 'all' },
        ...roles.value
    ])

    const statusOptions = computed(() => [
        { label: t('status.all'), value: 'all' },
        { label: t('status.active'), value: 'active' },
        { label: t('status.inactive'), value: 'inactive' }
    ])

    const transactionStatusOptions = computed(() => [
        { label: t('status.all'), value: null },
        { label: t('status.transaction.paid'), value: 'paid' },
        { label: t('status.transaction.pending'), value: 'pending' },
        { label: t('status.transaction.delivered'), value: 'delivered' },
        { label: t('status.transaction.cancelled'), value: 'cancelled' }
    ])

    const deliveryStatusOptions = computed(() => [
        { label: t('status.delivery.pending'), value: 'pending' },
        { label: t('status.delivery.preparing'), value: 'preparing' },
        { label: t('status.delivery.ready'), value: 'ready' },
        { label: t('status.delivery.in_route'), value: 'in_route' },
        { label: t('status.delivery.delivered'), value: 'delivered' },
        { label: t('status.delivery.cancelled'), value: 'cancelled' }
    ])

    const paymentMethodOptions = computed(() => [
        { label: t('status.payment_method.cash'), value: 'cash', icon: 'i-heroicons-banknotes' },
        { label: t('status.payment_method.card_manual'), value: 'card_manual', icon: 'i-heroicons-credit-card' },
        { label: t('status.payment_method.transfer'), value: 'transfer', icon: 'i-heroicons-arrow-path' },
        { label: t('status.payment_method.stripe_checkout'), value: 'stripe_checkout', icon: 'i-heroicons-globe-alt' },
        { label: t('status.payment_method.other'), value: 'other', icon: 'i-heroicons-ellipsis-horizontal' }
    ])

    const transactionStatusColors = {
        pending: 'warning',
        delivered: 'info',
        paid: 'success',
        cancelled: 'error'
    }

    const deliveryStatusColors = {
        pending: 'neutral',
        preparing: 'warning',
        ready: 'info',
        in_route: 'primary',
        delivered: 'success',
        cancelled: 'error'
    }

    const userStatusColors = {
        active: 'success',
        inactive: 'neutral'
    }

    const getRoleLabel = (value: string) => {
        if (value === 'owner') return t('roles.owner')
        const found = roles.value.find(r => r.value === value)
        return found?.label || value
    }

    const getStatusLabel = (value: string) => {
        const found = statusOptions.value.find(s => s.value === value)
        return found?.label || value
    }

    const getTransactionStatusLabel = (value: string) => {
        const found = transactionStatusOptions.value.find(s => s.value === value)
        return found?.label || value
    }

    const getDeliveryStatusLabel = (value: string) => {
        const found = deliveryStatusOptions.value.find(s => s.value === value)
        return found?.label || value
    }

    const getPaymentMethodLabel = (value: string) => {
        const found = paymentMethodOptions.value.find(s => s.value === value)
        return found?.label || value
    }

    return {
        roles,
        roleOptions,
        statusOptions,
        transactionStatusOptions,
        deliveryStatusOptions,
        paymentMethodOptions,
        transactionStatusColors,
        deliveryStatusColors,
        userStatusColors,
        getRoleLabel,
        getStatusLabel,
        getTransactionStatusLabel,
        getDeliveryStatusLabel,
        getPaymentMethodLabel
    }
}
