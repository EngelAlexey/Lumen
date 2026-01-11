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
        const supabaseUserId = session.metadata?.supabase_user_id || session.client_reference_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const plan = session.metadata?.plan

        if (!supabaseUserId) {
            console.log('⚠️ Webhook sin supabase_user_id en metadata. Session ID:', session.id)
            console.log('Full Session Metadata:', session.metadata)
            return { received: true }
        }

        const supabase = serverSupabaseServiceRole(event) as any
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Update Business
        await supabase
            .from('businesses')
            .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: subscription.status,
                plan_type: plan || 'startup'
            })
            .eq('owner_id', supabaseUserId)

        // Update User
        await supabase
            .from('users')
            .update({ subscription_status: subscription.status })
            .eq('id', supabaseUserId)

        console.log(`✅ CHECKOUT: Usuario ${supabaseUserId} suscrito. Estado: ${subscription.status}`)

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

            // Update User
            await supabase
                .from('users')
                .update({ subscription_status: status })
                .eq('id', business.owner_id)

            console.log(`🔄 SUBSCRIPTION (${eventType}): Usuario ${business.owner_id} estado actualizado a ${status}`)
        } else {
            console.log(`⚠️ Webhook: No se encontró negocio para customer ${customerId}`)
        }
    }

    return { received: true }
})