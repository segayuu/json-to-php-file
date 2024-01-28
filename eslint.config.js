// @ts-check
/** @typedef {import("eslint").Linter.FlatConfig} FlatConfig */
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat();

/** @type {FlatConfig[]} */
export default [
  js.configs.recommended,
  ...compat.extends("plugin:@typescript-eslint/recommended-type-checked"),
  {
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
