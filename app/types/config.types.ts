import { z } from 'zod'

/**
 * Business Type Enum
 * Defines the core business model
 */
export const BusinessTypeSchema = z.enum([
    'retail',      // Physical store with products
    'restaurant',  // Food service with tables
    'pharmacy',    // Medical/pharmaceutical
    'services',    // Service-based (no physical products)
    'online',      // E-commerce only
    'hybrid',      // Physical + Online
    'fashion',     // Clothing/Accessories
    'delivery'     // Distribution/Delivery
])

export type BusinessType = z.infer<typeof BusinessTypeSchema>

/**
 * Business Modules
 * Large features that include pages, routes, and data models
 */
export const BusinessModuleSchema = z.enum([
    'pos',           // Point of Sale (physical)
    'inventory',     // Stock management
    'tables',        // Table management (restaurants)
    'onlineStore',   // E-commerce storefront
    'appointments',  // Calendar/booking
    'prescriptions'  // Medical prescriptions
])

export type BusinessModule = z.infer<typeof BusinessModuleSchema>

/**
 * Complete Business Configuration Schema
 * Stored as JSONB in businesses.business_config
 */
export const BusinessConfigSchema = z.object({
    version: z.string().default('1.0'),
    preset: BusinessTypeSchema,

    customizations: z.object({
        modules: z.object({
            pos: z.boolean(),
            inventory: z.boolean(),
            tables: z.boolean(),
            onlineStore: z.boolean(),
            appointments: z.boolean(),
            prescriptions: z.boolean()
        }),

        features: z.object({
            // POS Features
            cashRegister: z.boolean(),
            barcodeScanner: z.boolean(),

            // Order Features
            pendingOrders: z.boolean(),
            deliveryTracking: z.boolean(),

            // Service Features
            calendarBooking: z.boolean(),

            // Restaurant Features
            kitchenDisplay: z.boolean().optional(),

            // Pharmacy Features
            prescriptionValidation: z.boolean().optional(),
            expiryTracking: z.boolean().optional(),
            batchTracking: z.boolean().optional(),

            // Advanced
            multiLocation: z.boolean().optional(),
            loyaltyProgram: z.boolean().optional()
        }),

        payments: z.object({
            cash: z.boolean(),           // Physical cash
            cardManual: z.boolean(),     // Card terminal (not integrated)
            cardOnline: z.boolean(),     // Onvo/Stripe checkout
            transfer: z.boolean()        // Bank transfer
        }),

        inventory: z.object({
            trackStock: z.boolean(),
            lowStockAlerts: z.boolean(),
            expiryTracking: z.boolean(),
            batchTracking: z.boolean(),
            serialNumbers: z.boolean(),
            variations: z.boolean()      // Size, color, etc.
        }).optional(),

        transactions: z.object({
            requireCashSession: z.boolean(),   // Must have open cash session
            allowAnonymous: z.boolean(),       // Can sell without customer
            requireCustomer: z.boolean(),      // Must have customer data
            defaultStatus: z.enum(['pending', 'paid'])
        }),

        ui: z.object({
            labels: z.object({
                products: z.string(),        // "Productos" | "Menú" | "Servicios"
                transactions: z.string(),    // "Ventas" | "Órdenes" | "Facturación"
                newTransaction: z.string(),  // "Nueva Venta" | "Nueva Orden"
                transactionNumber: z.string(), // "Factura" | "Orden"
                customer: z.string(),         // "Cliente" | "Mesa/Cliente"
                pendingOrders: z.string()    // "Pendientes" | "Cuentas Abiertas"
            }),
            navigation: z.object({
                showTables: z.boolean(),
                showCashRegister: z.boolean(),
                showAppointments: z.boolean(),
                showOnlineStore: z.boolean()
            })
        })
    }),

    metadata: z.object({
        lastModified: z.string(),
        modifiedBy: z.string().optional(),
        notes: z.string().optional()
    }).optional()
})

export type BusinessConfig = z.infer<typeof BusinessConfigSchema>

/**
 * Partial schema for updates
 * Allows updating only specific parts of config
 */
export const BusinessConfigUpdateSchema = BusinessConfigSchema.partial()

/**
 * Product Type Enum
 * Replaces the old is_service boolean
 */
export const ProductTypeSchema = z.enum([
    'physical',  // Physical product with stock
    'service',   // Service (no stock, may require time)
    'digital'    // Digital product (no stock, instant delivery)
])

export type ProductType = z.infer<typeof ProductTypeSchema>

/**
 * Table Status (for restaurants)
 */
export const TableStatusSchema = z.enum([
    'available',
    'occupied',
    'reserved',
    'cleaning'
])

export type TableStatus = z.infer<typeof TableStatusSchema>
