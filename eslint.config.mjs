import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off"
    }
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "node_modules/**",
    "next-env.d.ts",
    "public/**"
  ])
]);
