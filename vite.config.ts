import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry
    server: {
      entry: "server",
    },
  },

  vite: {
    preview: {
      host: "0.0.0.0",
      allowedHosts: true,
    },
  },
});