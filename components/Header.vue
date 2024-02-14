<template>
  <header class="py-2 bg-slate-800 shadow-lg" v-show="user">
    <UContainer>
      <div class="flex justify-between items-center">
        <div class="w-[190px] min-h-[45px] pt-3 pb-2 cursor-pointer" @click="onLogoClick">
          <span class="dark:hidden">
            <img src="/logo/manuscrape-logo-dark.svg"  alt="manuscrape logo dark">
          </span>
          <span class="hidden dark:block">
            <img src="/logo/manuscrape-logo-light.svg" alt="manuscrape logo light">
          </span>
        </div>

        <nav v-if="hasFetched && !!user" class="flex justify-end">
          <div class="w-[250px] flex justify-end items-center" v-if="typeof rawProjectId === 'string'">
            <ProjectDropdown
              class="w-full mr-3 h-7 min-w-[200px]"
              :default-project-id="selectedProjectId"
              v-if="selectedProjectId"
              :project="selectedProject"
              :set-project="onProjectChange"
            />
          </div>
          <UDropdown class="flex self-center" :items="settingsItems">
            <div class="w-9 h-9 p-1.5">
              <UIcon class="w-full h-full" name="i-heroicons-user-circle" />
            </div>
          </UDropdown>
        </nav>

        <nav v-if="hasFetched && !user" class="flex justify-end">
          <ul>
              <li class="flex"><ULink class="px-3 py-2" to="/login">Log in</ULink></li>
              <li class="flex"><ULink class="px-3 py-2" to="/user/new">Sign up</ULink></li>
          </ul>
        </nav>
      </div>
    </UContainer>
  </header>
</template>

<style scoped lang="scss">
  ul {
    margin: 0;
    list-style-type: none;
    padding-left: 0;
    display: flex;
    justify-content: flex-end;

    li a, li button {
      padding: 10px 26px;
      display: block;
    }
  }
</style>

<script setup lang="ts">
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user, hasFetched, projects } = await useUser();
  const { params } = useRoute();
  const { getProjectById } = await useProjects(params);
  const route = useRoute();
  const selectedProjectId = ref<number | undefined>(undefined);

  const selectedProject = computed<FullProject | undefined>(() => {
    if (typeof selectedProjectId.value !== 'number') return undefined;
    return getProjectById(selectedProjectId.value);
  })
  const rawProjectId = computed(() => route.params?.projectId);
  
  function updateProjectIdFromParams() {
    const projectId = parseInt(route.params.projectId as string);
    const project = projects.value.find((p) => p.id === projectId)
    if (project && !isNaN(projectId) && projectId !== selectedProjectId.value) {
      selectedProjectId.value = projectId;
      onProjectChange(project);
    }
  }

  async function onProjectChange(_project: FullProject) {
    navigateTo(`/projects/${_project.id}`);
  }

  watch([rawProjectId], updateProjectIdFromParams);
  onMounted(() => {
    if (rawProjectId) updateProjectIdFromParams()
  });

  function onLogoClick() {
    navigateTo('/');
  }

  const settingsItems = [
    [
      {
        label: 'Settings',
        icon: 'i-mdi-settings-outline',
        click: () => {
          navigateTo('/user')
        }
      },
      {
        label: 'Log out',
        icon: 'i-mdi-logout',
        click: () => {
          navigateTo('/logout')
        }
      }
    ]
  ]

</script>