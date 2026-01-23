<template>
  <div class="relative w-full mb-10">

    <div v-for="step in steps">
      <slot v-if="currentStep == step" :name="step" />
    </div>

    <div class="absolute flex justify-center gap-x-1 w-full">
      <div v-for="step in steps">
        <span
          @click="() => onStepUpdate?.(step)"
          class="block relative text-4xl cursor-pointer hover:opacity-100 transition-opacity"
          :class="{ 'opacity-50': step != currentStep }"
        >&bull;</span>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
  defineProps({
    steps: Array as PropType<String[]>,
    currentStep: String as PropType<String>,
    onStepUpdate: Function as PropType<(step: String) => any>
  });
</script>