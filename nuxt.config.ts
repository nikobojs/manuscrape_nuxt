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
      s3AccessKey: process.env.S3_ACCESS_KEY || '',
      s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      s3Endpoint: process.env.S3_ENDPOINT || '',
      s3BucketName: process.env.S3_BUCKET_NAME || '',
    },
    public: {
      s3Endpoint: process.env.S3_ENDPOINT || '',
      baseUrl: process.env.BASE_URL || '',
    }
  },
  colorMode: {
    preference: 'dark',
  }
})
