// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from "./package.json";

export default defineNuxtConfig({
  devtools: { enabled: false },
  sourcemap: true,
  modules: ["@nuxt/ui", "@nuxt/image"],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Manuscrape",
      bodyAttrs: {
        class: "h-full dark:bg-gray-950 bg-gray-950 p-0 m-0",
      },
      htmlAttrs: {
        class: "h-full m-0 p-0",
      },
    },
  },

  runtimeConfig: {
    public: {
      mode: process.env.NODE_ENV || "development",
      baseUrl: process.env.BASE_URL || "",
      version: pkg.version,
      maxImageSize: 30 * 1000 * 1000,
      maxFileSize: 100 * 1000 * 1000,
      sentryDsn: process.env.SENTRY_DSN || "",
      sentryEnv: process.env.SENTRY_ENV || "development",
    },
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10"),
    tokenSecret: process.env.TOKEN_SECRET,
    cookieDomain: process.env.COOKIE_DOMAIN,
    cookieSecure: process.env.COOKIE_SECURE?.toLowerCase() === "true",
    fileUploadPath: process.env.FILE_UPLOAD_PATH || "",
    s3AccessKey: process.env.S3_ACCESS_KEY || "",
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    s3Endpoint: process.env.S3_ENDPOINT || "",
    s3Region: process.env.S3_REGION || "",
    s3BucketName: process.env.S3_BUCKET_NAME || "",
    smtpHost: process.env.SMTP_HOST,
    smtpTlsHost: process.env.SMTP_HOST_TLS,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,
    smtpPort: process.env.SMTP_PORT,
    authResponseTime: 120,
    invitationSalt: process.env.INVITATION_SALT || "saltyFreciousTrembleCat42",
    databaseType: process.env.DATABASE_TYPE || "postgres",
    enableHttpLog: process.env.LOG_HTTP_REQUESTS === "true",
    manuscrapeClientVersionRequirement: ">=1.0.11",
    saml: {
      identifierSecret: process.env.SAML_IDENTIFIER_SECRET || "",
      sessionSecret: process.env.SAML_SESSION_SECRET || "",
      entryPoint: process.env.SAML_ENTRYPOINT || "",
      issuer: process.env.SAML_ISSUER || "",
      callbackUrl: process.env.SAML_CALLBACK_URL || "",
      identifierFormat:
        process.env.SAML_IDENTIFIER_FORMAT ||
        "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
      logoutUrl: process.env.SAML_LOGOUT_URL || "",
      cert: process.env.SAML_IDP_CERT_PATH,
    },
  },

  colorMode: {
    preference: "dark",
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      "*/5 * * * *": ["invitations:cleanup"],
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        "date-fns",
        "v-calendar",
        "vuedraggable",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "@sentry/vue",
        "@vueuse/core",
      ],
    },
  },

  compatibilityDate: "2025-03-13",
});
