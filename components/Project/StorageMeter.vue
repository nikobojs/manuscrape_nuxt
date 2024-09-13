<template>
  <UMeter
    icon="i-heroicons-server"
    indicator
    :value="used"
    :max="limit"
    :ui="{
      wrapper: 'w-full flex flex-row-reverse items-center gap-2'
    }"
  >
    <template #indicator="indi">
      <div class="text-sm text-[#75809f] whitespace-nowrap pl-2">
        {{ formatMb(used) }} / {{ formatMb(limit) }}
      </div>
    </template> 
  </UMeter>
</template>

<script lang="ts" setup>
  defineProps({
    limit: requireProp<number>(Number),
    used: requireProp<number>(Number),
  });
</script>