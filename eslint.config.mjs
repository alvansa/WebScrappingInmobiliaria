import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([

  {
    ignores : ["node_modules/**", "out/**", "build/**"]
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser }
  },

  { 
    files: ["**/*.js"],
    languageOptions: { 
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      }
     } },

     eslintConfigPrettier,
]);
