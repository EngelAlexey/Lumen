<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { getBusinessUsers, createUser, deleteUser } = useUsers()
const { fetchCurrentRole, currentRole, getRoleLabel, getRoleColor } = useRoles()
const toast = useToast()

const loading = ref(true)
const users = ref<any[]>([])
const showModal = ref(false)
const saving = ref(false)
const form = ref()

const schema = z.object({
  fullName: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.string()
})

const formData = reactive({
  email: '',
  password: '',
  fullName: '',
  role: 'cashier'
})

const roles = [
  { label: 'Gerente', value: 'manager' },
  { label: 'Cajero', value: 'cashier' },
  { label: 'Personal', value: 'staff' }
]

const columns = [
  {
    accessorKey: 'full_name',
    header: 'Nombre'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Rol'
  },
  {
    id: 'actions',
    header: ''
  }
]

async function loadUsers() {
  loading.value = true
  const { success, users: data } = await getBusinessUsers()
  if (success && data) {
    users.value = data
  }
  loading.value = false
}

async function handleCreateUser(event: FormSubmitEvent<any>) {
  saving.value = true
  
  const { success, error } = await createUser({
    ...event.data,
    role: event.data.role
  })
  
  if (success) {
    toast.add({ title: 'Usuario creado', color: 'success' })
    showModal.value = false
    formData.email = ''
    formData.password = ''
    formData.fullName = ''
    formData.role = 'cashier'
    await loadUsers()
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
  saving.value = false
}

async function handleDeleteUser(id: string) {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return
  
  const { success, error } = await deleteUser(id)
  if (success) {
    toast.add({ title: 'Usuario eliminado', color: 'success' })
    await loadUsers()
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}

onMounted(async () => {
  await fetchCurrentRole()
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-end items-center">
      <UButton 
        icon="i-heroicons-plus" 
        color="primary"
        @click="showModal = true"
      >
        Nuevo Usuario
      </UButton>
    </div>

    <UCard>
      <UTable 
        :columns="columns" 
        :data="users" 
        :loading="loading"
        class="w-full"
      >
        <template #role-cell="{ row }">
          <UBadge 
            :color="getRoleColor(row.original.role) as any" 
            variant="subtle"
          >
            {{ getRoleLabel(row.original.role) }}
          </UBadge>
        </template>
        
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton 
              color="error" 
              variant="ghost" 
              icon="i-heroicons-trash" 
              size="xs"
              @click="handleDeleteUser(row.original.id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal 
      v-model:open="showModal"
      title="Crear Nuevo Usuario"
      description="Ingresa los datos del nuevo colaborador"
    >
      <template #body>
        <UForm 
          ref="form"
          :schema="schema"
          :state="formData"
          class="space-y-4"
          @submit="handleCreateUser"
        >
          <UFormField label="Nombre Completo" name="fullName">
            <UInput 
              v-model="formData.fullName" 
              icon="i-heroicons-user" 
              placeholder="Ej. Juan Pérez" 
              class="w-full"
            />
          </UFormField>
          
          <UFormField label="Email" name="email">
            <UInput 
              v-model="formData.email" 
              icon="i-heroicons-envelope" 
              type="email" 
              placeholder="email@ejemplo.com" 
              class="w-full"
            />
          </UFormField>

          <UFormField label="Contraseña Temporal" name="password">
            <UInput 
              v-model="formData.password" 
              icon="i-heroicons-key" 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              class="w-full"
            />
          </UFormField>

          <UFormField label="Rol" name="role">
            <USelectMenu 
              v-model="formData.role" 
              :items="roles" 
              value-key="value" 
              label-key="label"
              placeholder="Seleccionar rol"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton 
              color="neutral" 
              variant="ghost" 
              @click="showModal = false"
            >
              Cancelar
            </UButton>
            <UButton 
              type="submit" 
              :loading="saving" 
              color="primary"
            >
              Crear Usuario
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>