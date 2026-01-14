import { useOnvo } from '../../utils/onvo'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const onvo = useOnvo()

    try {
        // Hardcoded generic data for testing
        const dummyUser = {
            email: 'test_user@example.com',
            name: 'Test User Generic',
            id: 'test_user_123'
        }

        const items = [{
            unitAmount: 1000, // $10.00
            currency: 'USD',
            quantity: 1,
            description: 'Test Subscription Item'
        }]


        const checkoutSession = await onvo.createCheckoutLink({
            redirectUrl: `${config.public.siteUrl}/payment/success`,
            cancelUrl: `${config.public.siteUrl}/payment/test?error=cancelled`,
            customerEmail: dummyUser.email,
            customerName: dummyUser.name,
            lineItems: items,
            metadata: {
                test_mode: 'true',
                supabase_user_id: dummyUser.id
            }
        })


        return {
            success: true,
            url: checkoutSession.url,
            id: checkoutSession.id
        }

    } catch (error: any) {
        console.error('[TestCheckout] Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create test checkout'
        })
    }
})
