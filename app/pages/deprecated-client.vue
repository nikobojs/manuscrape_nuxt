<template>
  <div>
    <UContainer class="flex flex-col">
      <div class="w-[220px] min-h-[45px] pt-10 pb-6">
        <span class="dark:hidden">
          <img
            src="/logo/manuscrape-logo-dark.svg"
            alt="manuscrape logo dark"
          />
        </span>
        <span class="hidden dark:block">
          <img
            src="/logo/manuscrape-logo-light.svg"
            alt="manuscrape logo light"
          />
        </span>
      </div>
      <h2 class="text-2xl mb-8">Your ManuScrape client is too old</h2>
      <p class="mb-2">
        Your ManuScrape client is too old, and not supported anymore. Please
        update to the newest one
      </p>
      <p v-if="requiredVersion" class="mb-8">
        A client of version {{ requiredVersion }} or newer is required.
      </p>
      <div v-else class="mb-8" />
      <div v-if="hasDownloads" class="grid grid-cols-[160px_1fr] gap-y-2">
        <template v-for="download in downloads" :key="download.label">
          <template v-if="download.url">
            <p>{{ download.label }}</p>
            <div>
              <a
                :href="download.url"
                class="text-green-500 hover:underline"
                >Download</a
              >
            </div>
          </template>
        </template>
      </div>
    </UContainer>
  </div>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig().public;
const route = useRoute();

const requiredVersion = computed(() => {
  const required = route.query.required;
  return typeof required === "string" ? required : undefined;
});

const downloads = [
  { label: "Windows:", url: config.clientDownloadWindows },
  { label: "Mac (intel chip):", url: config.clientDownloadMacIntel },
  { label: "Mac (apple chip):", url: config.clientDownloadMacApple },
];

const hasDownloads = computed(() =>
  downloads.some((download) => !!download.url),
);
</script>
