import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFilteredList } from '../../../app/composables/utils/useFilteredList'
import { ref } from 'vue'

interface TestItem {
    id: number
    name?: string
    category?: string
    price?: number
}

describe('useFilteredList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should filter items by search query', () => {
        const items = ref<TestItem[]>([
            { id: 1, name: 'Apple', category: 'fruit' },
            { id: 2, name: 'Banana', category: 'fruit' },
            { id: 3, name: 'Carrot', category: 'vegetable' }
        ])

        const { filteredItems, search } = useFilteredList({
            items,
            searchFields: ['name']
        })

        search.value = 'app'
        expect(filteredItems.value).toHaveLength(1)
        expect(filteredItems.value[0].name).toBe('Apple')
    })

    it('should filter items case-insensitively', () => {
        const items = ref<TestItem[]>([
            { id: 1, name: 'Product A' },
            { id: 2, name: 'product b' },
            { id: 3, name: 'PRODUCT C' }
        ])

        const { filteredItems, search } = useFilteredList({
            items,
            searchFields: ['name']
        })

        search.value = 'PRODUCT'
        expect(filteredItems.value).toHaveLength(3)
    })

    it('should apply custom filter function', () => {
        const items = ref<TestItem[]>([
            { id: 1, price: 100 },
            { id: 2, price: 200 },
            { id: 3, price: 300 }
        ])

        const { filteredItems, filters } = useFilteredList({
            items,
            searchFields: [],
            filterFn: (item: TestItem, filterValues: Record<string, number>) => {
                if (!filterValues.minPrice) return true
                return (item.price || 0) >= filterValues.minPrice
            }
        })

        filters.value = { minPrice: 150 }
        expect(filteredItems.value).toHaveLength(2)
        expect(filteredItems.value[0].price).toBe(200)
    })

    it('should return all items when no filters applied', () => {
        const items = ref<TestItem[]>([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
        ])

        const { filteredItems } = useFilteredList({
            items,
            searchFields: ['name']
        })

        expect(filteredItems.value).toHaveLength(2)
    })
})
