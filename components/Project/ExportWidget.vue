<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center h-4">
        <CardHeader>Export</CardHeader>
        <div class="flex items-center">
          <UBadge size="xs" variant="outline" color="yellow">WARN: In development</UBadge>                 
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <NuxtLink :href="`/api/projects/${project.id}/export?type=nvivo`" target="_blank">
        <UButton icon="i-mdi-microsoft-excel" variant="outline" color="blue">Export observation spreadsheet</UButton>
      </NuxtLink>
      <NuxtLink :href="`/api/projects/${project.id}/export?type=media`" target="_blank">
        <UButton icon="i-mdi-image-multiple-outline" variant="outline" color="blue">Export observation media</UButton>
      </NuxtLink>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  defineProps({
    project: requireProjectProp,
  });
</script>