<template>
  <div>
    <UContainer class="flex flex-col">
      <div v-if="isElectron" class="w-[220px] min-h-[45px] pt-10 pb-6">
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
      <p class="mb-3">
        Your ManuScrape client is too old, and not supported anymore. Please
        update to the newest one
      </p>
      <p v-if="requiredVersion" class="mb-6">
        A client of version {{ requiredVersion }} or newer is required.
      </p>
      <div v-else class="mb-6" />
      <div v-if="hasDownloads" class="grid grid-cols-[160px_1fr] gap-y-2">
        <div v-for="download in downloads" :key="download.label">
          <div v-if="download.url">
            <p>{{ download.label }}</p>
            <div>
              <a :href="download.url" class="text-green-500 hover:underline"
                >Download</a
              >
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6">
        You can also download the installers from manuscrape.org or GitHub.
      </div>
    </UContainer>
  </div>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig().public;
const route = useRoute();
const { isElectron } = useDevice();

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
