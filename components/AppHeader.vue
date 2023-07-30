<template>
  <header>
    <nav v-show="hasFetched">
      <ul v-show="!!user">
          <li><NuxtLink href="/">Home</NuxtLink></li>
          <li><NuxtLink href="/logout">Log out</NuxtLink></li>
          <li>{{ user?.email || '' }}</li>
      </ul>
      <ul v-show="!user">
          <li><NuxtLink href="/login">Log in</NuxtLink></li>
          <li><NuxtLink href="/user/new">Sign up</NuxtLink></li>
          <li></li>
      </ul>
    </nav>
  </header>
</template>

<style scoped lang="scss">
  ul {
    margin: 0;
    list-style-type: none;
    padding-left: 0;
    display: flex;
    justify-content: flex-end;

    li a {
      padding: 10px 26px;
      display: block;
    }
  }
</style>

<script setup lang="ts">
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user, hasFetched } = await useUser();
  console.log('user:::', user.value)
</script>