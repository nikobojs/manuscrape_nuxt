<template>
  <header>
    <nav>
      <ul>
        <li v-show="isLoggedIn">
          <NuxtLink href="/">Home</NuxtLink>
        </li>
        <li>
          <NuxtLink href="/about">About</NuxtLink>
        </li>
        <li v-show="!isLoggedIn">
          <NuxtLink href="/login">Log in</NuxtLink>
        </li>
        <li v-show="!isLoggedIn">
          <NuxtLink href="/user/new">Sign up</NuxtLink>
        </li>
        <li v-show="isLoggedIn">
          <NuxtLink href="/logout">Log out</NuxtLink>
        </li>
        <li v-show="isLoggedIn">
          Welcome {{ user?.email }}
        </li>
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
  const { isLoggedIn, user } = await useAuth();
</script>