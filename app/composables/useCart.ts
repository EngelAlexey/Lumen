import type { Product } from '~/types/database.types'

export interface CartItem {
    product: Product
    quantity: number
    discount: number
    subtotal: number
}

export const useCart = () => {
    const items = useState<CartItem[]>('cart-items', () => [])

    const addItem = (product: Product, quantity: number = 1): { success: boolean; error?: string } => {
        const existingIndex = items.value.findIndex(item => item.product.id === product.id)
        const currentQty = existingIndex >= 0 ? items.value[existingIndex]!.quantity : 0
        const newQty = currentQty + quantity

        const shouldValidateStock = !product.is_service && product.stock_quantity !== null && product.stock_quantity !== undefined

        if (shouldValidateStock && newQty > product.stock_quantity!) {
            return {
                success: false,
                error: `Stock insuficiente. Disponible: ${product.stock_quantity}, En carrito: ${currentQty}`
            }
        }

        if (existingIndex >= 0) {
            items.value[existingIndex]!.quantity = newQty
            recalculateSubtotal(existingIndex)
        } else {
            items.value.push({
                product,
                quantity,
                discount: 0,
                subtotal: product.price * quantity
            })
        }
        return { success: true }
    }

    const removeItem = (productId: string) => {
        const index = items.value.findIndex(item => item.product.id === productId)
        if (index >= 0) {
            items.value.splice(index, 1)
        }
    }

    const updateQuantity = (productId: string, quantity: number): { success: boolean; error?: string } => {
        const index = items.value.findIndex(item => item.product.id === productId)
        if (index >= 0 && quantity > 0) {
            const product = items.value[index]!.product

            const shouldValidateStock = !product.is_service && product.stock_quantity !== null && product.stock_quantity !== undefined

            if (shouldValidateStock && quantity > product.stock_quantity!) {
                return {
                    success: false,
                    error: `Stock máximo disponible: ${product.stock_quantity}`
                }
            }

            items.value[index]!.quantity = quantity
            recalculateSubtotal(index)
            return { success: true }
        } else if (quantity <= 0) {
            removeItem(productId)
            return { success: true }
        }
        return { success: false, error: 'Producto no encontrado' }
    }

    const applyItemDiscount = (productId: string, discountAmount: number) => {
        const index = items.value.findIndex(item => item.product.id === productId)
        if (index >= 0) {
            items.value[index]!.discount = Math.max(0, discountAmount)
            recalculateSubtotal(index)
        }
    }

    const clearCart = () => {
        items.value = []
    }

    const recalculateSubtotal = (index: number) => {
        const item = items.value[index]
        if (item) {
            const priceAfterDiscount = Math.max(0, item.product.price - item.discount)
            item.subtotal = priceAfterDiscount * item.quantity
        }
    }

    const subtotal = computed(() => {
        return items.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    })

    const totalDiscount = computed(() => {
        return items.value.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
    })

    const total = computed(() => {
        return items.value.reduce((sum, item) => sum + item.subtotal, 0)
    })

    const itemCount = computed(() => {
        return items.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    const isEmpty = computed(() => items.value.length === 0)

    return reactive({
        items,
        addItem,
        removeItem,
        updateQuantity,
        applyItemDiscount,
        clearCart,
        subtotal,
        totalDiscount,
        total,
        itemCount,
        isEmpty
    })
}
