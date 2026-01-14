// Auth Types
export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    fullName: string
    businessName: string
    businessType?: 'retail' | 'restaurant' | 'services' | 'other'
    selectedPlan?: 'solo' | 'startup' | 'organization'
}

export interface AuthResponse {
    success: boolean
    error?: string
    [key: string]: unknown
}

// User Types
export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: 'owner' | 'admin' | 'employee'
    business_id: string | null
    phone: string | null
    subscription_status?: string | null
    subscription_plan?: string | null
    created_at: string
    updated_at: string
}

export interface CreateUserData {
    full_name: string
    email: string
    password: string
    role: 'owner' | 'admin' | 'employee'
    status?: 'active' | 'inactive'
}

// Business Types
export interface Business {
    id: string
    name: string
    business_type: string
    owner_id: string
    business_config?: BusinessConfig
    created_at: string
    updated_at: string
}

export interface BusinessConfig {
    customizations: {
        features: Record<string, boolean>
        payments: Record<string, boolean>
        transactions: {
            requireCashSession: boolean
        }
    }
}

// Notification Types
export interface Notification {
    id: string
    user_id: string
    business_id: string
    type: 'transaction_paid' | 'transaction_delivered' | 'low_stock' | 'system'
    title: string
    message: string
    data?: Record<string, unknown>
    read: boolean
    created_at: string
}
