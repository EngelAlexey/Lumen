<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { roles } from '../../constants/options'

const props = defineProps<{
  user?: any
  loading?: boolean
}>()

const emit = defineEmits(['close', 'submit'])

const schema = z.object({
  fullName: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  role: z.string()
})

const state = reactive({
  email: '',
  password: '',
  fullName: '',
  role: 'cashier'
})

const selectedRole = ref(roles[1])

watch(() => props.user, (newUser) => {
  if (newUser) {
    state.email = newUser.email
    state.password = ''
    state.fullName = newUser.full_name || ''
    
    const roleObj = roles.find(r => r.value === newUser.role)
    if (roleObj) {
      selectedRole.value = roleObj
      state.role = roleObj.value
    } else {
      const defaultRole = roles[1]
      if (defaultRole) {
        selectedRole.value = defaultRole
        state.role = defaultRole.value
      }
    }
  } else {
    state.email = ''
    state.password = ''
    state.fullName = ''
    state.role = 'cashier'
    selectedRole.value = roles[1]
  }
}, { immediate: true })

watch(selectedRole, (newRole) => {
  if (newRole) {
    state.role = newRole.value
  }
})

function handleSubmit(event: FormSubmitEvent<any>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm 
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <UFormField label="Nombre Completo" name="fullName">
      <UInput 
        v-model="state.fullName" 
        icon="i-heroicons-user" 
        placeholder="Ej. Juan Pérez" 
        class="w-full"
      />
    </UFormField>
    
    <UFormField label="Email" name="email">
      <UInput 
        v-model="state.email" 
        icon="i-heroicons-envelope" 
        type="email" 
        placeholder="email@ejemplo.com" 
        class="w-full"
      />
    </UFormField>

    <UFormField label="Contraseña Temporal" name="password">
      <UInput 
        v-model="state.password" 
        icon="i-heroicons-key" 
        type="password" 
        placeholder="Mínimo 6 caracteres" 
        class="w-full"
      />
      <span v-if="user" class="text-xs text-gray-500 mt-1 block">Dejar en blanco para mantener la actual</span>
    </UFormField>

    <UFormField label="Rol" name="role">
      <USelectMenu 
        v-model="selectedRole" 
        :items="roles" 
        option-attribute="label"
        placeholder="Seleccionar rol"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3 mt-6">
      <UButton 
        color="neutral" 
        variant="ghost" 
        @click="$emit('close')"
      >
        Cancelar
      </UButton>
      <UButton 
        type="submit" 
        :loading="loading" 
        color="primary"
      >
        {{ user ? 'Guardar Cambios' : 'Crear Usuario' }}
      </UButton>
    </div>
  </UForm>
</template>
