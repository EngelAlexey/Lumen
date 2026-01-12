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
            console.log(`[Webhook] Attempting to update transaction ${transactionId} to 'paid'`)

            // Safe extraction of Payment Intent ID
            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent as any)?.id || null

            const { data: transaction, error } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    payment_method: 'stripe_checkout',
                    paid_at: new Date().toISOString(),
                    stripe_payment_intent_id: paymentIntentId
                })
                .eq('id', transactionId)
                .select()
                .single()

            if (error) {
                console.error(`❌ [Webhook] Error updating transaction ${transactionId}:`, error)
                console.error(`Supabase details: ${JSON.stringify(error)}`)
            } else if (transaction) {
                console.log(`✅ PAYMENT CHECKOUT: Transacción ${transactionId} marcada como pagada.`)
                console.log(`[Webhook] Transaction data after update:`, transaction)

                // Create Notification
                const { error: notifError } = await supabase.from('notifications').insert({
                    user_id: transaction.served_by, // Notify the waiter/creator
                    business_id: transaction.business_id,
                    type: 'transaction_paid',
                    title: '¡Pago Online Recibido!',
                    message: `Venta #${transaction.transaction_number || transaction.id.slice(0, 8)} pagada vía Stripe.`,
                    data: { transaction_id: transaction.id },
                    read: false
                })

                if (notifError) {
                    console.error(`⚠️ [Webhook] Error creating notification for ${transactionId}:`, notifError)
                }
            } else {
                console.error(`⚠️ [Webhook] Transaction ${transactionId} not found or not updated (Result is null)`)
            }
        }

    } else if (eventType === 'customer.subscription.updated' || eventType === 'customer.subscription.deleted') {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const supabase = serverSupabaseServiceRole(event) as any
        const { data: business, error: findError } = await supabase
            .from('businesses')
            .select('owner_id, stripe_subscription_id')
            .eq('stripe_customer_id', customerId)
            .single()

        if (findError) {
            console.error(`[Webhook] Error finding business for customer ${customerId}:`, findError)
            return { received: true }
        }

        if (business?.owner_id) {
            const status = subscription.status

            if (business.stripe_subscription_id && business.stripe_subscription_id !== subscription.id) {
                console.log(`⚠️ Webhook: Ignorando evento para suscripción ${subscription.id} (DB tiene ${business.stripe_subscription_id})`)
                return { received: true }
            }

            const { error: updateError } = await supabase
                .from('businesses')
                .update({ subscription_status: status })
                .eq('owner_id', business.owner_id)

            if (updateError) {
                console.error(`[Webhook] Error updating subscription status for ${business.owner_id}:`, updateError)
            } else {
                console.log(`🔄 SUBSCRIPTION (${eventType}): Usuario ${business.owner_id} estado actualizado a ${status}`)
            }
        } else {
            console.log(`⚠️ Webhook: No se encontró negocio para customer ${customerId}`)
        }
    } else {
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    return { received: true }
})