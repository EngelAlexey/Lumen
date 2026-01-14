<script setup lang="ts">
defineProps<{
  isActive: boolean
}>()
</script>

<template>
  <UBadge 
    :color="isActive ? 'success' : 'error'" 
    variant="solid" 
    size="md"
  >
    {{ isActive ? 'Activo' : 'Inactivo' }}
  </UBadge>
</template>
