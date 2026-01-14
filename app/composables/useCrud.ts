interface CrudOptions<T> {
    getItems: () => Promise<{ success: boolean; data?: T[]; error?: string }>
    createItem: (data: Partial<T>) => Promise<{ success: boolean; data?: T; error?: string }>
    updateItem: (id: string, data: Partial<T>) => Promise<{ success: boolean; data?: T; error?: string }>
    deleteItem: (id: string) => Promise<{ success: boolean; error?: string }>
    itemName?: string
}

export function useCrud<T extends { id: string }>(options: CrudOptions<T>) {
    const { t } = useI18n()
    const toast = useToast()

    const items = ref<T[]>([])
    const loading = ref(false)
    const showModal = ref(false)
    const editingItem = ref<T | null>(null)
    const saving = ref(false)

    const itemName = options.itemName || 'Item'

    const loadItems = async () => {
        loading.value = true
        const result = await options.getItems()
        if (result.success && result.data) {
            items.value = result.data
        }
        loading.value = false
        return result
    }

    const saveItem = async (data: Partial<T>) => {
        saving.value = true
        let result

        if (editingItem.value) {
            result = await options.updateItem(editingItem.value.id, data)
        } else {
            result = await options.createItem(data)
        }

        if (result.success) {
            toast.add({
                title: editingItem.value
                    ? t('common.messages.updated', { item: itemName })
                    : t('common.messages.created', { item: itemName }),
                color: 'success'
            })
            closeModal()
            await loadItems()
        } else {
            toast.add({
                title: t('common.messages.error'),
                description: result.error,
                color: 'error'
            })
        }

        saving.value = false
        return result
    }

    const deleteItem = async (item: T, confirmMessage?: string) => {
        const confirmed = confirm(
            confirmMessage || t('common.messages.delete_confirm', { item: itemName })
        )
        if (!confirmed) return

        const result = await options.deleteItem(item.id)

        if (result.success) {
            toast.add({
                title: t('common.messages.deleted', { item: itemName }),
                color: 'success'
            })
            await loadItems()
        } else {
            toast.add({
                title: t('common.messages.error'),
                description: result.error,
                color: 'error'
            })
        }

        return result
    }

    const openCreateModal = () => {
        editingItem.value = null
        showModal.value = true
    }

    const openEditModal = (item: T) => {
        editingItem.value = item
        showModal.value = true
    }

    const closeModal = () => {
        showModal.value = false
        editingItem.value = null
    }

    return {
        items,
        loading,
        showModal,
        editingItem,
        saving,

        loadItems,
        saveItem,
        deleteItem,
        openCreateModal,
        openEditModal,
        closeModal
    }
}
