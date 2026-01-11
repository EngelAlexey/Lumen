import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
    })

    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    const userId = user.id || (user as any).sub
    if (!userId) {
        console.error('User found but has no ID:', user)
        throw createError({ statusCode: 500, message: 'User identity missing' })
    }

    const body = await readBody(event)
    const { plan } = body

    const priceMap: Record<string, string> = {
        'solo': config.stripePriceSolo,
        'startup': config.stripePriceStartup,
        // 'organization': 'price_placeholder_organization'
    }

    const priceId = priceMap[plan.toLowerCase()]
    if (!priceId) {
        throw createError({
            statusCode: 400,
            message: 'Invalid plan selected'
        })
    }

    const supabase = await serverSupabaseClient(event) as any
    const { data: business } = await supabase
        .from('businesses')
        .select('stripe_customer_id, name')
        .eq('owner_id', userId)
        .single() as { data: any, error: any }

    let customerId = business?.stripe_customer_id

    if (!customerId) {
        const full_name = user.user_metadata?.full_name || user.email
        const customer = await stripe.customers.create({
            email: user.email,
            name: full_name,
            metadata: {
                supabase_user_id: userId
            }
        })
        customerId = customer.id

        await supabase
            .from('businesses')
            .update({ stripe_customer_id: customerId })
            .eq('owner_id', userId)
    }

    try {
        const metadata = {
            plan: plan,
            supabase_user_id: userId
        }
        console.log('Creating Stripe session for customer:', customerId, 'Plan:', plan)
        console.log('Intended Metadata:', metadata)

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            allow_promotion_codes: true,

            subscription_data: {
                trial_period_days: 14,
            },

            metadata: {
                plan: plan,
                supabase_user_id: userId
            },
            client_reference_id: userId,

            success_url: `${config.public.siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.public.siteUrl}/pricing?canceled=true`,
        })

        console.log('Stripe session created:', session.url)
        return { url: session.url }
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})