/**
 * Cart Store (Pinia)
 * Manages the shopping cart state for POS operations
 */

import { defineStore } from 'pinia'
import type { Product } from '~/types/database.types'

export interface CartItem {
    product: Product
    quantity: number
    discount: number // Discount amount per unit
    subtotal: number
}

export const useCart = defineStore('cart', () => {
    const items = ref<CartItem[]>([])

    // ===== ACTIONS =====

    const addItem = (product: Product, quantity: number = 1) => {
        const existingIndex = items.value.findIndex(item => item.product.id === product.id)

        if (existingIndex >= 0) {
            // Product already in cart, increase quantity
            items.value[existingIndex]!.quantity += quantity
            recalculateSubtotal(existingIndex)
        } else {
            // New product
            items.value.push({
                product,
                quantity,
                discount: 0,
                subtotal: product.price * quantity
            })
        }
    }

    const removeItem = (productId: string) => {
        const index = items.value.findIndex(item => item.product.id === productId)
        if (index >= 0) {
            items.value.splice(index, 1)
        }
    }

    const updateQuantity = (productId: string, quantity: number) => {
        const index = items.value.findIndex(item => item.product.id === productId)
        if (index >= 0 && quantity > 0) {
            items.value[index]!.quantity = quantity
            recalculateSubtotal(index)
        } else if (quantity <= 0) {
            removeItem(productId)
        }
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

    // ===== HELPERS =====

    const recalculateSubtotal = (index: number) => {
        const item = items.value[index]
        if (item) {
            const priceAfterDiscount = Math.max(0, item.product.price - item.discount)
            item.subtotal = priceAfterDiscount * item.quantity
        }
    }

    // ===== COMPUTED =====

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

    return {
        // State
        items,
        // Actions
        addItem,
        removeItem,
        updateQuantity,
        applyItemDiscount,
        clearCart,
        // Computed
        subtotal,
        totalDiscount,
        total,
        itemCount,
        isEmpty
    }
})
