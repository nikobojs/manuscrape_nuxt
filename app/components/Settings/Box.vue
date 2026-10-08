<script setup lang="ts">
  defineProps({
    title: requireProp<string>(String),
    help: requireProp<string>(String),
  });
</script>

<template>
  <!-- <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e]"> -->
  <UCard
    class="dark:bg-transparent col-span-2 bg-transparent ring-0 dark:ring-0 shadow-none"
    :ui="{
      body: {
        padding: 'px-0 py-5 sm:px-0',
      },
      header: {
        padding: 'px-0 py-5 sm:px-0',
      },
    }"
  >
    <template #header>
      <div class="flex min-h-[40px] items-center border-b border-gray-200 pb-3 dark:border-slate-700">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ title }}</h2>
      </div>
    </template>
    <p class="mb-6 max-w-lg">{{ help }}</p>
    <slot />
  </UCard>
</template>