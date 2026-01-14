import type { z } from 'zod'

/**
 * Generic error handler for composables
 * Translates common Supabase and API errors to Spanish
 */
export function useErrorHandler() {
    const translateError = (error: unknown): string => {
        if (!error) return 'Error desconocido'

        const errorMessage = error instanceof Error ? error.message : String(error)

        // Supabase auth errors
        if (errorMessage.includes('Invalid login credentials')) {
            return 'Credenciales incorrectas'
        }
        if (errorMessage.includes('Email not confirmed')) {
            return 'Por favor confirma tu correo electrónico'
        }
        if (errorMessage.includes('User already registered')) {
            return 'Este correo ya está registrado'
        }
        if (errorMessage.includes('Invalid email')) {
            return 'Correo electrónico inválido'
        }

        // Supabase database errors
        if (errorMessage.includes('duplicate key value')) {
            return 'Este registro ya existe'
        }
        if (errorMessage.includes('violates foreign key constraint')) {
            return 'Referencia inválida en la base de datos'
        }
        if (errorMessage.includes('Permission denied')) {
            return 'No tienes permisos para realizar esta acción'
        }

        // Stripe errors
        if (errorMessage.includes('card_declined')) {
            return 'Tarjeta rechazada'
        }
        if (errorMessage.includes('insufficient_funds')) {
            return 'Fondos insuficientes'
        }
        if (errorMessage.includes('payment_intent')) {
            return 'Error al procesar el pago'
        }

        // Network errors
        if (errorMessage.includes('fetch failed') || errorMessage.includes('NetworkError')) {
            return 'Error de conexión. Verifica tu internet'
        }

        // Return original message if no translation found
        return errorMessage
    }

    const handleError = (error: unknown, fallbackMessage = 'Ha ocurrido un error'): string => {
        console.error('[ErrorHandler]', error)
        const translatedError = translateError(error)
        return translatedError || fallbackMessage
    }

    const handleZodError = (error: z.ZodError): string => {
        const firstError = error.issues[0]
        return firstError?.message || 'Datos inválidos'
    }

    return {
        translateError,
        handleError,
        handleZodError
    }
}
