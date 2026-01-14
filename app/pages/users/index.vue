<script setup lang="ts">
import UserForm from '@/components/users/UserForm.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'


const { t } = useI18n()
const { getBusinessUsers, createUser, deleteUser, updateUserFull } = useUsers()
const { fetchCurrentRole, currentRole, } = useRoles()
const toast = useToast()

const loading = ref(true)
const users = ref<any[]>([])
const editingUser = ref<any>(null)
const form = ref()
const showModal = ref(false)
const saving = ref(false)

const { roleOptions: roles, statusOptions: statuses, getRoleLabel } = useOptions()

// Filters
const search = ref('')
const roleFilter = ref(roles.value[0])
const statusFilter = ref(statuses.value[0])

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id || userStore.profile?.id) // Robust ID check

const isOwner = computed(() => currentRole.value === 'owner')

const filteredUsers = computed(() => {
  let result = [...users.value]

  // Search
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(u => 
      u.full_name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    )
  }

  // Role Filter
  const selectedRole = roleFilter.value?.value
  if (selectedRole && selectedRole !== 'all') {
    result = result.filter(u => u.role === selectedRole)
  }

  // Status Filter
  const selectedStatus = statusFilter.value?.value
  if (selectedStatus && selectedStatus !== 'all') {
    const isActive = selectedStatus === 'active'
    result = result.filter(u => u.is_active === isActive)
  }

// Sort: Current user first
  const myId = currentUserId.value
  if (myId) {
    result.sort((a, b) => {
      if (a.id === myId) return -1
      if (b.id === myId) return 1
      return 0
    })
  }

  return result
})

// Ensure options are reactive and searchable
const filterRoles = computed(() => roles.value)
const filterStatus = computed(() => statuses.value)

// Columns with i18n
const columns = computed(() => [
  { accessorKey: 'full_name', header: t('users.columns.name') },
  { accessorKey: 'email', header: t('users.columns.email') },
  { accessorKey: 'role', header: t('users.columns.role') },
  { accessorKey: 'is_active', header: t('users.columns.status') },
  { id: 'actions', header: '' }
])

async function loadUsers() {
  loading.value = true
  const { success, users: data } = await getBusinessUsers()
  if (success && data) {
    users.value = data
  }
  loading.value = false
}

async function handleSubmit(data: any) {
  saving.value = true
  
  // Clean payload if password empty
  const payload = { ...data }
  if (editingUser.value && !payload.password) {
    delete payload.password
  }

  let result
  if (editingUser.value) {
    result = await updateUserFull(editingUser.value.id, payload)
  } else {
    result = await createUser(payload)
  }
  
  const { success, error } = result
  
  if (success) {
    toast.add({ 
      title: editingUser.value ? t('users.messages.updated') : t('users.messages.created'), 
      color: 'success' 
    })
    closeModal()
    await loadUsers()
  } else {
    toast.add({ title: t('users.messages.error'), description: error, color: 'error' })
  }
  saving.value = false
}

function openCreateModal() {
  editingUser.value = null
  showModal.value = true
}

function openEditModal(user: any) {
  editingUser.value = user
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

async function toggleUserStatus(row: any) {
  const newState = !row.is_active
  const action = newState ? 'activar' : 'desactivar'
  
  if (!confirm(t('users.messages.delete_confirm', { action }))) return

  const { success, error } = await updateUserFull(row.id, { is_active: newState })
  
  if (success) {
    toast.add({ title: t('users.messages.status_changed', { action }), color: 'success' })
    await loadUsers()
  } else {
    toast.add({ title: t('users.messages.error'), description: error, color: 'error' })
  }
}

async function handleDeleteUser(id: string) {
  if (!confirm(t('users.messages.delete_permanently_confirm'))) return
  
  const { success, error } = await deleteUser(id)
  if (success) {
    toast.add({ title: t('users.messages.deleted'), color: 'success' })
    await loadUsers()
  } else {
    toast.add({ title: t('users.messages.error'), description: error, color: 'error' })
  }
}

onMounted(async () => {
  await fetchCurrentRole()
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader 
      :title="t('users.title')"
      icon="i-heroicons-users"
      :subtitle="t('users.subtitle')"
    >
      <template #actions>
        <UButton 
          icon="i-heroicons-plus" 
          color="primary"
          @click="openCreateModal"
        >
          {{ t('users.buttons.new') }}
        </UButton>
      </template>
    </PageHeader>

    <AppFilters 
      v-model="search" 
      :placeholder="t('users.placeholders.search')"
    >
       <USelectMenu 
         v-model="roleFilter"
         :items="filterRoles"
         option-attribute="label"
         value-attribute="value"
         class="w-40"
       />
       <USelectMenu 
         v-model="statusFilter"
         :items="filterStatus"
         option-attribute="label"
         value-attribute="value"
         class="w-32"
       />
    </AppFilters>

    <UCard>
      <UTable 
        :columns="columns" 
        :data="filteredUsers" 
        :loading="loading"
        class="w-full"
      >
        <template #full_name-cell="{ row }">
            <span>{{ row.original.full_name }}</span>
        </template>
        
        <template #role-cell="{ row }">
          <StatusBadge 
            :status="row.original.role" 
            type="user_role" 
          />
        </template>
        
        <template #is_active-cell="{ row }">
          <StatusBadge 
            :status="row.original.is_active ? 'active' : 'inactive'" 
            type="user" 
          />
        </template>
        
        <template #actions-cell="{ row }">
          <div class="flex justify-start gap-2">
            <UTooltip :text="t('users.buttons.edit')">
              <UButton 
                v-if="row.original.role !== 'owner'"
                icon="i-heroicons-pencil-square"
                color="primary"
                variant="ghost" 
                size="xs"
                @click="openEditModal(row.original)"
              />
            </UTooltip>
            
            <UTooltip :text="t('users.buttons.change_status')">
              <UButton 
                v-if="row.original.role !== 'owner'"
                :icon="row.original.is_active ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle'"
                :color="row.original.is_active ? 'warning' : 'success'"
                variant="ghost"
                size="xs"
                @click="toggleUserStatus(row.original)"
              />
            </UTooltip>

            <UTooltip :text="t('users.buttons.delete_permanently')" v-if="isOwner && row.original.role !== 'owner'">
              <UButton 
                color="error" 
                variant="ghost" 
                icon="i-heroicons-trash" 
                size="xs"
                @click="handleDeleteUser(row.original.id)"
              />
            </UTooltip>
          </div>
        </template>

        <template #empty>
          <EmptyState 
            icon="i-heroicons-users"
            :message="t('users.messages.empty_state')"
            :actionText="t('users.buttons.new')"
            @action="openCreateModal"
          />
        </template>
      </UTable>
    </UCard>

    <UModal 
      v-model:open="showModal" 
      :title="editingUser ? t('users.modal.title_edit') : t('users.modal.title_new')"
    >
      <template #body>
        <UserForm 
          :user="editingUser"
          :loading="saving"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </template>
    </UModal>
  </div>
</template>