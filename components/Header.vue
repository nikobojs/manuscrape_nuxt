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
            <USelectMenu
              value-attribute="id"
              option-attribute="label"
              :options="projectMenu"
              class="w-full mr-3 h-7 min-w-[200px]"
              v-model="selectedProjectId"
              searchable
              @change="onProjectChange"
              placeholder="Loading..."
            >
              <template #label>
                {{ selectedProject?.name || '' }}
              </template>
            </USelectMenu>
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
  const { user, hasFetched } = await useUser();
  const { params } = useRoute();
  const { projects, getProjectById } = await useProjects(params);
  const route = useRoute();
  const selectedProjectId = ref<number | undefined>(undefined);

  const selectedProject = computed<FullProject | undefined>(() => {
    if (typeof selectedProjectId.value !== 'number') return undefined;
    return getProjectById(selectedProjectId.value);
  })
  const rawProjectId = computed(() => route.params?.projectId);
  
  function updateProjectIdFromParams() {
    const projectId = parseInt(route.params.projectId as string);
    if (!isNaN(projectId) && projectId !== selectedProjectId.value) {
      selectedProjectId.value = projectId;
    }
  }

  function onProjectChange(projectId: number) {
    navigateTo(`/projects/${projectId}`)
  }

  watch([rawProjectId], updateProjectIdFromParams);
  updateProjectIdFromParams();

  function onLogoClick() {
    navigateTo('/');
  }

  const projectMenu = computed(() => {
    if (!user || !projects.value?.length) {
      return []
    }

    const result =  projects.value.map((p) => ({
      label: p.name,
      href: '/projects/' + p.id,
      id: p.id,
    })).sort((a, b) => a.label.localeCompare(b.label));

    return result;
  });
  
  const settingsItems = [
    [
      {
        label: 'Profile',
        icon: 'i-heroicons-user',
        click: () => {
          navigateTo('/user')
        }
      },
      {
        label: 'Log out',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        click: () => {
          navigateTo('/logout')
        }
      }
    ]
  ]

</script>