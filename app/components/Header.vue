<template>
  <header class="py-2 bg-slate-800 shadow-lg" v-show="user">
    <UContainer>
      <div class="flex justify-between items-center">
        <div
          class="w-[190px] min-h-[45px] pt-3 pb-2 cursor-pointer"
          @click="onLogoClick"
        >
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

        <nav v-if="hasFetched && !!user" class="flex justify-end">
          <div
            class="w-[250px] flex justify-end items-center"
            v-if="!!selectedProject"
          >
            <ProjectDropdown
              classes="w-full mr-3 h-7 min-w-[200px]"
              :default-project-id="selectedProjectId"
              v-if="selectedProjectId"
              :project="selectedProject"
              :set-project="onProjectChange"
            />
          </div>
          <UDropdown class="flex self-center relative" :items="settingsItems">
            <div class="w-9 h-9 p-1.5">
              <UIcon class="w-full h-full" name="i-heroicons-user-circle" />
            </div>
            <template #email="{ item }">
              <div
                class="flex gap-x-1.5 pl-1.5 items-center justify-start border-b border-b-slate-600"
              >
                <div>
                  <UIcon
                    class="text-xl text-slate-500"
                    name="i-mdi-lock-outline"
                  />
                </div>
                <p class="text-sm py-1.5 text-slate-400 text-left">
                  {{ item.label }}
                </p>
              </div>
            </template>
          </UDropdown>
        </nav>

        <nav v-if="hasFetched && !user" class="flex justify-end">
          <ul>
            <li class="flex">
              <ULink class="px-3 py-2" to="/login">Log in</ULink>
            </li>
            <li class="flex">
              <ULink class="px-3 py-2" to="/user/new">Sign up</ULink>
            </li>
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

  li a,
  li button {
    padding: 10px 26px;
    display: block;
  }
}
</style>

<script setup lang="ts">
import type { DropdownItem } from "#ui/types";
const { ensureUserFetched } = await useAuth();
await ensureUserFetched();
const { user, hasFetched } = await useUser();
const { params } = useRoute();
const { getProjectById } = await useProjects(params);
const route = useRoute();
const selectedProjectIdStr = computed(
  () => route.params?.["projectId"] as string,
);
const selectedProjectIdNum = computed(() =>
  parseInt(selectedProjectIdStr.value),
);
const selectedProjectId = computed(() =>
  isNaN(selectedProjectIdNum.value) ? undefined : selectedProjectIdNum.value,
);

const selectedProject = computed<FullProject | undefined>(() => {
  if (typeof selectedProjectId.value !== "number") return undefined;
  return getProjectById(selectedProjectId.value);
});

async function onProjectChange(_project: FullProject) {
  if (_project && _project.id !== selectedProjectId.value) {
    console.log("header navigating to project!", _project);
    await navigateTo(`/projects/${_project.id}`, { external: true });
  }
}

function onLogoClick() {
  navigateTo("/");
}

function getUserLabel(user?: CurrentUser) {
  if (user?.name) return user.name;
  else if (user?.email) return user.email;
  else if (user?.samlOrganizationName)
    return `Anonymous (${user.samlOrganizationName})`;
  else return "Undefined user";
}

const settingsItems: DropdownItem[][] = [
  [
    {
      label: getUserLabel(user.value),
      disabled: true,
      slot: "email",
      class: "contents",
    },
    {
      label: "Settings",
      icon: "i-mdi-settings-outline",
      click: () => {
        navigateTo("/user");
      },
    },
    {
      label: "Log out",
      icon: "i-mdi-logout",
      click: () => {
        navigateTo("/logout");
      },
    },
  ],
];
</script>
