import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * =========================================================
 * VITE CONFIG – REACT (AUTOMATIC JSX RUNTIME)
 * ---------------------------------------------------------
 * Fixes: "React is not defined"
 * =========================================================
 */

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  server: {
    port: 5173,
  },
});
