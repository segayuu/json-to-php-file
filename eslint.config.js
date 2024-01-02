/** @typedef {import("eslint").Linter.FlatConfig} FlatConfig */
import js from "@eslint/js";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";

/** @type {FlatConfig[]} */
export default [
  {
    files: ["./**/*.mjs", "./src/index.mts"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["./src/index.mts"],
    rules: typescriptPlugin.configs["eslint-recommended"].overrides[0].rules,
  },
  // Enable TypeScript-specific rules
  {
    files: ["./src/index.mts"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      // your overrides here
    },
  },
];
