<template>
  <footer>
    <ClientOnly>
      <UContainer
        class="text-xs text-gray-500"
        :class="isElectron ? 'pt-2 pb-4' : 'pb-8 pt-12'"
      >
        {{ versionsString }}
      </UContainer>
    </ClientOnly>
  </footer>
</template>

<script setup lang="ts">
  const { version } = useRuntimeConfig().public;
  const { electronVersion, isElectron } = await useDevice();

  const versionsString = computed<string>(() => {
    const v = electronVersion.value;
    const versions = [['manuscrape_nuxt', version]];
    if (v) {
      versions.push(['manuscrape_electron', v]);
    }
    return versions.map(([name, version]) => `${name} v${version}`).join(' | ');
  });
</script>
