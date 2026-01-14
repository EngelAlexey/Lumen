<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
    <div class="flex flex-wrap gap-2 w-full sm:w-auto items-center">
       <UInput 
         :model-value="modelValue"
         @update:model-value="$emit('update:modelValue', $event)"
         icon="i-heroicons-magnifying-glass" 
         :placeholder="placeholder || 'Buscar...'"
         class="min-w-[200px]"
       />
       
       <slot />
    </div>

    <slot name="actions" />
  </div>
</template>
