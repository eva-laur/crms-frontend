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
};
