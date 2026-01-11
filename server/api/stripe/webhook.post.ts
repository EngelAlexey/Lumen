import Stripe from 'stripe'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
    })

    const body = await readRawBody(event)
    const sig = getHeader(event, 'stripe-signature')
    const webhookSecret = config.stripeWebhookSecret

    if (!sig || !webhookSecret) {
        throw createError({ statusCode: 400, message: 'Missing signature or webhook secret' })
    }

    let stripeEvent: Stripe.Event

    try {
        stripeEvent = stripe.webhooks.constructEvent(body!, sig, webhookSecret)
    } catch (err: any) {
        throw createError({ statusCode: 400, message: `Webhook Error: ${err.message}` })
    }

    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const transactionId = session.metadata?.transaction_id

        if (transactionId) {
            const supabase = await serverSupabaseClient(event) as any

            // Update transaction to PAID
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    payment_method: 'stripe_checkout',
                    stripe_payment_intent_id: session.payment_intent as string
                })
                .eq('id', transactionId)

            if (error) {
                console.error('Error updating transaction from webhook:', error)
                throw createError({ statusCode: 500, message: 'Database update failed' })
            }
            console.log(`Transaction ${transactionId} marked as PAID via Webhook`)
        }
    }

    return { received: true }
})
