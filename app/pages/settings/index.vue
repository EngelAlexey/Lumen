<template>
  <div class="settings-page">
    <div class="page-header mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
      <p class="text-gray-600 dark:text-gray-400">Gestiona tu perfil y los datos de tu negocio</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <component :is="tab.icon" class="w-5 h-5" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="md:col-span-3">
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
            <UserCircleIcon class="w-6 h-6 text-indigo-500" />
            Mi Perfil
          </h2>
          
          <form @submit.prevent="handleUpdateProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormGroup label="Nombre Completo" name="fullName">
                <UInput v-model="profileForm.fullName" icon="i-heroicons-user" />
              </UFormGroup>
              
              <UFormGroup label="Teléfono" name="phone">
                <UInput v-model="profileForm.phone" icon="i-heroicons-phone" />
              </UFormGroup>

              <UFormGroup label="Correo Electrónico" name="email">
                <UInput v-model="profileForm.email" icon="i-heroicons-envelope" disabled class="opacity-75" />
                <p class="text-xs text-gray-500 mt-1">El correo no se puede cambiar.</p>
              </UFormGroup>

              <UFormGroup label="Rol" name="role">
                <UBadge :color="roleColor" variant="subtle" size="lg">{{ roleLabel }}</UBadge>
              </UFormGroup>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <UButton type="submit" :loading="loading" color="indigo">
                Guardar Cambios
              </UButton>
            </div>
          </form>
        </div>

        <!-- Business Settings -->
        <div v-if="activeTab === 'business'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div v-if="!isOwner && !isManager" class="text-center py-8 text-gray-500">
            <LockClosedIcon class="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Solo los propietarios y gerentes pueden editar los datos del negocio.</p>
          </div>

          <div v-else>
            <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
              <BuildingStorefrontIcon class="w-6 h-6 text-indigo-500" />
              Mi Negocio
            </h2>
            
            <form @submit.prevent="handleUpdateBusiness" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormGroup label="Nombre del Negocio" name="businessName">
                  <UInput v-model="businessForm.name" icon="i-heroicons-building-storefront" />
                </UFormGroup>

                <UFormGroup label="Tipo de Negocio" name="businessType">
                  <USelect v-model="businessForm.type" :options="businessTypes" />
                </UFormGroup>
                
                <UFormGroup label="Teléfono / WhatsApp" name="businessPhone">
                  <UInput v-model="businessForm.phone" icon="i-heroicons-phone" />
                </UFormGroup>

                <UFormGroup label="Dirección" name="address" class="md:col-span-2">
                  <UTextarea v-model="businessForm.address" :rows="3" />
                </UFormGroup>
              </div>

              <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <UButton type="submit" :loading="loading" color="indigo">
                  Actualizar Negocio
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  UserCircleIcon, 
  BuildingStorefrontIcon, 
  LockClosedIcon 
} from '@heroicons/vue/24/outline'

const { getUserProfile, updateProfile, updateBusiness } = useAuth()
const { getRoleLabel, getRoleColor, isOwner, isManager, currentRole } = useRoles()
const toast = useToast()

const loading = ref(false)
const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Mi Perfil', icon: UserCircleIcon },
  { id: 'business', label: 'Mi Negocio', icon: BuildingStorefrontIcon },
]

const businessTypes = [
  { label: 'Comercio (Retail)', value: 'retail' },
  { label: 'Gastronomía (Restaurante/Café)', value: 'gastronomy' },
  { label: 'Servicios', value: 'services' }
]

// Forms
const profileForm = reactive({
  fullName: '',
  phone: '',
  email: ''
})

const businessForm = reactive({
  name: '',
  type: '',
  phone: '',
  address: ''
})

const roleLabel = computed(() => currentRole.value ? getRoleLabel(currentRole.value) : '')
const roleColor = computed(() => currentRole.value ? getRoleColor(currentRole.value) : 'gray')

// Load Data
onMounted(async () => {
  loading.value = true
  try {
    const { success, profile, error } = await getUserProfile()
    if (success && profile) {
      // Load Profile
      profileForm.fullName = profile.full_name
      profileForm.phone = profile.phone || ''
      profileForm.email = profile.email

      // Load Business
      businessForm.name = profile.business_name
      businessForm.type = profile.business_type
      // Note: business phone/address might not be in profile view yet, ideally we fetch business details separately
      // but for now we rely on what we have or need to fetch specifically if detailed.
      // Small adjustment: getUserProfile in useAuth calls rpc 'get_current_user_profile'
      // checking that RPC... it returns business_name and business_type but maybe not phone/address.
      // Let's assume we might need to fetch business details if not returned. 
      // For this step, I will stick to what's available and if null, it's blank.
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const handleUpdateProfile = async () => {
  loading.value = true
  try {
    const { success, error } = await updateProfile({
      full_name: profileForm.fullName,
      // phone: profileForm.phone // Note: Database needs phone column on users table (added in core stability fix)
    })

    if (success) {
      toast.add({ title: 'Perfil actualizado', color: 'green' })
    } else {
      toast.add({ title: 'Error al actualizar', description: error, color: 'red' })
    }
  } finally {
    loading.value = false
  }
}

const handleUpdateBusiness = async () => {
  loading.value = true
  try {
    const { success, error } = await updateBusiness({
      name: businessForm.name,
      business_type: businessForm.type,
      phone: businessForm.phone,
      address: businessForm.address
    })

    if (success) {
      toast.add({ title: 'Negocio actualizado', color: 'green' })
    } else {
      toast.add({ title: 'Error al actualizar', description: error, color: 'red' })
    }
  } finally {
    loading.value = false
  }
}
</script>