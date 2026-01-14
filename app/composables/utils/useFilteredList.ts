interface FilterOptions<T> {
    items: Ref<T[]>
    searchFields: (keyof T)[]
    filterFn?: (item: T, filters: Record<string, any>) => boolean
}

export function useFilteredList<T>(options: FilterOptions<T>) {
    const search = ref('')
    const filters = ref<Record<string, any>>({})

    const filteredItems = computed(() => {
        let result = [...options.items.value]

        if (search.value) {
            const searchLower = search.value.toLowerCase()
            result = result.filter(item => {
                return options.searchFields.some(field => {
                    const value = item[field]
                    if (value === null || value === undefined) return false
                    return String(value).toLowerCase().includes(searchLower)
                })
            })
        }

        if (options.filterFn && Object.keys(filters.value).length > 0) {
            result = result.filter(item => options.filterFn!(item, filters.value))
        }

        return result
    })

    const resetFilters = () => {
        search.value = ''
        filters.value = {}
    }

    return {
        search,
        filters,
        filteredItems,
        resetFilters
    }
}
