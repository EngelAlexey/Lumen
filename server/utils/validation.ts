import { z, ZodError } from 'zod'
import type { H3Event } from 'h3'

/**
 * Validates request body against a Zod schema
 * Returns validated data or throws error with Spanish messages
 */
export async function validateBody<T extends z.ZodTypeAny>(
    event: H3Event,
    schema: T
): Promise<z.infer<T>> {
    try {
        const body = await readBody(event)
        return schema.parse(body)
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0]
            throw createError({
                statusCode: 400,
                statusMessage: 'Datos inválidos',
                message: firstError.message,
                data: error.issues
            })
        }
        throw error
    }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(
    event: H3Event,
    schema: T
): z.infer<T> {
    try {
        const query = getQuery(event)
        return schema.parse(query)
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0]
            throw createError({
                statusCode: 400,
                statusMessage: 'Parámetros inválidos',
                message: firstError.message,
                data: error.issues
            })
        }
        throw error
    }
}

/**
 * Standard error response helper
 */
export function createErrorResponse(message: string, statusCode = 500, data?: unknown) {
    return createError({
        statusCode,
        statusMessage: statusCode === 500 ? 'Error del servidor' : 'Error',
        message,
        data
    })
}

/**
 * Standard success response helper
 */
export function createSuccessResponse<T>(data: T, message?: string) {
    return {
        success: true,
        data,
        ...(message && { message })
    }
}
