<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { getProducts, createProduct, deleteProduct } = useProducts()
const { getBusinessType } = useAuth()
const toast = useToast()

const loading = ref(true)
const products = ref<any[]>([])
const showModal = ref(false)
const saving = ref(false)
const currentBusinessType = ref('retail')

// Configuración Normalizada de Sectores
const sectorConfig: Record<string, any[]> = {
  // Sector: Servicios (Taller, Estética, Consultoría)
  services: [
    { key: 'duration_minutes', label: 'Duración (min)', type: 'number', required: false, icon: 'i-heroicons-clock' },
    { key: 'technician_name', label: 'Técnico/Encargado', type: 'text', required: false, icon: 'i-heroicons-user' },
    { key: 'requires_appointment', label: 'Requiere Cita', type: 'boolean', required: false },
    { key: 'warranty_period', label: 'Garantía (días)', type: 'number', required: false }
  ],
  // Sector: Retail General (Tienda, Bazar, Super)
  retail: [
    { key: 'brand', label: 'Marca', type: 'text', required: false, icon: 'i-heroicons-tag' },
    { key: 'model', label: 'Modelo', type: 'text', required: false },
    { key: 'min_stock', label: 'Stock Mínimo', type: 'number', required: false, icon: 'i-heroicons-bell-alert' }
  ],
  // Sector: Gastronomía (Restaurante, Soda)
  gastronomy: [
    { key: 'is_vegan', label: 'Vegano', type: 'boolean', required: false },
    { key: 'is_gluten_free', label: 'Sin Gluten', type: 'boolean', required: false },
    { key: 'is_spicy', label: 'Picante', type: 'boolean', required: false },
    { key: 'preparation_time', label: 'Tiempo Prep. (min)', type: 'number', required: false, icon: 'i-heroicons-clock' }
  ],
  // Sector: Farmacia (Especializado)
  pharmacy: [
    { key: 'expiration_date', label: 'Vencimiento', type: 'date', required: true, icon: 'i-heroicons-calendar' },
    { key: 'batch_number', label: 'Lote', type: 'text', required: true, icon: 'i-heroicons-archive-box' },
    { key: 'laboratory', label: 'Laboratorio', type: 'text', required: false, icon: 'i-heroicons-beaker' },
    { key: 'prescription_required', label: 'Requiere Receta', type: 'boolean', required: false }
  ],
  // Sector: Moda/Fashion (Especializado)
  fashion: [
    { key: 'brand', label: 'Marca', type: 'text', required: false },
    { key: 'size', label: 'Talla', type: 'select', options: ['XS','S','M','L','XL','XXL','Unica'], required: true },
    { key: 'color', label: 'Color', type: 'text', required: true, icon: 'i-heroicons-swatch' },
    { key: 'material', label: 'Material', type: 'text', required: false }
  ]
}

const dynamicFields = computed(() => sectorConfig[currentBusinessType.value] ?? sectorConfig['retail'] ?? [])

const state = reactive({
  name: '',
  price: 0,
  cost: 0,
  stock_quantity: 0,
  category: '',
  sku: '',
  description: '',
  metadata: {} as Record<string, any>
})

const baseSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  price: z.number().min(0),
  cost: z.number().min(0),
  stock_quantity: z.number().int(),
  sku: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional()
})

const categories = ['General', 'Servicios', 'Bebidas', 'Alimentos', 'Cuidado Personal', 'Electrónica', 'Ropa', 'Medicamentos']

