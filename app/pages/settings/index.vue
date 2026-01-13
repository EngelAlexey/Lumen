<template>
  <div class="settings-page">
    <div class="page-header mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
      <p class="text-gray-600 dark:text-gray-400">Gestiona tu perfil y los datos de tu negocio</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Tabs Sidebar -->
      <div class="md:col-span-1">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full text-left px-4 py-3 rounded-md transition-colors flex items-center gap-3"
            :class="activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            <UIcon :name="tab.icon" class="w-5 h-5" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="md:col-span-3">
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
            <UIcon name="i-heroicons-user-circle" class="w-6 h-6 text-indigo-500" />
            Mi Perfil
          </h2>
          
          <form @submit.prevent="handleUpdateProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
                <UInput v-model="profileForm.fullName" icon="i-heroicons-user" placeholder="Tu nombre" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
                <UInput v-model="profileForm.email" icon="i-heroicons-envelope" disabled class="opacity-75" />
                <p class="text-xs text-gray-500 mt-1">El correo no se puede cambiar.</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rol</label>
                <UBadge color="primary" variant="subtle" size="lg">{{ roleLabel }}</UBadge>
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <UButton type="submit" :loading="saving" color="primary">
                Guardar Cambios
              </UButton>
            </div>
          </form>
        </div>

        <!-- Business Settings -->
        <div v-if="activeTab === 'business'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div v-if="!isOwner && !isManager" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Solo los propietarios y gerentes pueden editar los datos del negocio.</p>
          </div>

          <div v-else>
            <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
              <UIcon name="i-heroicons-building-storefront" class="w-6 h-6 text-indigo-500" />
              Mi Negocio
            </h2>
            
            <form @submit.prevent="handleUpdateBusiness" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del Negocio</label>
                  <UInput v-model="businessForm.name" icon="i-heroicons-building-storefront" placeholder="Nombre de tu negocio" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Negocio</label>
                  <USelectMenu 
                    v-model="businessForm.type" 
                    :items="businessTypes"
                    value-key="value"
                    placeholder="Selecciona el tipo"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teléfono / WhatsApp</label>
                  <UInput v-model="businessForm.phone" icon="i-heroicons-phone" placeholder="8888-8888" />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dirección</label>
                  <UTextarea v-model="businessForm.address" :rows="3" placeholder="Dirección del negocio" />
                </div>
              </div>

              <!-- Info sobre tipo de negocio -->
              <div v-if="businessForm.type" class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p class="text-sm text-indigo-700 dark:text-indigo-300">
                  <strong>Modo:</strong> {{ getBusinessTypeLabel(businessForm.type) }}
                </p>
                <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  El menú y funcionalidades se adaptarán al cambiar el tipo de negocio.
                </p>
              </div>

              <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <UButton type="submit" :loading="saving" color="primary">
                  Actualizar Negocio
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Confirmation Modal for Business Type Change -->
    <UModal v-model:open="showResetModal" title="Cambio de Tipo de Negocio">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-500">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8" />
            <h3 class="text-lg font-bold">Atención</h3>
          </div>
          
          <p class="text-gray-600 dark:text-gray-300">
            Estás cambiando de <strong>{{ getBusinessTypeLabel(currentBusinessType || '') }}</strong> a <strong>{{ getBusinessTypeLabel(pendingBusinessType || '') }}</strong>.
          </p>

          <p class="text-gray-600 dark:text-gray-300 font-medium">
            Para evitar incompatibilidades, puedes seleccionar qué datos eliminar:
          </p>

          <div class="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <div class="flex items-start gap-3">
               <UCheckbox v-model="resetOptions.transactions" />
               <div>
                  <span class="block font-medium text-gray-900 dark:text-white">Borrar Ventas y Caja</span>
                  <span class="text-xs text-gray-500">Recomendado. Elimina historial de ventas, cortes de caja e items.</span>
               </div>
            </div>

            <div class="flex items-start gap-3">
               <UCheckbox v-model="resetOptions.products" />
               <div>
                  <span class="block font-medium text-gray-900 dark:text-white">Borrar Catálogo de Productos</span>
                  <span class="text-xs text-gray-500">Útil si cambias de rubro (ej. Tienda a Restaurante).</span>
               </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
             <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
             <span>Usuarios y Clientes se mantendrán seguros.</span>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton color="neutral" variant="soft" @click="showResetModal = false">Cancelar</UButton>
          <UButton color="warning" :loading="saving" @click="executeBusinessUpdate">
            Confirmar Cambio
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<any>()
const { updateProfile, updateBusiness } = useAuth()
const { getRoleLabel, isOwner, isManager, currentRole } = useRoles()
const { loadBusinessType, config, businessType: currentBusinessType } = useBusinessConfig()
const userStore = useUserStore()
const toast = useToast()

