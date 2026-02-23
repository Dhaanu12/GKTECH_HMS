import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project-level rule overrides
  {
    rules: {
      // Style/type preferences — warn only (not errors)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
      // react-hooks/purity flags Date.now() calls — downgrade to warn (valid usage before JSX return)
      "react-hooks/purity": "warn",
      // Real bugs — keep as errors
      "react-hooks/rules-of-hooks": "error",
    },
  },
]);

export default eslintConfig;
