<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { sectorConfig } from '@/constants/sectorConfig'
import { productCategories } from '@/constants/productCategories'
import { formatCurrency } from '@/utils/formatters'

const { t } = useI18n()
const { getProducts, createProduct, updateProduct, deleteProduct } = useProducts()
const { getBusinessType } = useAuth()
const { labels, features, businessType } = useBusinessConfig()
const supabase = useSupabaseClient()
const toast = useToast()

const uploadingImage = ref(false)

const loading = ref(true)
const products = ref<any[]>([])
const showModal = ref(false)
const saving = ref(false)
const currentBusinessType = ref('retail')
const isEditing = ref(false)
const editingProductId = ref<string | null>(null)

// Dynamic fields based on sector (imported from constants)
const dynamicFields = computed(() => sectorConfig[currentBusinessType.value] ?? sectorConfig['retail'] ?? [])

// Categories with i18n
const categoryOptions = computed(() => 
  productCategories.map(cat => ({
    value: cat.value,
    label: t(cat.label_key)
  }))
)

const state = reactive({
  name: '',
  price: 0,
  cost: 0,
  stock_quantity: 0,
  category: '',
  sku: '',
  description: '',
  is_service: false,
  image_url: '' as string | null,
  metadata: {} as Record<string, any>
})

const baseSchema = z.object({
  name: z.string().min(2, t('products.form.validation.name_min')),
  price: z.number().min(0),
  cost: z.number().min(0),
  stock_quantity: z.number().int(),
  sku: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional()
})

const columns = computed(() => {
  const cols: any[] = [
    { accessorKey: 'name', header: t('products.columns.name') },
    { accessorKey: 'sku', header: t('products.columns.sku') },
    { accessorKey: 'category', header: t('products.columns.category') },
    { accessorKey: 'price', header: t('products.columns.price') },
    { accessorKey: 'stock_quantity', header: t('products.columns.stock') }
  ]
  
  if (currentBusinessType.value === 'pharmacy') {
    cols.splice(2, 0, { accessorKey: 'metadata.expiration_date', header: t('products.columns.expiration') })
  }
  if (currentBusinessType.value === 'fashion') {
    cols.splice(2, 0, { accessorKey: 'metadata.size', header: t('products.columns.size') })
  }
  if (currentBusinessType.value === 'services') {
    cols.splice(4, 1) 
    cols.splice(2, 0, { accessorKey: 'metadata.duration_minutes', header: t('products.columns.duration') })
  }
  
  cols.push({ id: 'actions', header: '' })
  return cols
})

async function loadData() {
  loading.value = true
  currentBusinessType.value = await getBusinessType()
  
  const { success, data } = await getProducts()
  if (success && data) products.value = data
  loading.value = false
}

