import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],

    rules: {
      semi: ["error", "always"],

      indent: ["error", 4],

      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];