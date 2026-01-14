import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '../../../app/types/database.types'
import { useOnvo } from '../../utils/onvo'
import { createSubscriptionSchema } from '../../validations/schemas'
import { validateBody, createSuccessResponse, createErrorResponse } from '../../utils/validation'

export default defineEventHandler(async (event) => {
    // Validate request body
    const validatedData = await validateBody(event, createSubscriptionSchema)
    const { plan, userId: bodyUserId } = validatedData

    // Get authenticated user
    const authUser = await serverSupabaseUser(event).catch(() => null)
    const userId = authUser?.id || bodyUserId

    if (!userId) {
        throw createErrorResponse('ID de usuario requerido', 401)
    }

    const config = useRuntimeConfig()
    const client = serverSupabaseServiceRole<Database>(event)
    const onvo = useOnvo()

    // Fetch user profile
    const { data: user, error: userError } = await client
        .from('users')
        .select('id, email, full_name, onvo_customer_id, onvo_subscription_id, business_id')
        .eq('id', userId)
        .single<{
            id: string
            email: string | null
            full_name: string | null
            onvo_customer_id: string | null
            onvo_subscription_id: string | null
            business_id: string | null
        }>()

    if (userError || !user) {
        throw createErrorResponse('Perfil de usuario no encontrado', 404)
    }

    // Get business name for customer account
    let businessName: string | null = null
    if (user.business_id) {
        const { data: business } = await client
            .from('businesses')
            .select('name')
            .eq('id', user.business_id)
            .single<{ name: string }>()

        businessName = business?.name || null
    }

    const accountName = businessName || user.full_name || 'Lumen Customer'

    // Ensure Onvo customer exists
    let onvoCustomerId = user.onvo_customer_id

    if (!onvoCustomerId) {
        try {
            const customer = await onvo.createCustomer({
                name: accountName,
                email: user.email || '',
            })
            onvoCustomerId = customer.id

            await client
                .from('users')
                .update({ onvo_customer_id: onvoCustomerId } as never)
                .eq('id', userId)

        } catch (error) {
            console.error('[CreateSubscription] Failed to create customer:', error)
            throw createErrorResponse('Error al registrar cliente con el proveedor de pagos', 500)
        }
    }

    try {
        // Handle free Solo plan
        if (plan === 'solo') {
            await client
                .from('users')
                .update({
                    subscription_plan: 'solo',
                    subscription_status: 'active',
                    onvo_subscription_id: 'internal_free'
                } as never)
                .eq('id', userId)

            return createSuccessResponse(
                { url: null },
                'Plan Solo activado exitosamente'
            )
        }

        // Create checkout session for paid plans
        const startupPriceId = config.onvoPriceStartup as string

        const items = []
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
            customerEmail: user.email || undefined,
            customerName: accountName,
            lineItems: items,
            metadata: {
                supabase_user_id: userId,
                plan: plan
            }
        })

        // Update user's selected plan
        await client
            .from('users')
            .update({ subscription_plan: plan } as never)
            .eq('id', userId)

        return createSuccessResponse(
            {
                url: checkoutSession.url,
                id: checkoutSession.id
            },
            'Sesión de pago creada exitosamente'
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al crear suscripción'
        throw createErrorResponse(errorMessage, 500)
    }
})
