import { setup } from "@nuxt/test-utils";
import * as dotenv from "dotenv";
dotenv.config();

// TODO: add minio & upload test vars to avoid poisening the prod envs

let dbUrl = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!dbUrl) {
  console.log(process.env);
  throw new Error("Test database URL could not be determined from .env file");
}

console.log("SETTING UP with db url", dbUrl);
await setup({
  env: {
    DATABASE_URL: dbUrl,
  },
  logLevel: 0,
});

export * from "./auth";
export * from "./projects";
export * from "./projectFields";
export * from "./invitations";
export * from "./deletion";
export * from "./collaborators";
export * from "./observations";
export * from "./dynamicFields";
export * from "./projectExports";
