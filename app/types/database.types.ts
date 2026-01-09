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
            businesses: {
                Row: {
                    id: string
                    name: string
                    business_type: string
                    owner_id: string | null
                    phone: string | null
                    address: string | null
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
                    created_at?: string
                    updated_at?: string
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
}