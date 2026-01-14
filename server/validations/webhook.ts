export const validateOnvoEvent = (body: any) => {
    const validEvents = ['payment_intent.succeeded', 'checkout.session.completed']
    if (!validEvents.includes(body.type)) {
        return { isValid: false, shouldProcess: false }
    }

    const data = body.data
    if (!data) {
        return { isValid: false, shouldProcess: false }
    }

    const metadata = data.metadata || {}
    const userId = metadata.supabase_user_id

    if (!userId) {
        console.warn('[Validation] Webhook event missing user ID')
        return { isValid: false, shouldProcess: false }
    }

    return {
        isValid: true,
        shouldProcess: true,
        userId,
        data,
        metadata
    }
}