function openCreateModal() {
  isEditing.value = false
  editingProductId.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(product: any) {
  isEditing.value = true
  editingProductId.value = product.id
  
  // Populate form with product data
  state.name = product.name
  state.price = product.price
  state.cost = product.cost || 0
  state.stock_quantity = product.stock_quantity || 0
  state.category = product.category || ''
  state.sku = product.sku || ''
  state.description = product.description || ''
  state.is_service = product.is_service || false
  state.image_url = product.image_url || null
  state.metadata = product.metadata || {}
  
  showModal.value = true
}

async function handleSubmit(event: FormSubmitEvent<any>) {
  for (const field of dynamicFields.value) {
    if (field.required && !state.metadata[field.key]) {
      toast.add({ title: 'Falta información', description: `El campo ${field.label} es requerido`, color: 'warning' })
      return
    }
  }

  saving.value = true
  
  const productData = {
    name: state.name,
    price: state.price,
    cost: state.cost,
    stock_quantity: state.stock_quantity,
    category: state.category,
    sku: state.sku,
    description: state.description,
    is_service: state.is_service,
    image_url: state.image_url,
    metadata: state.metadata
  }

  let result
  
  if (isEditing.value && editingProductId.value) {
    result = await updateProduct(editingProductId.value, productData)
  } else {
    result = await createProduct(productData)
  }
  
  if (result.success) {
    toast.add({ 
      title: isEditing.value ? 'Producto actualizado' : 'Producto creado', 
      color: 'success' 
    })
    showModal.value = false
    resetForm()
    loadData()
  } else {
    toast.add({ title: 'Error', description: result.error, color: 'error' })
  }
  saving.value = false
}

function resetForm() {
  state.name = ''
  state.price = 0
  state.cost = 0
  state.stock_quantity = 0
  state.category = ''
  state.sku = ''
  state.description = ''
  state.is_service = false
  state.image_url = null
  state.metadata = {}
}

async function handleImageUpload(event: any) {
  const file = event.target.files[0]
  if (!file) return

  uploadingImage.value = true
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${fileName}`

  try {
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    state.image_url = publicUrl
    toast.add({ title: t('products.messages.image_uploaded'), color: 'success' })
  } catch (error: any) {
    toast.add({ title: t('products.messages.image_upload_error'), description: error.message, color: 'error' })
  } finally {
    uploadingImage.value = false
  }
}

// CORRECCIÓN REACTIVIDAD DE ELIMINACIÓN
async function handleDelete(id: string) {
  if(!confirm(t('products.messages.delete_confirm'))) return
  
  // 1. Llamada a la API
  const { success, error } = await deleteProduct(id)
  
  if (success) {
    // 2. Actualización Local Inmediata (Sin esperar refresh)
    products.value = products.value.filter(p => p.id !== id)
    toast.add({ title: t('products.messages.deleted'), color: 'success' })
  } else {
    toast.add({ title: t('products.messages.error'), description: error, color: 'error' })
  }
}

// Quick stock update
async function quickStockUpdate(product: any, delta: number) {
  const newStock = Math.max(0, (product.stock_quantity || 0) + delta)
  const { success } = await updateProduct(product.id, { stock_quantity: newStock })
  
  if (success) {
    product.stock_quantity = newStock
    toast.add({ title: t('products.messages.stock_updated'), color: 'success' })
  }
}

const route = useRoute()

onMounted(async () => {
  await loadData()
  
  // Deep link support: Open edit modal if ?edit=ID is present
  if (route.query.edit) {
      const productId = route.query.edit as string
      const product = products.value.find(p => p.id === productId)
      if (product) {
          openEditModal(product)
      }
  }
})

// Clear query param when closing modal
watch(showModal, (isOpen) => {
    if (!isOpen && route.query.edit) {
        useRouter().push({ query: { ...route.query, edit: undefined } })
    }
})

</script>

<template>
  <div class="space-y-6">
    <PageHeader 
      :title="labels.products"
      icon="i-heroicons-cube"
      :subtitle="t('products.subtitle', { mode: currentBusinessType })"
    >
      <template #actions>
        <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal">
          {{ currentBusinessType === 'services' 
            ? t('products.buttons.new_service') 
            : (currentBusinessType === 'gastronomy' 
              ? t('products.buttons.new_dish') 
              : t('products.buttons.new'))
          }}
        </UButton>
      </template>
    </PageHeader>

    <UCard>
      <UTable :columns="columns" :data="products" :loading="loading">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <div v-if="row.original.image_url" class="relative group w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                <img :src="row.original.image_url" class="w-full h-full object-cover" />
            </div>
            <UIcon v-if="row.original.is_service" name="i-heroicons-wrench-screwdriver" class="w-4 h-4 text-blue-500" />
            <span class="font-medium">{{ row.original.name }}</span>
          </div>
        </template>
        
        <template #price-cell="{ row }">
          <span class="font-medium">₡{{ row.original.price.toLocaleString() }}</span>
        </template>
        
        <template #stock_quantity-cell="{ row }">
          <div v-if="row.original.is_service" class="text-gray-400 text-xs">N/A</div>
          <div v-else class="flex items-center gap-2">
            <UButton 
              size="xs" 
              variant="ghost" 
              color="neutral" 
              icon="i-heroicons-minus"
              @click="quickStockUpdate(row.original, -1)"
            />
            <UBadge :color="row.original.stock_quantity < 5 ? 'error' : 'success'" variant="subtle">
              {{ row.original.stock_quantity || 0 }}
            </UBadge>
            <UButton 
              size="xs" 
              variant="ghost" 
              color="neutral" 
              icon="i-heroicons-plus"
              @click="quickStockUpdate(row.original, 1)"
            />
          </div>
        </template>

        <template #metadata.expiration_date-cell="{ row }">
          <span v-if="row.original.metadata?.expiration_date" class="text-xs font-mono text-red-600 dark:text-red-400">
            {{ row.original.metadata.expiration_date }}
          </span>
          <span v-else>-</span>
        </template>

        <template #metadata.duration_minutes-cell="{ row }">
          <span v-if="row.original.metadata?.duration_minutes">
            {{ row.original.metadata.duration_minutes }} min
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton 
              color="primary" 
              variant="ghost" 
              icon="i-heroicons-pencil" 
              size="xs" 
              @click="openEditModal(row.original)" 
            />
            <UButton 
              color="error" 
              variant="ghost" 
              icon="i-heroicons-trash" 
              size="xs" 
              @click="handleDelete(row.original.id)" 
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal 
      v-model:open="showModal" 
      :title="isEditing ? t('products.modal.title_edit') : t('products.modal.title_new')"
    >
      <template #body>
        <UForm :schema="baseSchema" :state="state" class="space-y-4" @submit="handleSubmit">
          
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-wider">
              {{ t('products.modal.section_basic') }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField :label="t('products.form.labels.name')" name="name" class="md:col-span-2">
                <UInput 
                  v-model="state.name" 
                  icon="i-heroicons-tag" 
                  :placeholder="currentBusinessType === 'services' 
                    ? t('products.form.placeholders.name_service') 
                    : t('products.form.placeholders.name')" 
                />
              </UFormField>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {{ t('products.form.labels.image') }}
                </label>
                <div class="flex items-center gap-4">
                    <div v-if="state.image_url" class="relative group">
                        <img :src="state.image_url" class="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                        <button type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" @click="state.image_url = null">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>
                    <div v-else class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
                        <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div class="flex-grow">
                        <input type="file" accept="image/*" @change="handleImageUpload" class="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100
                        "/>
                        <p class="text-xs text-gray-500 mt-1" v-if="uploadingImage">Subiendo...</p>
                    </div>
                </div>
              </div>

              <UFormField :label="t('products.form.labels.price')" name="price">
                <UInput v-model.number="state.price" type="number" :placeholder="t('products.form.placeholders.price')">
                  <template #leading>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">₡</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField :label="t('products.form.labels.stock')" name="stock_quantity">
                <UInput v-model.number="state.stock_quantity" type="number" icon="i-heroicons-cube" :placeholder="t('products.form.placeholders.price')" />
              </UFormField>
              
              <div class="md:col-span-2">
                <UCheckbox v-model="state.is_service" label="Es un servicio (no controla inventario)" color="primary" />
              </div>
            </div>
          </div>

          <div v-if="dynamicFields.length > 0" class="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-100 dark:border-primary-900">
            <h3 class="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-wider">
              {{ t('products.modal.section_specific') }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <template v-for="field in dynamicFields" :key="field.key">
                <UFormField 
                  v-if="['text', 'number', 'date'].includes(field.type)"
                  :label="t(field.label_key)" 
                  :name="`metadata.${field.key}`"
                  :required="field.required"
                >
                  <UInput 
                    v-model="state.metadata[field.key]" 
                    :type="field.type" 
                    :icon="field.icon"
                    :placeholder="t(field.label_key)"
                  />
                </UFormField>
                <div v-if="field.type === 'boolean'" class="flex items-center h-full pt-1">
                    <UCheckbox 
                      v-model="state.metadata[field.key]" 
                      :label="t(field.label_key)" 
                      color="primary"
                    />
                  </div>
                  <UFormField 
                    v-if="field.type === 'select'"
                    :label="t(field.label_key)"
                  >
                    <USelectMenu 
                      v-model="state.metadata[field.key]" 
                      :items="field.options" 
                      class="w-full"
                    />
                  </UFormField>
              </template>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <UFormField :label="t('products.form.labels.cost')" name="cost">
                <UInput v-model.number="state.cost" type="number" placeholder="0">
                  <template #leading>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">₡</span>
                  </template>
                </UInput>
              </UFormField>
             <UFormField :label="t('products.form.labels.category')" name="category">
                <USelectMenu v-model="state.category" :items="categoryOptions" class="w-full" />
             </UFormField>
             <UFormField :label="t('products.form.labels.sku')" name="sku" class="col-span-2">
                <UInput v-model="state.sku" icon="i-heroicons-qr-code" :placeholder="t('products.form.placeholders.sku')" />
              </UFormField>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <UButton color="neutral" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" :loading="saving" color="primary">
              {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>