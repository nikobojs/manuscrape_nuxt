<template>
  <header class="py-2 bg-slate-700">
    <UContainer>
      <div class="flex justify-between items-center">
        <div class="font-sans text-xl">
          ManuScrape
        </div>
        <nav v-show="hasFetched" class="flex justify-end">
          <ul v-show="!!user">
              <li class="flex"><ULink class="px-3 py-2 self-center align-top" to="/">Projects</ULink></li>
          </ul>
          <ul v-show="!user">
              <li class="flex"><ULink class="px-3 py-2" to="/login">Log in</ULink></li>
              <li class="flex"><ULink class="px-3 py-2" to="/user/new">Sign up</ULink></li>
          </ul>
          <UDropdown v-if="!!user" class="flex self-center" :items="settingsItems">
            <div class="w-9 h-9 p-1.5">
              <UIcon class="w-full h-full" name="i-heroicons-user-circle" />
            </div>
          </UDropdown>
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
  import { type DropdownItem } from '@nuxthq/ui/dist/runtime/types';

  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user, hasFetched } = await useUser();
  
  const settingsItems: DropdownItem[][] = [
    [
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