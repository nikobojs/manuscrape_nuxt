<template>
  <div class="w-full flex flex-row-reverse items-center gap-2">
    <UIcon name="i-heroicons-server" class="text-lg shrink-0" />
    <UProgress
      :model-value="Math.min(100, (used / limit) * 100)"
      class="w-full"
    />
    <div class="text-sm text-[#75809f] whitespace-nowrap pl-2">
      {{ formatMb(used) }} / {{ formatMb(limit) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps({
    limit: requireProp<number>(Number),
    used: requireProp<number>(Number),
  });
</script>
