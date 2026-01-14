export const sectorConfig: Record<string, any[]> = {
    services: [
        { key: 'duration_minutes', label_key: 'products.sector_fields.duration_minutes', type: 'number', required: false, icon: 'i-heroicons-clock' },
        { key: 'technician_name', label_key: 'products.sector_fields.technician_name', type: 'text', required: false, icon: 'i-heroicons-user' },
        { key: 'requires_appointment', label_key: 'products.sector_fields.requires_appointment', type: 'boolean', required: false },
        { key: 'warranty_period', label_key: 'products.sector_fields.warranty_period', type: 'number', required: false }
    ],
    retail: [
        { key: 'brand', label_key: 'products.sector_fields.brand', type: 'text', required: false, icon: 'i-heroicons-tag' },
        { key: 'model', label_key: 'products.sector_fields.model', type: 'text', required: false },
        { key: 'min_stock', label_key: 'products.sector_fields.min_stock', type: 'number', required: false, icon: 'i-heroicons-bell-alert' }
    ],
    gastronomy: [
        { key: 'is_vegan', label_key: 'products.sector_fields.is_vegan', type: 'boolean', required: false },
        { key: 'is_gluten_free', label_key: 'products.sector_fields.is_gluten_free', type: 'boolean', required: false },
        { key: 'is_spicy', label_key: 'products.sector_fields.is_spicy', type: 'boolean', required: false },
        { key: 'preparation_time', label_key: 'products.sector_fields.preparation_time', type: 'number', required: false, icon: 'i-heroicons-clock' }
    ],
    pharmacy: [
        { key: 'expiration_date', label_key: 'products.sector_fields.expiration_date', type: 'date', required: true, icon: 'i-heroicons-calendar' },
        { key: 'batch_number', label_key: 'products.sector_fields.batch_number', type: 'text', required: true, icon: 'i-heroicons-archive-box' },
        { key: 'laboratory', label_key: 'products.sector_fields.laboratory', type: 'text', required: false, icon: 'i-heroicons-beaker' },
        { key: 'prescription_required', label_key: 'products.sector_fields.prescription_required', type: 'boolean', required: false }
    ],
    fashion: [
        { key: 'brand', label_key: 'products.sector_fields.brand', type: 'text', required: false },
        { key: 'size', label_key: 'products.sector_fields.size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'], required: true },
        { key: 'color', label_key: 'products.sector_fields.color', type: 'text', required: true, icon: 'i-heroicons-swatch' },
        { key: 'material', label_key: 'products.sector_fields.material', type: 'text', required: false }
    ]
}
