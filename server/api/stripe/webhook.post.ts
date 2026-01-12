import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
    })

    const headers = event.node.req.headers
    const body = await readRawBody(event)
    const sig = headers['stripe-signature']
    const webhookSecret = config.stripeWebhookSecret

    if (!sig || !webhookSecret || !body) {
        throw createError({ statusCode: 400, message: 'Falta firma, secreto o cuerpo' })
    }

    let stripeEvent: Stripe.Event

    try {
        stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
        console.error('Error de firma de Webhook:', err.message)
        throw createError({ statusCode: 400, message: `Webhook Error: ${err.message}` })
    }

    const eventType = stripeEvent.type

    if (eventType === 'checkout.session.completed') {
        const session = stripeEvent.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
            const supabaseUserId = session.metadata?.supabase_user_id || session.client_reference_id
            const customerId = session.customer as string
            const subscriptionId = session.subscription as string
            const plan = session.metadata?.plan

            console.log(`[Webhook] Checkout Session Completed - Mode: subscription`)
            console.log(`[Webhook] Supabase User ID: ${supabaseUserId}`)
            console.log(`[Webhook] Customer ID: ${customerId}`)
            console.log(`[Webhook] Subscription ID: ${subscriptionId}`)

            if (!supabaseUserId) {
                console.log('⚠️ Webhook (Subscription): Sin supabase_user_id en metadata.', session.id)
                return { received: true }
            }

            const supabase = serverSupabaseServiceRole(event) as any
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)

            console.log(`[Webhook] Subscription Status from Stripe: ${subscription.status}`)

            // Update Business
            const { data: updateData, error: updateError } = await supabase
                .from('businesses')
                .update({
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    subscription_status: subscription.status,
                    subscription_plan: plan || 'startup'
                })
                .eq('owner_id', supabaseUserId)
                .select()

            if (updateError) {
                console.error(`[Webhook] Error updating business:`, updateError)
            } else {
                console.log(`[Webhook] Business updated successfully:`, updateData)
            }

            // Update User - REMOVED: Table users does not have subscription_status
            /*
            await supabase
                .from('users')
                .update({ subscription_status: subscription.status })
                .eq('id', supabaseUserId)
            */

            console.log(`✅ SUBSCRIPTION CHECKOUT: Usuario ${supabaseUserId} suscrito. Estado: ${subscription.status}`)

        } else if (session.mode === 'payment') {
            const transactionId = session.metadata?.transaction_id || session.client_reference_id

            if (!transactionId) {
                console.log('⚠️ Webhook (Payment): Sin transaction_id en metadata.', session.id)
                return { received: true }
            }

            const supabase = serverSupabaseServiceRole(event) as any

            // Update Transaction
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    payment_method: 'stripe_checkout',
                    paid_at: new Date().toISOString(),
                    stripe_payment_intent_id: session.payment_intent as string
                })
                .eq('id', transactionId)

            if (error) {
                console.error('❌ Error actualizando transacción:', error)
            } else {
                console.log(`✅ PAYMENT CHECKOUT: Transacción ${transactionId} marcada como pagada.`)
            }
        }

    } else if (eventType === 'customer.subscription.updated' || eventType === 'customer.subscription.deleted') {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find business by stripe_customer_id to get the user/owner
        const supabase = serverSupabaseServiceRole(event) as any
        const { data: business } = await supabase
            .from('businesses')
            .select('owner_id')
            .eq('stripe_customer_id', customerId)
            .single()

        if (business?.owner_id) {
            const status = subscription.status

            // Update Business
            await supabase
                .from('businesses')
                .update({ subscription_status: status })
                .eq('owner_id', business.owner_id)

            // Update User - REMOVED: Table users does not have subscription_status
            /*
            await supabase
                .from('users')
                .update({ subscription_status: status })
                .eq('id', business.owner_id)
            */

            console.log(`🔄 SUBSCRIPTION (${eventType}): Usuario ${business.owner_id} estado actualizado a ${status}`)
        } else {
            console.log(`⚠️ Webhook: No se encontró negocio para customer ${customerId}`)
        }
    }

    return { received: true }
})