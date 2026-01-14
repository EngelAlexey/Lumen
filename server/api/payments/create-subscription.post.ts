import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { Database, User } from '../../../app/types/database.types'
import { useOnvo } from '../../utils/onvo'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { plan, priceId, billingCycleAnchor } = body

    const authUser = await serverSupabaseUser(event).catch(() => null)
    let userId = authUser?.id

    if (!userId && (body as any).userId) {
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
    const { data: userResult, error: userError } = await client
        .from('users')
        .select('id, email, full_name, onvo_customer_id, onvo_subscription_id, business_id')
        .eq('id', userId)
        .single()

    const user = userResult as User | null

    if (userError || !user) {
        throw createError({
            statusCode: 404,
            message: 'User profile not found'
        })
    }

    let businessName = null
    if (user.business_id) {
        const { data: business } = await client
            .from('businesses')
            .select('name')
            .eq('id', user.business_id)
            .single()

        const businessData = business as { name: string } | null
        businessName = businessData?.name
    }

    const accountName = businessName || user.full_name || 'Lumen Customer'

    let onvoCustomerId = user.onvo_customer_id

    if (!onvoCustomerId) {
        try {
            const customer = await onvo.createCustomer({
                name: accountName,
                email: user.email || '',
            })
            onvoCustomerId = customer.id

            await (client.from('users') as any)
                .update({ onvo_customer_id: onvoCustomerId })
                .eq('id', userId)

        } catch (e) {
            console.error('[CreateSubscription] Failed to create customer:', e)
            throw createError({ statusCode: 500, message: 'Failed to register customer with payment provider' })
        }
    }

    try {
        if (plan === 'solo') {

            await (client.from('users') as any)
                .update({
                    subscription_plan: 'solo',
                    subscription_status: 'active',
                    onvo_subscription_id: 'internal_free'
                })
                .eq('id', userId)

            return {
                success: true,
                url: null
            }
        }

        const startupPriceId = config.onvoPriceStartup as string

        let items = []
        if (plan === 'startup' && startupPriceId) {
            items.push({
                priceId: startupPriceId,
                quantity: 1
            })
        } else {
            const amount = plan === 'startup' ? 2900 : 1000
            items.push({
                unitAmount: amount,
                currency: 'USD',
                quantity: 1
            })
        }

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

        await (client.from('users') as any)
            .update({
                subscription_plan: plan
            })
            .eq('id', userId)

        return {
            success: true,
            url: checkoutSession.url,
            id: checkoutSession.id
        }

    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create subscription'
        })
    }
})
