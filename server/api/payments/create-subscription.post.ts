import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { Database } from '../../../app/types/database.types'
import { useOnvo } from '../../utils/onvo'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('[CreateSubscription] Request Body:', body) // Debug
    const { plan, priceId, billingCycleAnchor } = body

    const authUser = await serverSupabaseUser(event).catch(() => null)
    let userId = authUser?.id

    // Fallback: Check if passed in body (ONLY for immediate registration flow trusted environment) 
    if (!userId && (body as any).userId) {
        console.log('[CreateSubscription] Using body userId (Fallback):', (body as any).userId)
        userId = (body as any).userId
    }

    if (!userId) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized: User ID is required'
        })
    }

    const config = useRuntimeConfig()
    const client = serverSupabaseServiceRole<Database>(event)
    const onvo = useOnvo()

    // 1. Get User/Business details (Updated to use Users table for subscription info)
    const { data: userResult, error: userError } = await client
        .from('users')
        .select('id, email, full_name, onvo_customer_id, onvo_subscription_id, business_id')
        .eq('id', userId)
        .single()

    const user = userResult as any

    if (userError || !user) {
        throw createError({
            statusCode: 404,
            message: 'User profile not found'
        })
    }

    // Check business just for name/context if needed
    const { data: business } = await client
        .from('businesses')
        .select('name')
        .eq('id', user.business_id)
        .single()

    const accountName = (business as any)?.name || user.full_name || 'Lumen Customer'

    // 2. Ensure Onvo Customer Exists
    let onvoCustomerId = (user as any).onvo_customer_id

    if (!onvoCustomerId) {
        try {
            console.log('[CreateSubscription] Creating Onvo customer for:', user.email)
            const customer = await onvo.createCustomer({
                name: accountName,
                email: user.email || '',
            })
            onvoCustomerId = customer.id

            // Save to DB (Users Table)
            await (client.from('users') as any)
                .update({ onvo_customer_id: onvoCustomerId })
                .eq('id', userId)

        } catch (e) {
            console.error('[CreateSubscription] Failed to create customer:', e)
            throw createError({ statusCode: 500, message: 'Failed to register customer with payment provider' })
        }
    }

    // 3. Create Subscription
    try {
        // Handle FREE plan (Solo) internally
        if (plan === 'solo') {
            console.log('[CreateSubscription] Activating free plan internally for:', accountName)

            await (client.from('users') as any)
                .update({
                    subscription_plan: 'solo',
                    subscription_status: 'active',
                    onvo_subscription_id: 'internal_free'
                })
                .eq('id', userId)

            return {
                success: true,
                url: null // Frontend should handle redirect to dashboard
            }
        }

        console.log('[CreateSubscription] Creating subscription for customer:', onvoCustomerId)
        // Use configured price ID for Startup plan
        const startupPriceId = config.onvoPriceStartup as string

        let items = []
        if (plan === 'startup' && startupPriceId) {
            items.push({
                priceId: startupPriceId,
                quantity: 1
            })
        } else {
            // Fallback for legacy or unknown plans
            const amount = plan === 'startup' ? 2900 : 1000
            items.push({
                unitAmount: amount,
                currency: 'USD',
                quantity: 1
            })
        }

        // Use createCheckoutLink for the initial subscription setup (Hosted Page)
        const checkoutSession = await onvo.createCheckoutLink({
            redirectUrl: `${config.public.siteUrl}/payment/success`,
            cancelUrl: `${config.public.siteUrl}/payment/processing?error=cancelled`,
            customerEmail: user.email,
            customerName: accountName,
            lineItems: items,
            metadata: {
                supabase_user_id: userId,
                plan: plan
            }
        });

        // Update DB (Users Table) - We don't have a subscription ID yet until webhook returns
        await (client.from('users') as any)
            .update({
                subscription_plan: plan // Persist plan intent
            })
            .eq('id', userId)

        return {
            success: true,
            url: checkoutSession.url,
            id: checkoutSession.id
        }

    } catch (error: any) {
        console.error('[CreateSubscription] Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create subscription'
        })
    }
})
