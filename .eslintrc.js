module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
};
