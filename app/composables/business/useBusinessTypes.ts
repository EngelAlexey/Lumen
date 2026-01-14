export const useBusinessTypes = () => {
    const { t } = useI18n()

    const businessTypes = computed(() => [
        {
            value: 'retail',
            label: t('business_types.retail.label'),
            description: t('business_types.retail.description'),
            icon: 'i-heroicons-building-storefront'
        },
        {
            value: 'restaurant',
            label: t('business_types.restaurant.label'),
            description: t('business_types.restaurant.description'),
            icon: 'i-heroicons-cake'
        },
        {
            value: 'services',
            label: t('business_types.services.label'),
            description: t('business_types.services.description'),
            icon: 'i-heroicons-wrench-screwdriver'
        },
        {
            value: 'pharmacy',
            label: t('business_types.pharmacy.label'),
            description: t('business_types.pharmacy.description'),
            icon: 'i-heroicons-heart'
        },
        {
            value: 'fashion',
            label: t('business_types.fashion.label'),
            description: t('business_types.fashion.description'),
            icon: 'i-heroicons-shopping-bag'
        },
        {
            value: 'delivery',
            label: t('business_types.delivery.label'),
            description: t('business_types.delivery.description'),
            icon: 'i-heroicons-truck'
        },
        {
            value: 'online',
            label: t('business_types.online.label'),
            description: t('business_types.online.description'),
            icon: 'i-heroicons-globe-alt'
        },
        {
            value: 'hybrid',
            label: t('business_types.hybrid.label'),
            description: t('business_types.hybrid.description'),
            icon: 'i-heroicons-squares-2x2'
        }
    ])

    return {
        businessTypes
    }
}
