/**
 * Utility functions for formatting data
 * Used across the application for consistent formatting
 */

/**
 * Format a number as Costa Rican currency (Colones)
 */
export function formatCurrency(amount: number, locale: string = 'es-CR'): string {
    return `₡${amount.toLocaleString(locale)}`
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(num: number, locale: string = 'es-CR'): string {
    return num.toLocaleString(locale)
}

/**
 * Format a date to localized string
 */
export function formatDate(date: Date | string, locale: string = 'es-CR', options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }
    return dateObj.toLocaleDateString(locale, options || defaultOptions)
}

/**
 * Format a time to localized string
 */
export function formatTime(date: Date | string, locale: string = 'es-CR'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Format a date and time to localized string
 */
export function formatDateTime(date: Date | string, locale: string = 'es-CR'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Format a relative time (e.g., "2 hours ago", "hace 3 días")
 */
export function formatRelativeTime(date: Date | string, locale: string = 'es-CR'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (locale === 'es-CR' || locale === 'es') {
        if (diffMins < 1) return 'Ahora'
        if (diffMins < 60) return `Hace ${diffMins}m`
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays}d`
    } else {
        if (diffMins < 1) return 'Now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
    }

    return formatDate(dateObj, locale)
}

/**
 * Format payment method enum to human-readable string
 */
export function formatPaymentMethod(method: string | null, t?: (key: string) => string): string {
    if (!method) return '-'

    const map: Record<string, string> = {
        'cash': t ? t('common.payment_methods.cash') : 'Efectivo',
        'card_manual': t ? t('common.payment_methods.card') : 'Tarjeta',
        'stripe_checkout': t ? t('common.payment_methods.stripe') : 'Stripe (Online)',
        'transfer': t ? t('common.payment_methods.transfer') : 'Transferencia',
        'other': t ? t('common.payment_methods.other') : 'Otro'
    }

    return map[method] || method
}

/**
 * Format delivery status enum to human-readable string
 */
export function formatDeliveryStatus(status: string | null, t?: (key: string) => string): string {
    if (!status) return ''

    const map: Record<string, string> = {
        'pending': t ? t('common.delivery_status.pending') : 'Pendiente',
        'preparing': t ? t('common.delivery_status.preparing') : 'Preparando',
        'ready': t ? t('common.delivery_status.ready') : 'Listo',
        'in_route': t ? t('common.delivery_status.in_route') : 'En Ruta',
        'delivered': t ? t('common.delivery_status.delivered') : 'Entregado',
        'cancelled': t ? t('common.delivery_status.cancelled') : 'Cancelado'
    }

    return map[status] || status
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number = 50, suffix: string = '...'): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Format phone number (Costa Rican format)
 */
export function formatPhone(phone: string): string {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')

    // Costa Rican phone: 8888-8888 or +506 8888-8888
    if (digits.length === 8) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`
    }
    if (digits.length === 11 && digits.startsWith('506')) {
        return `+506 ${digits.slice(3, 7)}-${digits.slice(7)}`
    }

    return phone
}