const loading = computed(() => userStore.loading && !userStore.initialized)
const saving = ref(false)
const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Mi Perfil', icon: 'i-heroicons-user-circle' },
  { id: 'business', label: 'Mi Negocio', icon: 'i-heroicons-building-storefront' },
]

import { BUSINESS_TYPES } from '~/constants/businessTypes'

const businessTypes = BUSINESS_TYPES

const profileForm = reactive({
  fullName: '',
  email: ''
})

const businessForm = reactive({
  id: '',
  name: '',
  type: '',
  phone: '',
  address: ''
})

const roleLabel = computed(() => {
    if (currentRole.value) return getRoleLabel(currentRole.value)
    if (userStore.loading) return 'Cargando...'
    return 'Sin Rol'
})

const getBusinessTypeLabel = (type: string) => {
  const found = businessTypes.find(t => t.value === type)
  return found?.label || type
}

// Sync forms with Store Data
watchEffect(() => {
    if (userStore.profile) {
        profileForm.fullName = userStore.profile.full_name || ''
        profileForm.email = userStore.profile.email || userStore.user?.email || ''
    }
    
    if (userStore.business) {
        businessForm.id = userStore.business.id
        businessForm.name = userStore.business.name || ''
        businessForm.type = userStore.business.business_type || 'retail'
        businessForm.phone = userStore.business.phone || ''
        businessForm.address = userStore.business.address || ''
    }
})

onMounted(async () => {
    if (!userStore.initialized) {
        await userStore.initialize()
    }
})

const handleUpdateProfile = async () => {
  saving.value = true
  try {
    const { success, error } = await updateProfile({
      full_name: profileForm.fullName,
    })

    if (success) {
      toast.add({ title: 'Perfil actualizado', color: 'success' })
    } else {
      toast.add({ title: 'Error al actualizar', description: error, color: 'error' })
    }
  } finally {
    saving.value = false
  }
}

// === Logic for Data Cleaning on Business Type Change ===
const showResetModal = ref(false)
const pendingBusinessType = ref<string | null>(null)
const resetOptions = reactive({
  transactions: false,
  products: false
})

const handleUpdateBusiness = async () => {
  // Check if business type is changing
  if (businessForm.type !== currentBusinessType.value) {
    pendingBusinessType.value = businessForm.type
    showResetModal.value = true
    return
  }
  
  // If not changing type, just update normally
  await executeBusinessUpdate()
}

const executeBusinessUpdate = async () => {
  saving.value = true
  try {
    // 1. Execute Data Cleaning if requested
    if (showResetModal.value && (resetOptions.transactions || resetOptions.products)) {
        if (businessForm.id) {
           await $fetch('/api/businesses/reset', {
             method: 'POST',
             body: {
               business_id: businessForm.id,
               delete_transactions: resetOptions.transactions,
               delete_products: resetOptions.products
             }
           })
        }
    }

    // 2. Update Business Info
    const { success, error } = await updateBusiness({
      name: businessForm.name,
      business_type: businessForm.type,
      phone: businessForm.phone,
      address: businessForm.address
    })

    if (success) {
      toast.add({ title: 'Negocio actualizado', color: 'success' })
      // Since it's realtime, store will update. 
      // We can force a reload of business config logic if needed, 
      // but useBusinessConfig is now reactive to store.
      
      toast.add({ 
        title: 'Menú actualizado', 
        description: 'La navegación se ha adaptado al nuevo tipo de negocio.',
        color: 'info' 
      })
      showResetModal.value = false
      resetOptions.transactions = false
      resetOptions.products = false
    } else {
      console.error('Update error details:', error)
      toast.add({ title: 'Error al actualizar', description: error, color: 'error' })
    }
  } catch (e: any) {
      toast.add({ title: 'Error', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>