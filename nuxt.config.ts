// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  sourcemap: true,
  modules: [
    '@nuxthq/ui'
  ],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  runtimeConfig: {
    app: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10'),
      tokenSecret: process.env.TOKEN_SECRET,
      cookieDomain: process.env.COOKIE_DOMAIN,
    }
  },
  colorMode: {
    preference: 'dark',
  }
})
