/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts", "**/*.api.test.ts"],
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // fix các import kết thúc .js mà ts-jest compile sang .ts
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
