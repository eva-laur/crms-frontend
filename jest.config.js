import { createRequire } from "module";
const require = createRequire(import.meta.url);

export default {
  testEnvironment: "node",
  verbose: true,
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.[tj]s$": require.resolve("babel-jest"),
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  // MongoMemoryServer needs time to spin up the mongod binary on first run.
  // 30 s covers both cold starts and any temporary system slowness.
  testTimeout: 30000,
};
