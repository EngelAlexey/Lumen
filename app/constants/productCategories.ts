export const productCategories = [
    { value: 'general', label_key: 'products.categories.general' },
    { value: 'services', label_key: 'products.categories.services' },
    { value: 'beverages', label_key: 'products.categories.beverages' },
    { value: 'foods', label_key: 'products.categories.foods' },
    { value: 'personal_care', label_key: 'products.categories.personal_care' },
    { value: 'electronics', label_key: 'products.categories.electronics' },
    { value: 'clothing', label_key: 'products.categories.clothing' },
    { value: 'medicines', label_key: 'products.categories.medicines' }
] as const

export type ProductCategory = typeof productCategories[number]['value']
