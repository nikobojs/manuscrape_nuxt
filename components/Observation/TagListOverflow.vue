<template>
  <div ref="container" class="w-full">
    <div class="flex flex-wrap gap-1 max-w-full">
      <UBadge
        v-for="(tag, index) in visibleTags"
        :key="tag.id || tag.name"
        :color="'blue'"
        size="xs"
      >
        {{ tag.name }}
      </UBadge>

      <UTooltip v-if="hiddenTags.length">
        <template #text>
          <div class="max-w-xs flex flex-wrap gap-1">
            <UBadge
              v-for="tag in hiddenTags"
              :key="tag.id || tag.name"
              size="xs"
              color="gray"
            >
              {{ tag.name }}
            </UBadge>
          </div>
        </template>

        <UBadge size="xs" color="gray">
          +{{ hiddenTags.length }} more
        </UBadge>
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  tags: { name: string; id?: number }[];
}>()

const container = ref<HTMLElement | null>(null)
const visibleTags = ref<typeof props.tags>([])
const hiddenTags = ref<typeof props.tags>([])

const MAX_VISIBLE_TAGS = 3

const calculateVisibleTags = () => {
  const sortedTags = [...props.tags].sort((a, b) => a.name.localeCompare(b.name))
  visibleTags.value = sortedTags.slice(0, MAX_VISIBLE_TAGS)
  hiddenTags.value = sortedTags.slice(MAX_VISIBLE_TAGS)
}

onMounted(() => calculateVisibleTags())

watch(() => props.tags, calculateVisibleTags, { deep: true })
</script>