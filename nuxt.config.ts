// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from './package.json'

export default defineNuxtConfig({
  devtools: { enabled: true },
  sourcemap: true,
  modules: [
    '@nuxthq/ui',
    'nuxt-scheduler'
  ],
  typescript: {
    strict: true,
    typeCheck: true
  },
  ui: {
    icons: ['mdi', 'heroicons']
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
      authResponseTime: 120,
      invitationSalt: process.env.INVITATION_SALT || 'saltyFreciousTrembleCat42',
    },
    public: {
      baseUrl: process.env.BASE_URL || '',
      version: pkg.version,
      maxImageSize: 5 * 1000 * 1000,
      maxFileSize: 10 * 1000 * 1000,
    }
  },
  colorMode: {
    preference: 'dark',
  },
});
