/**
 * Centralized status options and mappings
 * Used across the application for consistency
 */

// Transaction Status
export const transactionStatusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pagado', value: 'paid' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Entregado', value: 'delivered' },
    { label: 'Cancelado', value: 'cancelled' }
] as const

export const transactionStatusColors: Record<string, string> = {
    pending: 'warning',
    delivered: 'info',
    paid: 'success',
    cancelled: 'error'
}

export const transactionStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    delivered: 'Entregado',
    paid: 'Pagado',
    cancelled: 'Cancelado'
}

// Delivery Status
export const deliveryStatusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Preparando', value: 'preparing' },
    { label: 'Listo', value: 'ready' },
    { label: 'En Ruta', value: 'in_route' },
    { label: 'Entregado', value: 'delivered' },
    { label: 'Cancelado', value: 'cancelled' }
] as const

export const deliveryStatusColors: Record<string, string> = {
    pending: 'neutral',
    preparing: 'warning',
    ready: 'info',
    in_route: 'primary',
    delivered: 'success',
    cancelled: 'error'
}

// User Status
export const userStatusColors: Record<string, string> = {
    active: 'success',
    inactive: 'neutral'
}

// Payment Methods
export const paymentMethodOptions = [
    { label: 'Efectivo', value: 'cash', icon: 'i-heroicons-banknotes' },
    { label: 'Tarjeta', value: 'card_manual', icon: 'i-heroicons-credit-card' },
    { label: 'Transferencia', value: 'transfer', icon: 'i-heroicons-arrow-path' },
    { label: 'Stripe / Online', value: 'stripe_checkout', icon: 'i-heroicons-globe-alt' },
    { label: 'Otro', value: 'other', icon: 'i-heroicons-ellipsis-horizontal' }
] as const

// Type exports for TypeScript
export type TransactionStatus = 'paid' | 'pending' | 'delivered' | 'cancelled'
export type DeliveryStatus = 'pending' | 'preparing' | 'ready' | 'in_route' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cash' | 'card_manual' | 'transfer' | 'stripe_checkout' | 'other'
