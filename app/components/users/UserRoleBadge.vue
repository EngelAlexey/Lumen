<script setup lang="ts">
import type { UserRole } from '@/composables/useRoles'

defineProps<{
  role: UserRole
}>()

const { getRoleLabel, getRoleColor } = useRoles()
</script>

<template>
  <UBadge 
    :color="getRoleColor(role) as any" 
    variant="subtle"
  >
    {{ getRoleLabel(role) }}
  </UBadge>
</template>
