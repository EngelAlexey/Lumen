import { H3Event } from 'h3'

export const validateOrderParams = (body: any) => {
    const { businessId, customer, items } = body

    if (!businessId || !customer || !items || items.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'validations.missing_data'
        })
    }

    if (!customer.full_name || !customer.phone) {
        throw createError({
            statusCode: 400,
            statusMessage: 'validations.incomplete_customer'
        })
    }

    return {
        businessId,
        customer,
        items,
        paymentMethod: body.paymentMethod || 'cash'
    }
}