const columns = computed(() => {
  const cols: any[] = [
    { accessorKey: 'name', header: 'Producto/Servicio' },
    { accessorKey: 'sku', header: 'Código' },
    { accessorKey: 'category', header: 'Categoría' },
    { accessorKey: 'price', header: 'Precio' },
    { accessorKey: 'stock_quantity', header: 'Stock' }
  ]
  
  if (currentBusinessType.value === 'pharmacy') {
    cols.splice(2, 0, { accessorKey: 'metadata.expiration_date', header: 'Vence' })
  }
  if (currentBusinessType.value === 'fashion') {
    cols.splice(2, 0, { accessorKey: 'metadata.size', header: 'Talla' })
  }
  if (currentBusinessType.value === 'services') {
    cols.splice(4, 1) // Quitar columna de stock visualmente si es puro servicio (opcional)
    cols.splice(2, 0, { accessorKey: 'metadata.duration_minutes', header: 'Minutos' })
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

async function handleCreate(event: FormSubmitEvent<any>) {
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
    metadata: state.metadata
  }

  const { success, error } = await createProduct(productData)
  
  if (success) {
    toast.add({ title: 'Guardado exitosamente', color: 'success' })
    showModal.value = false
    resetForm()
    loadData()
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
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
  state.metadata = {}
}

// CORRECCIÓN REACTIVIDAD DE ELIMINACIÓN
async function handleDelete(id: string) {
  if(!confirm('¿Estás seguro de eliminar este ítem?')) return
  
  // 1. Llamada a la API
  const { success, error } = await deleteProduct(id)
  
  if (success) {
    // 2. Actualización Local Inmediata (Sin esperar refresh)
    products.value = products.value.filter(p => p.id !== id)
    toast.add({ title: 'Eliminado', color: 'success' })
  } else {
    toast.add({ title: 'Error', description: error, color: 'error' })
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white capitalize">
          {{ currentBusinessType === 'services' ? 'Catálogo de Servicios' : 'Inventario de Productos' }}
        </h2>
        <p class="text-sm text-gray-500">
          Modo: <span class="font-semibold text-primary-600 capitalize">{{ currentBusinessType }}</span>
        </p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="showModal = true">
        {{ currentBusinessType === 'services' ? 'Nuevo Servicio' : 'Nuevo Producto' }}
      </UButton>
    </div>

    <UCard>
      <UTable :columns="columns" :data="products" :loading="loading">
        <template #price-cell="{ row }">
          <span class="font-medium">₡{{ row.original.price.toLocaleString() }}</span>
        </template>
        
        <template #stock_quantity-cell="{ row }">
          <span v-if="currentBusinessType === 'services'" class="text-gray-400 text-xs">N/A</span>
          <UBadge v-else :color="row.original.stock_quantity < 5 ? 'error' : 'success'" variant="subtle">
            {{ row.original.stock_quantity }}
          </UBadge>
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
          <div class="flex justify-end">
            <UButton color="error" variant="ghost" icon="i-heroicons-trash" size="xs" @click="handleDelete(row.original.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="showModal" title="Nuevo Producto">
      <template #body>
        <UForm :schema="baseSchema" :state="state" class="space-y-4" @submit="handleCreate">
          
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-wider">Datos Básicos</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Nombre" name="name" class="md:col-span-2">
                <UInput v-model="state.name" icon="i-heroicons-tag" :placeholder="currentBusinessType === 'services' ? 'Ej. Mantenimiento Preventivo' : 'Ej. Coca Cola 2.5L'" />
              </UFormField>

              <UFormField label="Precio Venta" name="price">
                <UInput v-model.number="state.price" type="number" placeholder="0">
                  <template #leading>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">₡</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField v-if="currentBusinessType !== 'services'" label="Stock" name="stock_quantity">
                <UInput v-model.number="state.stock_quantity" type="number" icon="i-heroicons-cube" placeholder="0" />
              </UFormField>
              
              <UFormField v-else label="Stock (Opcional)" name="stock_quantity" help="Dejar en 0 si es ilimitado">
                 <UInput v-model.number="state.stock_quantity" type="number" icon="i-heroicons-cube" />
              </UFormField>
            </div>
          </div>

          <div v-if="dynamicFields.length > 0" class="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-100 dark:border-primary-900">
            <h3 class="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-wider">
              Detalles Específicos
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <template v-for="field in dynamicFields" :key="field.key">
                <UFormField 
                  v-if="['text', 'number', 'date'].includes(field.type)"
                  :label="field.label" 
                  :name="`metadata.${field.key}`"
                  :required="field.required"
                >
                  <UInput 
                    v-model="state.metadata[field.key]" 
                    :type="field.type" 
                    :icon="field.icon"
                    :placeholder="field.label"
                  />
                </UFormField>
                <div v-if="field.type === 'boolean'" class="flex items-center h-full pt-1">
                    <UCheckbox 
                      v-model="state.metadata[field.key]" 
                      :label="field.label" 
                      color="primary"
                    />
                  </div>
                  <UFormField 
                    v-if="field.type === 'select'"
                    :label="field.label"
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
             <UFormField label="Costo (Opcional)" name="cost">
                <UInput v-model.number="state.cost" type="number" placeholder="0">
                  <template #leading>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">₡</span>
                  </template>
                </UInput>
              </UFormField>
             <UFormField label="Categoría" name="category">
                <USelectMenu v-model="state.category" :items="categories" class="w-full" />
             </UFormField>
             <UFormField label="SKU / Código" name="sku" class="col-span-2">
                <UInput v-model="state.sku" icon="i-heroicons-qr-code" placeholder="Código de barras o referencia" />
              </UFormField>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <UButton color="neutral" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" :loading="saving" color="primary">Guardar</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>