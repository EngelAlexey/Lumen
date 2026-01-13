export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            // ===== CASH SESSIONS =====
            cash_sessions: {
                Row: {
                    id: string
                    business_id: string
                    opened_by: string
                    closed_by: string | null
                    opened_at: string
                    closed_at: string | null
                    opening_cash: number
                    closing_cash: number | null
                    expected_cash: number | null
                    cash_difference: number | null
                    status: 'open' | 'closed'
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    opened_by: string
                    closed_by?: string | null
                    opened_at?: string
                    closed_at?: string | null
                    opening_cash: number
                    closing_cash?: number | null
                    expected_cash?: number | null
                    cash_difference?: number | null
                    status?: 'open' | 'closed'
                    notes?: string | null
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['cash_sessions']['Insert']>
            }

            // ===== PAYMENT METHODS =====
            payment_methods: {
                Row: {
                    id: string
                    name: string
                    code: string
                    requires_reference: boolean
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    requires_reference?: boolean
                    is_active?: boolean
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>
            }

            // ===== PRODUCTS =====
            products: {
                Row: {
                    id: string
                    business_id: string | null
                    name: string
                    description: string | null
                    sku: string | null
                    barcode: string | null
                    price: number
                    cost: number | null
                    category: string | null
                    stock_quantity: number | null
                    is_service: boolean | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                    metadata: any | null
                }
                Insert: {
                    id?: string
                    business_id?: string | null
                    name: string
                    description?: string | null
                    sku?: string | null
                    barcode?: string | null
                    price: number
                    cost?: number | null
                    category?: string | null
                    stock_quantity?: number | null
                    is_service?: boolean | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                    metadata?: any | null
                }
                Update: Partial<Database['public']['Tables']['products']['Insert']>
            }

            // ===== TRANSACTIONS =====
            transactions: {
                Row: {
                    id: string
                    business_id: string
                    cash_session_id: string | null
                    transaction_number: string
                    status: 'pending' | 'delivered' | 'paid' | 'cancelled'
                    delivery_status: 'pending' | 'preparing' | 'ready' | 'in_route' | 'delivered' | 'cancelled'
                    payment_method: 'cash' | 'card_manual' | 'stripe_checkout' | 'transfer' | 'other'
                    subtotal: number
                    tax: number
                    discount: number
                    total: number
                    payment_method_id: string | null
                    payment_reference: string | null
                    customer_id: string | null
                    customer_name: string | null
                    customer_phone: string | null
                    table_number: string | null
                    served_by: string | null
                    notes: string | null
                    delivery_date: string | null
                    stripe_checkout_session_id: string | null
                    stripe_payment_intent_id: string | null
                    stripe_payment_url: string | null
                    shipping_address: string | null
                    created_at: string
                    delivered_at: string | null
                    paid_at: string | null
                    cancelled_at: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    cash_session_id?: string | null
                    transaction_number?: string
                    status?: 'pending' | 'delivered' | 'paid' | 'cancelled'
                    delivery_status?: 'pending' | 'preparing' | 'ready' | 'in_route' | 'delivered' | 'cancelled'
                    payment_method?: 'cash' | 'card_manual' | 'stripe_checkout' | 'transfer' | 'other'
                    subtotal?: number
                    tax?: number
                    discount?: number
                    total?: number
                    payment_method_id?: string | null
                    payment_reference?: string | null
                    customer_id?: string | null
                    customer_name?: string | null
                    customer_phone?: string | null
                    table_number?: string | null
                    served_by?: string | null
                    notes?: string | null
                    delivery_date?: string | null
                    stripe_checkout_session_id?: string | null
                    stripe_payment_intent_id?: string | null
                    stripe_payment_url?: string | null
                    shipping_address?: string | null
                    created_at?: string
                    delivered_at?: string | null
                    paid_at?: string | null
                    cancelled_at?: string | null
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['transactions']['Insert']>
            }

            // ===== TRANSACTION ITEMS =====
            transaction_items: {
                Row: {
                    id: string
                    transaction_id: string
                    product_id: string
                    product_name: string
                    quantity: number
                    unit_price: number
                    discount: number
                    subtotal: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    product_id: string
                    product_name: string
                    quantity?: number
                    unit_price: number
                    discount?: number
                    subtotal: number
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['transaction_items']['Insert']>
            }

            // ===== USERS =====
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    role: string | null
                    business_id: string | null
                    is_active: boolean
                    subscription_status?: string
                    onvo_customer_id?: string | null
                    onvo_subscription_id?: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    role?: string | null
                    business_id?: string | null
                    is_active?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: string | null
                    business_id?: string | null
                    created_at?: string
                }
            }

            // ===== BUSINESSES =====
            businesses: {
                Row: {
                    id: string
                    name: string
                    business_type: string
                    owner_id: string | null
                    phone: string | null
                    address: string | null
                    stripe_customer_id: string | null
                    stripe_subscription_id: string | null
                    subscription_status: string | null
                    subscription_plan: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    business_type: string
                    owner_id?: string | null
                    phone?: string | null
                    address?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    subscription_status?: string | null
                    subscription_plan?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    business_type?: string
                    owner_id?: string | null
                    phone?: string | null
                    address?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    subscription_status?: string | null
                    subscription_plan?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }

            // ===== CUSTOMERS =====
            customers: {
                Row: {
                    id: string
                    business_id: string
                    full_name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    full_name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    business_id?: string
                    full_name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
    Views: {
        [_: string]: {
            Row: {
                [key: string]: any
            }
        }
    }
    Functions: {
        create_initial_business: {
            Args: {
                p_name: string
                p_business_type: string
                p_phone?: string
                p_address?: string
            }
            Returns: {
                id: string
                name: string
                business_type: string
                owner_id: string | null
                phone: string | null
                address: string | null
                created_at: string
                updated_at: string
            }
        }
        get_current_user_profile: {
            Args: Record<string, never>
            Returns: {
                id: string
                email: string
                full_name: string
                role: string
                business_id: string
                business_name: string
                business_type: string
                subscription_status?: string
            }
        }
    }
}

export type CashSession = Database['public']['Tables']['cash_sessions']['Row']
export type CashSessionInsert = Database['public']['Tables']['cash_sessions']['Insert']

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type TransactionItemInsert = Database['public']['Tables']['transaction_items']['Insert']

export type User = Database['public']['Tables']['users']['Row']
export type Business = Database['public']['Tables']['businesses']['Row']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']