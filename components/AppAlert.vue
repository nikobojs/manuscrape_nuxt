<template>
  <span class="app-alert">
    <slot />
  </span>
</template>

<style scoped lang="scss">
  $a: red;
  .app-alert {
    color: $a;
  }
</style>