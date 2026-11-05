import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginQuery from "@tanstack/eslint-plugin-query";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "src/routeTree.gen.ts",
      "src-tauri/**",
      "storybook-static/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...pluginQuery.configs["flat/recommended"],
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
