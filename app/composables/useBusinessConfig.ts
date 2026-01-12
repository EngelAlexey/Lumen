export type BusinessType = 'retail' | 'gastronomy' | 'services' | 'delivery'

export interface NavItem {
    to: string
    label: string
    icon: string
    badge?: boolean
    adminOnly?: boolean
}

export interface BusinessLabels {
    products: string
    transactions: string
    newTransaction: string
    transactionNumber: string
    customer: string
    pendingOrders: string
}

export interface BusinessFeatures {
    stock: boolean
    tables: boolean
    pendingOrders: boolean
    delivery: boolean
    customers: boolean
    suppliers: boolean
    creditAccounts: boolean
}

export interface BusinessConfig {
    name: string
    description: string
    icon: string
    navigation: NavItem[]
    labels: BusinessLabels
    features: BusinessFeatures
}

const businessConfigs: Record<BusinessType, BusinessConfig> = {
    retail: {
        name: 'Comercio',
        description: 'Tiendas, mini super, bazares',
        icon: 'i-heroicons-building-storefront',
        navigation: [
            { to: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
            { to: '/transactions', label: 'Ventas', icon: 'i-heroicons-credit-card' },
            { to: '/cash-register', label: 'Caja', icon: 'i-heroicons-banknotes' },
            { to: '/products', label: 'Productos', icon: 'i-heroicons-cube' },
            { to: '/users', label: 'Usuarios', icon: 'i-heroicons-users', adminOnly: true },
            { to: '/reports', label: 'Reportes', icon: 'i-heroicons-chart-pie' },
            { to: '/settings', label: 'Configuración', icon: 'i-heroicons-cog-6-tooth' },
        ],
        labels: {
            products: 'Productos',
            transactions: 'Ventas',
            newTransaction: 'Nueva Venta',
            transactionNumber: 'Factura',
            customer: 'Cliente',
            pendingOrders: 'Pendientes',
        },
        features: {
            stock: true,
            tables: false,
            pendingOrders: false,
            delivery: false,
            customers: false,
            suppliers: false,
            creditAccounts: false,
        }
    },

    gastronomy: {
        name: 'Gastronomía',
        description: 'Restaurantes, sodas, cafeterías',
        icon: 'i-heroicons-cake',
        navigation: [
            { to: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
            { to: '/transactions/new', label: 'Nueva Orden', icon: 'i-heroicons-plus-circle' },
            { to: '/transactions', label: 'Órdenes', icon: 'i-heroicons-clipboard-document-list', badge: true },
            { to: '/cash-register', label: 'Caja', icon: 'i-heroicons-banknotes' },
            { to: '/products', label: 'Menú', icon: 'i-heroicons-book-open' },
            { to: '/users', label: 'Usuarios', icon: 'i-heroicons-users', adminOnly: true },
            { to: '/reports', label: 'Reportes', icon: 'i-heroicons-chart-pie' },
            { to: '/settings', label: 'Configuración', icon: 'i-heroicons-cog-6-tooth' },
        ],
        labels: {
            products: 'Menú',
            transactions: 'Órdenes',
            newTransaction: 'Nueva Orden',
            transactionNumber: 'Orden',
            customer: 'Mesa/Cliente',
            pendingOrders: 'Cuentas Abiertas',
        },
        features: {
            stock: false,
            tables: true,
            pendingOrders: true,
            delivery: true,
            customers: false,
            suppliers: false,
            creditAccounts: false,
        }
    },

    services: {
        name: 'Servicios',
        description: 'Talleres, estéticas, consultorías',
        icon: 'i-heroicons-wrench-screwdriver',
        navigation: [
            { to: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
            { to: '/transactions', label: 'Servicios', icon: 'i-heroicons-clipboard-document-check' },
            { to: '/cash-register', label: 'Caja', icon: 'i-heroicons-banknotes' },
            { to: '/products', label: 'Catálogo', icon: 'i-heroicons-queue-list' },
            { to: '/users', label: 'Usuarios', icon: 'i-heroicons-users', adminOnly: true },
            { to: '/reports', label: 'Reportes', icon: 'i-heroicons-chart-pie' },
            { to: '/settings', label: 'Configuración', icon: 'i-heroicons-cog-6-tooth' },
        ],
        labels: {
            products: 'Catálogo de Servicios',
            transactions: 'Servicios',
            newTransaction: 'Nuevo Servicio',
            transactionNumber: 'Servicio',
            customer: 'Cliente',
            pendingOrders: 'En Proceso',
        },
        features: {
            stock: false,
            tables: false,
            pendingOrders: true,
            delivery: false,
            customers: true,
            suppliers: false,
            creditAccounts: false,
        }
    },

    delivery: {
        name: 'Distribución',
        description: 'Distribuidoras, delivery, logística',
        icon: 'i-heroicons-truck',
        navigation: [
            { to: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-chart-bar' },
            { to: '/transactions', label: 'Pedidos', icon: 'i-heroicons-shopping-bag', badge: true },
            { to: '/cash-register', label: 'Caja', icon: 'i-heroicons-banknotes' },
            { to: '/products', label: 'Productos', icon: 'i-heroicons-cube' },
            { to: '/customers', label: 'Clientes', icon: 'i-heroicons-user-group' },
            { to: '/users', label: 'Usuarios', icon: 'i-heroicons-users', adminOnly: true },
            { to: '/reports', label: 'Reportes', icon: 'i-heroicons-chart-pie' },
            { to: '/settings', label: 'Configuración', icon: 'i-heroicons-cog-6-tooth' },
        ],
        labels: {
            products: 'Productos',
            transactions: 'Pedidos',
            newTransaction: 'Nuevo Pedido',
            transactionNumber: 'Pedido',
            customer: 'Cliente',
            pendingOrders: 'Pedidos Pendientes',
        },
        features: {
            stock: true,
            tables: false,
            pendingOrders: true,
            delivery: true,
            customers: true,
            suppliers: true,
            creditAccounts: true,
        }
    }
}

export const useBusinessConfig = () => {
    const { getBusinessType } = useAuth()
    const { isAdmin } = useRoles()

    const businessType = useState<BusinessType>('business-type', () => 'retail')
    const isLoaded = useState<boolean>('business-config-loaded', () => false)

    const loadBusinessType = async (forceType?: BusinessType) => {
        if (forceType) {
            console.log('[useBusinessConfig] Forcing type to:', forceType)
            businessType.value = forceType
            isLoaded.value = true
            return
        }

        console.log('[useBusinessConfig] Loading business type...')
        const type = await getBusinessType() as BusinessType
        console.log('[useBusinessConfig] Fetched type:', type)

        if (businessConfigs[type]) {
            businessType.value = type
        } else {
            businessType.value = 'retail'
        }
        isLoaded.value = true
    }

    const config = computed<BusinessConfig>(() => {
        return businessConfigs[businessType.value] || businessConfigs.retail
    })

    const navigation = computed<NavItem[]>(() => {
        return config.value.navigation.filter(item => {
            if (item.adminOnly && !isAdmin.value) return false
            return true
        })
    })

    const labels = computed<BusinessLabels>(() => config.value.labels)
    const features = computed<BusinessFeatures>(() => config.value.features)

    const availableTypes = computed(() => {
        return Object.entries(businessConfigs).map(([key, value]) => ({
            value: key,
            label: value.name,
            description: value.description,
            icon: value.icon
        }))
    })

    return {
        businessType,
        isLoaded,
        loadBusinessType,
        config,
        navigation,
        labels,
        features,
        availableTypes,
        businessConfigs
    }
}
