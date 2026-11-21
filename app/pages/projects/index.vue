<template>
  <UContainer>
    <div class="mt-9">
      <Transition name="fade">
        <div v-if="hasProjects">
          <ProjectList />
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="!hasProjects">
          <ProjectCreateWidget :onClose="onCreateWidgetClose" />
        </div>
      </Transition>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });
const { ensureUserFetched } = await useAuth();
await ensureUserFetched();
const { params } = useRoute();
const { refreshUser } = await useUser();
const { projects } = await useProjects(params);
const hasProjects = computed(() => !!projects?.value?.length);

function onCreateWidgetClose() {
  console.log("hello");
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
