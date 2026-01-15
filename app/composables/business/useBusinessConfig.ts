import { defu } from 'defu'
import {
  BusinessConfigSchema,
  type BusinessConfig,
  type BusinessType,
  type BusinessModule
} from '~/types/config.types'
import { BUSINESS_PRESETS, getBusinessPreset } from '../../../server/config/business-presets'

export interface NavItem {
  to: string
  label: string
  icon: string
  badge?: boolean
  adminOnly?: boolean
}

export const useBusinessConfig = () => {
  const userStore = useUserStore()
  const { isAdmin } = useRoles()

  const businessType = computed<BusinessType>(() => {
    const type = userStore.business?.business_type as BusinessType
    return type || 'retail'
  })

  const isLoaded = computed(() => userStore.isready)
  const preset = computed(() => {
    return BUSINESS_PRESETS[businessType.value] || BUSINESS_PRESETS.retail
  })

  const config = computed<BusinessConfig>(() => {
    const customConfig = userStore.business?.business_config as any

    if (!customConfig) {
      return preset.value
    }

    try {
      const merged = defu(customConfig, preset.value)
      return BusinessConfigSchema.parse(merged)
    } catch (error) {
      console.error('[useBusinessConfig] Invalid config, falling back to preset:', error)
      return preset.value
    }
  })

  const hasModule = (module: BusinessModule): boolean => {
    return config.value.customizations.modules[module] === true
  }

  const hasFeature = (feature: string): boolean => {
    return (config.value.customizations.features as any)[feature] === true
  }

  const canPayWith = (method: string): boolean => {
    return (config.value.customizations.payments as any)[method] === true
  }

  const labels = computed(() => config.value.customizations.ui.labels)
  const navigation = computed<NavItem[]>(() => {
    const navItems: NavItem[] = []

    navItems.push({
      to: '/dashboard',
      label: 'Dashboard',
      icon: 'i-heroicons-chart-bar'
    })

    if (hasModule('pos')) {
      navItems.push({
        to: '/transactions/new',
        label: 'Nueva Venta',
        icon: 'i-heroicons-plus-circle'
      })
      navItems.push({
        to: '/cash-register',
        label: 'Caja',
        icon: 'i-heroicons-banknotes'
      })
    }

    if (hasModule('tables')) {
      navItems.push({
        to: '/tables',
        label: 'Mesas',
        icon: 'i-heroicons-table-cells'
      })
    }

    if (hasModule('appointments')) {
      navItems.push({
        to: '/appointments',
        label: 'Citas',
        icon: 'i-heroicons-calendar'
      })
    }

    navItems.push({
      to: '/transactions',
      label: labels.value.transactions,
      icon: 'i-heroicons-clipboard-document-list',
      badge: hasFeature('pendingOrders')
    })

    navItems.push({
      to: '/products',
      label: labels.value.products,
      icon: hasModule('appointments') ? 'i-heroicons-queue-list' : 'i-heroicons-cube'
    })

    if (hasModule('onlineStore')) {
      navItems.push({
        to: '/store-settings',
        label: 'Tienda Online',
        icon: 'i-heroicons-globe-alt'
      })
    }

    navItems.push({
      to: '/users',
      label: 'Usuarios',
      icon: 'i-heroicons-users',
      adminOnly: true
    })

    navItems.push({
      to: '/reports',
      label: 'Reportes',
      icon: 'i-heroicons-chart-pie'
    })

    navItems.push({
      to: '/settings',
      label: 'Configuración',
      icon: 'i-heroicons-cog-6-tooth'
    })

    return navItems.filter(item => {
      if (item.adminOnly && !isAdmin.value) return false
      return true
    })
  })

  const loadBusinessType = async () => {
    if (!userStore.initialized) {
      await userStore.initialize()
    }
  }

  return {
    businessType,
    isLoaded,
    preset,
    config,

    hasModule,
    hasFeature,
    canPayWith,
    getBusinessPreset,

    labels,
    navigation,
    features: computed(() => config.value.customizations.features),

    loadBusinessType
  }
}
