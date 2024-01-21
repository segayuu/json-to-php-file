/** @typedef {import("eslint").Linter.FlatConfig} FlatConfig */
import js from "@eslint/js";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({
  resolvePluginsRelativeTo: import.meta.dirname,
});

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
  ...compat.extends("plugin:@typescript-eslint/recommended-type-checked"),
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
  },
];
