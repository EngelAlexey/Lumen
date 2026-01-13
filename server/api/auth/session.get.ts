import { serverSupabaseUser, serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    // Check user auth securely
    const client = await serverSupabaseClient<Database>(event)
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
        console.error('[SessionAPI] Auth error:', authError)
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    // Use Service Role for data access (Bypassing RLS)
    const serviceRole = serverSupabaseServiceRole<Database>(event)

    // 1. Fetch User Profile
    const { data: userProfile, error: userError } = await serviceRole
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    console.log('[SessionAPI] User ID:', user.id)

    if (userError || !userProfile) {
        console.error('[SessionAPI] User profile fetch error:', userError)
        throw createError({
            statusCode: 404,
            message: 'User profile not found'
        })
    }

    // Explicitly cast or handle the type. 
    // Assuming database.types is generated correctly, 'users' row should have business_id
    const userWithBusiness = userProfile as { business_id: string | null;[key: string]: any }
    let business = null

    // 2. Fetch Business (if linked)
    if (userWithBusiness.business_id) {
        const { data, error } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('id', userWithBusiness.business_id)
            .single()

        if (error) {
            console.error('[SessionAPI] Business fetch error (ID):', error)
        }
        if (!error && data) {
            console.log('[SessionAPI] Business Found (ID):', (data as any).id)
            business = data
        } else {
            console.warn('[SessionAPI] Linked business not found (Zombie Link). Falling back to Owner ID search...')
            // Fallback: Try to find business by owner_id if linked one is missing
            const { data: fallbackData } = await serviceRole
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            if (fallbackData) {
                console.log('[SessionAPI] Business Found (Owner Fallback):', (fallbackData as any).id)
                business = fallbackData

                // Optional: Self-repair implementation
                await serviceRole.from('users').update({ business_id: (fallbackData as any).id } as any).eq('id', user.id)
            }
        }
    } else {
        console.log('[SessionAPI] Fetching business via Owner ID...')
        // Fallback: Try to find business by owner_id if not linked yet
        const { data, error } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .single()

        if (error) {
            console.error('[SessionAPI] Business fetch error (Owner):', error)
        }

        if (!error && data) {
            console.log('[SessionAPI] Business Found (Owner):', (data as any).id)
            business = data

            // Self-repair: Link it
            await serviceRole.from('users').update({ business_id: (data as any).id } as any).eq('id', user.id)
        }
    }

    if (!business) {
        console.warn('[SessionAPI] NO BUSINESS FOUND for user:', user.id)
    }

    return {
        user: userProfile,
        business
    }
})
