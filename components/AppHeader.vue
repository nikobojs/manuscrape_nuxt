<template>
  <header>
    <nav>
      <ul>
        <li>
          <NuxtLink href="/">Home</NuxtLink>
        </li>
        <li>
          <NuxtLink href="/about">About</NuxtLink>
        </li>
        <li>
          <NuxtLink href="/login">Log in</NuxtLink>
        </li>
        <li>
          <NuxtLink href="/user/new">Sign up</NuxtLink>
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