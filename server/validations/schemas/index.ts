import { z } from 'zod'

// Transaction Schemas
export const transactionItemSchema = z.object({
    product_id: z.string().uuid('ID de producto inválido'),
    quantity: z.number().positive('La cantidad debe ser mayor a 0'),
    unit_price: z.number().nonnegative('El precio no puede ser negativo'),
    discount: z.number().nonnegative('El descuento no puede ser negativo').optional().default(0)
})

export const createTransactionSchema = z.object({
    cashSessionId: z.string().uuid().optional().nullable(),
    paymentMethodId: z.string().uuid().optional().nullable(),
    items: z.array(transactionItemSchema).min(1, 'Debe incluir al menos un producto'),
    customerName: z.string().optional(),
    tableNumber: z.string().optional(),
    notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
    paymentReference: z.string().optional(),
    status: z.enum(['pending', 'paid']).optional().default('paid'),
    customerId: z.string().uuid().optional(),
    deliveryStatus: z.enum(['pending', 'preparing', 'ready', 'in_route', 'delivered', 'cancelled']).optional().default('delivered'),
    paymentMethod: z.enum(['cash', 'card_manual', 'stripe_checkout', 'transfer', 'other']).optional().default('cash'),
    source: z.enum(['pos', 'online_store']).optional().default('pos')
})

export const updateTransactionStatusSchema = z.object({
    transactionId: z.string().uuid('ID de transacción inválido'),
    status: z.enum(['pending', 'delivered', 'paid', 'cancelled'])
})

export const payTransactionSchema = z.object({
    transactionId: z.string().uuid('ID de transacción inválido'),
    paymentMethodId: z.string().uuid('ID de método de pago inválido'),
    paymentReference: z.string().optional()
})

// Product Schemas
export const createProductSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    price: z.number().nonnegative('El precio no puede ser negativo'),
    cost: z.number().nonnegative('El costo no puede ser negativo').optional(),
    stock: z.number().int().nonnegative('El stock no puede ser negativo').optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    description: z.string().max(1000).optional(),
    image_url: z.string().url('URL de imagen inválida').optional()
})

export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().uuid('ID de producto inválido')
})

// Customer Schemas
export const createCustomerSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().regex(/^\d{8,15}$/, 'Teléfono inválido').optional(),
    email: z.string().email('Email inválido').optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional()
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
    id: z.string().uuid('ID de cliente inválido')
})

// User Schemas
export const createUserSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['owner', 'admin', 'employee']),
    status: z.enum(['active', 'inactive']).optional().default('active')
})

export const updateUserSchema = z.object({
    id: z.string().uuid('ID de usuario inválido'),
    full_name: z.string().min(2).optional(),
    role: z.enum(['owner', 'admin', 'employee']).optional(),
    status: z.enum(['active', 'inactive']).optional()
})

// Authentication Schemas
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
})

export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
    businessType: z.enum(['retail', 'restaurant', 'services', 'other']).optional().default('retail'),
    selectedPlan: z.enum(['solo', 'startup', 'organization']).optional().default('solo')
})

// Payment Schemas
export const createSubscriptionSchema = z.object({
    plan: z.enum(['solo', 'startup', 'organization']),
    userId: z.string().uuid().optional()
})

// Type exports
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>
export type PayTransactionInput = z.infer<typeof payTransactionSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

// ==================== Store Settings Schemas ====================
export const storeSettingsSchema = z.object({
    store_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres').optional(),
    store_description: z.string().max(500, 'Máximo 500 caracteres').optional(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
    secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
    is_enabled: z.boolean().optional(),
    show_prices: z.boolean().optional(),
    allow_orders: z.boolean().optional(),
    contact_phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
    contact_email: z.string().email('Email inválido').optional(),
    contact_whatsapp: z.string().max(20, 'Máximo 20 caracteres').optional(),
    business_hours: z.string().max(500, 'Máximo 500 caracteres').optional(),
    facebook_url: z.string()
        .transform(val => {
            if (!val || val === '') return ''
            // Add https:// if no protocol is present
            if (!val.startsWith('http://') && !val.startsWith('https://')) {
                return `https://${val}`
            }
            return val
        })
        .pipe(z.string().url('URL inválida').or(z.literal('')))
        .optional()
        .nullable(),
    instagram_url: z.string()
        .transform(val => {
            if (!val || val === '') return ''
            // Add https:// if no protocol is present
            if (!val.startsWith('http://') && !val.startsWith('https://')) {
                return `https://${val}`
            }
            return val
        })
        .pipe(z.string().url('URL inválida').or(z.literal('')))
        .optional()
        .nullable()
})

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>

