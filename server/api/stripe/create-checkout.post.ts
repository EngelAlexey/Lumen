import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-01-27' as any,
    })

    // 1. Get current user from Supabase
    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    // 2. Get request body (plan info)
    const body = await readBody(event)
    const { plan } = body

    // Map plan names to your Stripe Price IDs (User should replace these)
    const priceMap: Record<string, string> = {
        'solo': 'price_placeholder_solo',
        'startup': 'price_placeholder_startup',
        'organization': 'price_placeholder_organization'
    }

    const priceId = priceMap[plan.toLowerCase()]
    if (!priceId) {
        throw createError({
            statusCode: 400,
            message: 'Invalid plan selected'
        })
    }

    // 3. Get or create Stripe Customer
    // Here we would ideally check the database for an existing stripe_customer_id
    const supabase = await serverSupabaseClient(event) as any
    const { data: business } = await supabase
        .from('businesses')
        .select('stripe_customer_id, name')
        .eq('owner_id', user.id)
        .single() as { data: any, error: any }

    let customerId = business?.stripe_customer_id

    if (!customerId) {
        const full_name = user.user_metadata?.full_name || user.email
        const customer = await stripe.customers.create({
            email: user.email,
            name: full_name,
            metadata: {
                supabase_user_id: user.id
            }
        })
        customerId = customer.id

        // Save customer ID back to database
        await supabase
            .from('businesses')
            .update({ stripe_customer_id: customerId })
            .eq('owner_id', user.id)
    }

    // 4. Create Checkout Session
    try {
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
            subscription_data: {
                trial_period_days: 14,
                metadata: {
                    plan: plan,
                    supabase_user_id: user.id
                }
            },
            success_url: `${config.public.siteUrl}/dashboard?success=true`,
            cancel_url: `${config.public.siteUrl}/pricing?canceled=true`,
        })

        return { url: session.url }
    } catch (error: any) {
        console.error('Stripe session creation error:', error)
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})
