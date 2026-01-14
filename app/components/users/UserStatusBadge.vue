<script setup lang="ts">
const { getStatusLabel } = useOptions()

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
    {{ getStatusLabel(isActive ? 'active' : 'inactive') }}
  </UBadge>
</template>
