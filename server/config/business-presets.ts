import type { BusinessConfig, BusinessType } from '~/types/config.types'

export const BUSINESS_PRESETS: Record<BusinessType, BusinessConfig> = {
  retail: {
    version: '1.0',
    preset: 'retail',
    customizations: {
      modules: {
        pos: true,
        inventory: true,
        tables: false,
        onlineStore: false,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: true,
        barcodeScanner: true,
        pendingOrders: false,
        deliveryTracking: false,
        calendarBooking: false
      },
      payments: {
        cash: true,
        cardManual: true,
        cardOnline: false,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: false,
        batchTracking: false,
        serialNumbers: false,
        variations: false
      },
      transactions: {
        requireCashSession: true,
        allowAnonymous: true,
        requireCustomer: false,
        defaultStatus: 'paid'
      },
      ui: {
        labels: {
          products: 'Productos',
          transactions: 'Ventas',
          newTransaction: 'Nueva Venta',
          transactionNumber: 'Factura',
          customer: 'Cliente',
          pendingOrders: 'Pendientes'
        },
        navigation: {
          showTables: false,
          showCashRegister: true,
          showAppointments: false,
          showOnlineStore: false
        }
      }
    }
  },
  services: {
    version: '1.0',
    preset: 'services',
    customizations: {
      modules: {
        pos: false,
        inventory: false,
        tables: false,
        onlineStore: false,
        appointments: true,
        prescriptions: false
      },
      features: {
        cashRegister: false,
        barcodeScanner: false,
        pendingOrders: true,
        deliveryTracking: false,
        calendarBooking: true
      },
      payments: {
        cash: false,
        cardManual: false,
        cardOnline: true,
        transfer: true
      },
      inventory: {
        trackStock: false,
        lowStockAlerts: false,
        expiryTracking: false,
        batchTracking: false,
        serialNumbers: false,
        variations: false
      },
      transactions: {
        requireCashSession: false,
        allowAnonymous: false,
        requireCustomer: true,
        defaultStatus: 'pending'
      },
      ui: {
        labels: {
          products: 'Servicios',
          transactions: 'Facturación',
          newTransaction: 'Nuevo Servicio',
          transactionNumber: 'Servicio',
          customer: 'Cliente',
          pendingOrders: 'En Proceso'
        },
        navigation: {
          showTables: false,
          showCashRegister: false,
          showAppointments: true,
          showOnlineStore: false
        }
      }
    }
  },
  restaurant: {
    version: '1.0',
    preset: 'restaurant',
    customizations: {
      modules: {
        pos: true,
        inventory: true,
        tables: true,
        onlineStore: false,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: true,
        barcodeScanner: false,
        pendingOrders: true,
        deliveryTracking: false,
        calendarBooking: false,
        kitchenDisplay: true
      },
      payments: {
        cash: true,
        cardManual: true,
        cardOnline: false,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: true,
        batchTracking: false,
        serialNumbers: false,
        variations: false
      },
      transactions: {
        requireCashSession: true,
        allowAnonymous: true,
        requireCustomer: false,
        defaultStatus: 'pending'
      },
      ui: {
        labels: {
          products: 'Menú',
          transactions: 'Órdenes',
          newTransaction: 'Nueva Orden',
          transactionNumber: 'Orden',
          customer: 'Mesa/Cliente',
          pendingOrders: 'Cuentas Abiertas'
        },
        navigation: {
          showTables: true,
          showCashRegister: true,
          showAppointments: false,
          showOnlineStore: false
        }
      }
    }
  },
  pharmacy: {
    version: '1.0',
    preset: 'pharmacy',
    customizations: {
      modules: {
        pos: true,
        inventory: true,
        tables: false,
        onlineStore: false,
        appointments: false,
        prescriptions: true
      },
      features: {
        cashRegister: true,
        barcodeScanner: true,
        pendingOrders: false,
        deliveryTracking: false,
        calendarBooking: false,
        prescriptionValidation: true,
        expiryTracking: true,
        batchTracking: true
      },
      payments: {
        cash: true,
        cardManual: true,
        cardOnline: false,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: true,
        batchTracking: true,
        serialNumbers: false,
        variations: false
      },
      transactions: {
        requireCashSession: true,
        allowAnonymous: false,
        requireCustomer: true,
        defaultStatus: 'paid'
      },
      ui: {
        labels: {
          products: 'Medicamentos',
          transactions: 'Despachos',
          newTransaction: 'Nueva Receta',
          transactionNumber: 'Receta',
          customer: 'Paciente',
          pendingOrders: 'Pendientes'
        },
        navigation: {
          showTables: false,
          showCashRegister: true,
          showAppointments: false,
          showOnlineStore: false
        }
      }
    }
  },
  online: {
    version: '1.0',
    preset: 'online',
    customizations: {
      modules: {
        pos: false,
        inventory: true,
        tables: false,
        onlineStore: true,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: false,
        barcodeScanner: false,
        pendingOrders: true,
        deliveryTracking: true,
        calendarBooking: false
      },
      payments: {
        cash: false,
        cardManual: false,
        cardOnline: true,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: false,
        batchTracking: false,
        serialNumbers: false,
        variations: true
      },
      transactions: {
        requireCashSession: false,
        allowAnonymous: false,
        requireCustomer: true,
        defaultStatus: 'pending'
      },
      ui: {
        labels: {
          products: 'Productos',
          transactions: 'Órdenes',
          newTransaction: 'Nuevo Pedido',
          transactionNumber: 'Pedido',
          customer: 'Cliente',
          pendingOrders: 'Por Enviar'
        },
        navigation: {
          showTables: false,
          showCashRegister: false,
          showAppointments: false,
          showOnlineStore: true
        }
      }
    }
  },
  hybrid: {
    version: '1.0',
    preset: 'hybrid',
    customizations: {
      modules: {
        pos: true,
        inventory: true,
        tables: false,
        onlineStore: true,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: true,
        barcodeScanner: true,
        pendingOrders: true,
        deliveryTracking: true,
        calendarBooking: false
      },
      payments: {
        cash: true,
        cardManual: true,
        cardOnline: true,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: false,
        batchTracking: false,
        serialNumbers: false,
        variations: true
      },
      transactions: {
        requireCashSession: false,
        allowAnonymous: true,
        requireCustomer: false,
        defaultStatus: 'pending'
      },
      ui: {
        labels: {
          products: 'Productos',
          transactions: 'Ventas',
          newTransaction: 'Nueva Venta',
          transactionNumber: 'Factura',
          customer: 'Cliente',
          pendingOrders: 'Pendientes'
        },
        navigation: {
          showTables: false,
          showCashRegister: true,
          showAppointments: false,
          showOnlineStore: true
        }
      }
    }
  },
  fashion: {
    version: '1.0',
    preset: 'fashion',
    customizations: {
      modules: {
        pos: true,
        inventory: true,
        tables: false,
        onlineStore: true,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: true,
        barcodeScanner: true,
        pendingOrders: true,
        deliveryTracking: true,
        calendarBooking: false
      },
      payments: {
        cash: true,
        cardManual: true,
        cardOnline: true,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: false,
        batchTracking: false,
        serialNumbers: false,
        variations: true
      },
      transactions: {
        requireCashSession: true,
        allowAnonymous: true,
        requireCustomer: false,
        defaultStatus: 'paid'
      },
      ui: {
        labels: {
          products: 'Ropa/Accesorios',
          transactions: 'Ventas',
          newTransaction: 'Nueva Venta',
          transactionNumber: 'Factura',
          customer: 'Cliente',
          pendingOrders: 'Apartados'
        },
        navigation: {
          showTables: false,
          showCashRegister: true,
          showAppointments: false,
          showOnlineStore: true
        }
      }
    }
  },
  delivery: {
    version: '1.0',
    preset: 'delivery',
    customizations: {
      modules: {
        pos: false,
        inventory: true,
        tables: false,
        onlineStore: true,
        appointments: false,
        prescriptions: false
      },
      features: {
        cashRegister: false,
        barcodeScanner: false,
        pendingOrders: true,
        deliveryTracking: true,
        calendarBooking: false
      },
      payments: {
        cash: false,
        cardManual: false,
        cardOnline: true,
        transfer: true
      },
      inventory: {
        trackStock: true,
        lowStockAlerts: true,
        expiryTracking: false,
        batchTracking: true,
        serialNumbers: false,
        variations: false
      },
      transactions: {
        requireCashSession: false,
        allowAnonymous: false,
        requireCustomer: true,
        defaultStatus: 'pending'
      },
      ui: {
        labels: {
          products: 'Items',
          transactions: 'Pedidos',
          newTransaction: 'Nuevo Pedido',
          transactionNumber: 'Orden de Venta',
          customer: 'Cliente/Destinatario',
          pendingOrders: 'Por Despachar'
        },
        navigation: {
          showTables: false,
          showCashRegister: false,
          showAppointments: false,
          showOnlineStore: true
        }
      }
    }
  }
}

export function getBusinessPreset(type: BusinessType): BusinessConfig {
  return BUSINESS_PRESETS[type] || BUSINESS_PRESETS.retail
}

export function isBusinessTypeImplemented(type: BusinessType): boolean {
  const implemented: BusinessType[] = [
    'retail',
    'services',
    'fashion',
    'delivery',
    'restaurant',
    'online',
    'hybrid'
  ]
  return implemented.includes(type)
}

export function getImplementedTypes(): BusinessType[] {
  return ['retail', 'services', 'fashion', 'delivery', 'restaurant', 'online', 'hybrid']
}
