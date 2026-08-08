import { setup } from "@nuxt/test-utils";
import * as dotenv from "dotenv";
dotenv.config();

// TODO: add minio & upload test vars to avoid poisening the prod envs
// TODO: or use full .env.test setup
let dbUrl = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!dbUrl) {
  console.log(process.env);
  throw new Error("Test database URL could not be determined from .env file");
}

await setup({
  env: {
    DATABASE_URL: dbUrl,
  },
  logLevel: 0,
  dev: true,
});

export * from "./auth";
export * from "./collaborators";
export * from "./deletion";
export * from "./dynamicFields";
export * from "./forgotPassword";
export * from "./imageUploads";
export * from "./invitations";
export * from "./observations";
export * from "./projectExports";
export * from "./projectFields";
export * from "./projects";
export * from "./tags";
