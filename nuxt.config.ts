// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
  ],
  typescript: {
    strict: true
  },
  runtimeConfig: {
    app : {
      hello: process.env.BCRYPT_SALT_ROUNDS,
    }
  }
})
