<template>
  <div class="store-settings-page">
    <div class="page-header mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración de Tienda Online</h1>
          <p class="text-gray-600 dark:text-gray-400">Personaliza tu tienda en línea y gestiona cómo se ve</p>
        </div>
        <UButton
          v-if="settings?.slug"
          :href="`/store/${settings.slug}`"
          target="_blank"
          icon="i-heroicons-arrow-top-right-on-square"
          color="neutral"
          variant="soft"
        >
          Ver Mi Tienda
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="settings" class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-indigo-500" />
          Información Básica
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Tienda
            </label>
            <UInput
              v-model="formData.store_name"
              icon="i-heroicons-building-storefront"
              placeholder="Mi Tienda"
              :maxlength="100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
              <span class="text-gray-500 text-xs">{{ formData.store_description?.length || 0 }}/500</span>
            </label>
            <UTextarea
              v-model="formData.store_description"
              :rows="4"
              placeholder="Describe tu tienda, productos y servicios..."
              :maxlength="500"
            />
            <p class="text-xs text-gray-500 mt-1">Esta descripción se usará para SEO automáticamente</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de tu Tienda
            </label>
            <div class="flex items-center gap-2">
              <UInput
                :model-value="settings.slug"
                disabled
                icon="i-heroicons-link"
                class="flex-1"
              />
              <UButton
                v-if="settings.slug"
                icon="i-heroicons-clipboard-document"
                color="neutral"
                variant="soft"
                @click="copyStoreUrl"
              >
                Copiar
              </UButton>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ config.public.siteUrl }}/store/{{ settings.slug }}
            </p>
          </div>

          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <UCheckbox v-model="formData.is_enabled" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tienda Activa
              </span>
            </label>
            <p class="text-xs text-gray-500 mt-1">Cuando esté desactivada, los visitantes no podrán acceder</p>
          </div>
        </div>
      </div>

      <!-- Visual Customization -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <UIcon name="i-heroicons-paint-brush" class="w-6 h-6 text-indigo-500" />
          Personalización Visual
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Logo Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo
            </label>
            <div class="space-y-3">
              <div
                v-if="settings.logo_url"
                class="relative w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <img :src="settings.logo_url" alt="Logo" class="max-h-full max-w-full object-contain" />
                <button
                  @click="() => { if (settings) { settings.logo_url = null; formData.logo_url = null } }"
                  class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
              </div>
              <input
                ref="logoInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                @change="handleLogoUpload"
              />
              <UButton
                icon="i-heroicons-arrow-up-tray"
                color="neutral"
                variant="soft"
                block
                :loading="uploading"
                @click="() => logoInput?.click()"
              >
                {{ settings.logo_url ? 'Cambiar Logo' : 'Subir Logo' }}
              </UButton>
              <p class="text-xs text-gray-500">PNG, JPG o WebP. Máximo 2MB</p>
            </div>
          </div>

          <!-- Banner Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banner
            </label>
            <div class="space-y-3">
              <div
                v-if="settings.banner_url"
                class="relative w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <img :src="settings.banner_url" alt="Banner" class="w-full h-full object-cover" />
                <button
                  @click="() => { if (settings) { settings.banner_url = null; formData.banner_url = null } }"
                  class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
              </div>
              <input
                ref="bannerInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                @change="handleBannerUpload"
              />
              <UButton
                icon="i-heroicons-arrow-up-tray"
                color="neutral"
                variant="soft"
                block
                :loading="uploading"
                @click="() => bannerInput?.click()"
              >
                {{ settings.banner_url ? 'Cambiar Banner' : 'Subir Banner' }}
              </UButton>
              <p class="text-xs text-gray-500">PNG, JPG o WebP. Máximo 2MB. Recomendado: 1200x400px</p>
            </div>
          </div>

          <!-- Color Pickers -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Primario
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="formData.primary_color"
                type="color"
                class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <UInput v-model="formData.primary_color" :maxlength="7" class="flex-1" />
            </div>
            <p class="text-xs text-gray-500 mt-1">Color principal de tu tienda</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Secundario
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="formData.secondary_color"
                type="color"
                class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <UInput v-model="formData.secondary_color" :maxlength="7" class="flex-1" />
            </div>
            <p class="text-xs text-gray-500 mt-1">Color para acentos y botones</p>
          </div>
        </div>
      </div>

      <!-- Store Options -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-indigo-500" />
          Opciones de Tienda
        </h2>

        <div class="space-y-4">
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <UCheckbox v-model="formData.show_prices" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mostrar Precios
              </span>
            </label>
            <p class="text-xs text-gray-500 mt-1">Los precios de productos serán visibles para todos</p>
          </div>

          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <UCheckbox v-model="formData.allow_orders" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Permitir Órdenes en Línea
              </span>
            </label>
            <p class="text-xs text-gray-500 mt-1">Los clientes podrán hacer pedidos desde tu tienda</p>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <UIcon name="i-heroicons-phone" class="w-6 h-6 text-indigo-500" />
          Información de Contacto
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <UInput
              v-model="formData.contact_phone"
              icon="i-heroicons-phone"
              placeholder="8888-8888"
              :maxlength="20"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <UInput
              v-model="formData.contact_email"
              type="email"
              icon="i-heroicons-envelope"
              placeholder="tienda@ejemplo.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp
            </label>
            <UInput
              v-model="formData.contact_whatsapp"
              icon="i-simple-icons-whatsapp"
              placeholder="+506 8888-8888"
              :maxlength="20"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horario de Atención
            </label>
            <UTextarea
              v-model="formData.business_hours"
              :rows="3"
              placeholder="Lun - Vie: 9:00 AM - 6:00 PM&#10;Sáb: 10:00 AM - 2:00 PM"
              :maxlength="500"
            />
          </div>
        </div>
      </div>

      <!-- Social Media -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <UIcon name="i-heroicons-share" class="w-6 h-6 text-indigo-500" />
          Redes Sociales
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facebook
            </label>
            <UInput
              v-model="formData.facebook_url"
              icon="i-simple-icons-facebook"
              placeholder="https://facebook.com/tu-tienda"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instagram
            </label>
            <UInput
              v-model="formData.instagram_url"
              icon="i-simple-icons-instagram"
              placeholder="https://instagram.com/tu-tienda"
            />
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="soft"
          @click="resetForm"
        >
          Cancelar
        </UButton>
        <UButton
          icon="i-heroicons-check"
          :loading="saving"
          @click="saveSettings"
        >
          Guardar Cambios
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { loadSettings, updateSettings, uploadLogo, uploadBanner, settings, loading, uploading } = useStoreSettings()
const toast = useToast()
const config = useRuntimeConfig()
const saving = ref(false)

