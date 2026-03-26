<template>
    <UContainer>
      <BackButton
        :href="backbuttonUrl"
        :disabled="disableBackbutton"
      >
        Go back
      </BackButton>
      <ObservationImageEditor
        v-if="project"
        :project="project"
        :observation="observation"
        :project-field-id="projectFieldId"
      />
    </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
const { params } = useRoute();
const { isElectron } = useDevice();
const { project } = await useProjects(params);
const route = useRoute();


// retrieve (require) `projectFieldId` from query parameters
const _projectFieldId = route.query?.projectFieldId;
if (typeof _projectFieldId !== 'string' || !_projectFieldId || isNaN(parseInt(_projectFieldId))) {
  throw createError({
    message: 'Project field id is not defined in the URL query parameters',
    status: 400
  });
}

const projectFieldId = ref<number>(parseInt(_projectFieldId));
const disableBackbutton = ref(false);

if (typeof project.value?.id !== 'number') {
  throw new Error('Project is not defined');
}

const backbuttonUrl = computed(() => {
  if (!project.value || !observation.value) {
    disableBackbutton.value = true;
    return '#'
  } else {
    const electronParam = isElectron.value ? '?electron=1' : '';
    return `
      /projects/${project.value.id}/observations/${observation.value.id}${electronParam}
    `.trim();
  }
});

const { requireObservationFromParams } = await useObservations(project.value.id);
const _observation = await requireObservationFromParams(params);
const observation = ref(_observation);

onMounted(() => {

})
</script>
