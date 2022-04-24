/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["node_modules", "dist"],
  moduleNameMapper: {
    "^src(.*)": "<rootDir>/src$1",
    "^tests(.*)": "<rootDir>/tests$1",
  },
};
