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
      "@typescript-eslint/no-explicit-any": "error",

      "no-multiple-empty-lines": ["error", {
        "max": 1,
        "maxEOF": 0,
        "maxBOF": 0
      }]
    }
  }
];