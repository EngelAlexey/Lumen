<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppFilters from '@/components/AppFilters.vue'
import CustomerForm from '@/components/customers/CustomerForm.vue'
import type { Customer } from '~/types/database.types'

const { t } = useI18n()
const { getCustomers, createCustomer, updateCustomer, deleteCustomer, loading } = useCustomers()
const toast = useToast()

const search = ref('')
const customers = ref<Customer[]>([])
const showModal = ref(false)
const editingCustomer = ref<Customer | null>(null)
const saving = ref(false)

const columns = [
    { accessorKey: 'full_name', header: t('customers.columns.full_name') },
    { accessorKey: 'phone', header: t('customers.columns.phone') },
    { accessorKey: 'email', header: t('customers.columns.email') },
    { accessorKey: 'address', header: t('customers.columns.address') },
    { id: 'actions', header: t('customers.columns.actions') }
]

const filteredCustomers = computed(() => {
    if (!search.value) return customers.value
    const q = search.value.toLowerCase()
    return customers.value.filter(c => 
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    )
})

async function loadData() {
    const result = await getCustomers()
    if (result.success) {
        customers.value = result.data
    }
}

function openCreateModal() {
    editingCustomer.value = null
    showModal.value = true
}

function openEditModal(customer: Customer) {
    editingCustomer.value = customer
    showModal.value = true
}

async function handleSubmit(data: any) {
    saving.value = true
    let result

    if (editingCustomer.value) {
        result = await updateCustomer(editingCustomer.value.id, data)
    } else {
        result = await createCustomer(data)
    }

    if (result.success) {
        toast.add({ 
            title: editingCustomer.value ? t('customers.messages.updated') : t('customers.messages.created'), 
            color: 'success' 
        })
        showModal.value = false
        await loadData()
    } else {
        toast.add({ 
            title: t('customers.messages.error'), 
            description: result.error, 
            color: 'error' 
        })
    }
    saving.value = false
}


async function handleDelete(customer: Customer) {
    if (!confirm(t('customers.messages.delete_confirm'))) return

    const result = await deleteCustomer(customer.id)
    if (result.success) {
        toast.add({ 
            title: t('customers.messages.deleted'), 
            color: 'success' 
        })
        await loadData()
    } else {
        toast.add({ 
            title: t('customers.messages.error'), 
            description: result.error, 
            color: 'error' 
        })
    }
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="space-y-6">
        <PageHeader 
            :title="$t('customers.title')"
            icon="i-heroicons-users"
        >
            <template #actions>
                <UButton 
                    icon="i-heroicons-plus" 
                    color="primary" 
                    @click="openCreateModal"
                >
                    {{ $t('customers.buttons.new') }}
                </UButton>
            </template>
        </PageHeader>

        <AppFilters 
            v-model="search" 
            :placeholder="$t('customers.placeholders.search')"
        />

        <UCard>
            <UTable :columns="columns" :data="filteredCustomers" :loading="loading">
                <template #address-cell="{ row }">
                    <span class="truncate max-w-[200px] block" :title="row.original.address || ''">
                        {{ row.original.address || '-' }}
                    </span>
                </template>
                
                <template #actions-cell="{ row }">
                    <div class="flex gap-2">
                        <UTooltip :text="$t('customers.buttons.edit')">
                            <UButton 
                                icon="i-heroicons-pencil-square" 
                                color="primary" 
                                variant="ghost" 
                                size="xs"
                                @click="openEditModal(row.original)"
                            />
                        </UTooltip>
                        <UTooltip :text="$t('customers.buttons.delete')">
                            <UButton 
                                icon="i-heroicons-trash" 
                                color="error" 
                                variant="ghost" 
                                size="xs"
                                @click="handleDelete(row.original)"
                            />
                        </UTooltip>
                    </div>
                </template>
                
                <template #empty>
                    <EmptyState 
                        icon="i-heroicons-users"
                        :message="$t('customers.messages.empty_state')"
                    />
                </template>
            </UTable>
        </UCard>

        <UModal 
            v-model:open="showModal" 
            :title="editingCustomer ? $t('customers.modal.title_edit') : $t('customers.modal.title_new')"
        >
            <template #body>
                <CustomerForm 
                    :customer="editingCustomer" 
                    :loading="saving" 
                    @close="showModal = false" 
                    @submit="handleSubmit" 
                />
            </template>
        </UModal>
    </div>
</template>