// Form data
const formData = reactive({
  store_name: '',
  store_description: '',
  primary_color: '#4F46E5',
  secondary_color: '#10B981',
  is_enabled: false,
  show_prices: true,
  allow_orders: true,
  contact_phone: '',
  contact_email: '',
  contact_whatsapp: '',
  business_hours: '',
  facebook_url: '',
  instagram_url: '',
  logo_url: null as string | null,
  banner_url: null as string | null
})

// Logo and banner refs
const logoInput = ref<HTMLInputElement>()
const bannerInput = ref<HTMLInputElement>()

// Load settings on mount
onMounted(async () => {
  await loadSettings()
  if (settings.value) {
    resetForm()
  }
})

// Reset form to current settings
const resetForm = () => {
  if (!settings.value) return
  
  formData.store_name = settings.value.store_name || ''
  formData.store_description = settings.value.store_description || ''
  formData.primary_color = settings.value.primary_color
  formData.secondary_color = settings.value.secondary_color
  formData.is_enabled = settings.value.is_enabled
  formData.show_prices = settings.value.show_prices
  formData.allow_orders = settings.value.allow_orders
  formData.contact_phone = settings.value.contact_phone || ''
  formData.contact_email = settings.value.contact_email || ''
  formData.contact_whatsapp = settings.value.contact_whatsapp || ''
  formData.business_hours = settings.value.business_hours || ''
  formData.facebook_url = settings.value.facebook_url || ''
  formData.instagram_url = settings.value.instagram_url || ''
  formData.logo_url = settings.value.logo_url || null
  formData.banner_url = settings.value.banner_url || null
}

// Handle logo upload
const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const result = await uploadLogo(file)
  if (result.success) {
    formData.logo_url = result.url || null
  }
  
  // Reset input
  target.value = ''
}

// Handle banner upload
const handleBannerUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const result = await uploadBanner(file)
  if (result.success) {
    formData.banner_url = result.url || null
  }
  
  // Reset input
  target.value = ''
}

// Copy store URL to clipboard
const copyStoreUrl = async () => {
  if (!settings.value?.slug) return
  
  const url = `${config.public.siteUrl}/store/${settings.value.slug}`
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      title: 'URL copiada',
      description: 'El enlace de tu tienda se copió al portapapeles',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo copiar el enlace',
      color: 'error'
    })
  }
}

// Save settings
const saveSettings = async () => {
  saving.value = true
  try {
    const result = await updateSettings(formData)
    if (result.success) {
      // Success notification is handled by the composable
    }
  } finally {
    saving.value = false
  }
}
</script>
