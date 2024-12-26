import globals from "globals";
import pkg from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const { configs: pluginJsConfigs } = pkg;

/** @type {import('eslint').Linter.Config} */
const config = [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...pluginJsConfigs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
];

export default config;