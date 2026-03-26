<template>
  <UCard
    class="h-full"
    :ui="{
      background:
        'bg-gray-800 dark:bg-gray-800 border-slate-500 border shadow-lg',
      body: { base: 'h-full' },
    }"
  >
    <div class="relative h-full flex flex-col gap-16 xl:gap-18">
      <div>
        <slot />
      </div>
      <div>
        <div class="absolute bottom-0 w-full [&_button]:whitespace-nowrap">
          <slot name="bottom" />
        </div>
      </div>
    </div>
  </UCard>
</template>
