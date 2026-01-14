/**
 * Common validation utilities
 */

/**
 * Validate Costa Rican phone number
 */
export function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 8 || (cleaned.length === 11 && cleaned.startsWith('506'))
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate Costa Rican ID (Cédula)
 */
export function isValidCedula(cedula: string): boolean {
    const cleaned = cedula.replace(/\D/g, '')
    return cleaned.length === 9
}

/**
 * Sanitize string input (remove special characters)
 */
export function sanitizeString(input: string): string {
    return input.replace(/[<>\"']/g, '')
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0 && !isNaN(value)
}
