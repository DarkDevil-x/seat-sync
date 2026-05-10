import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { localApiPlugin } from "./plugins/vite-local-api";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Expose all .env vars (not just VITE_*) to process.env so API handlers
  // can read MONGODB_URI, JWT_SECRET, etc. during local development.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      mode === 'development' && localApiPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — loaded on every page, keep separate for maximum cache reuse
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
              return 'vendor-react';
            }
            // Animation — large lib only needed where motion is used
            if (id.includes('node_modules/framer-motion/')) {
              return 'vendor-motion';
            }
            // Charts — only used in admin dashboard
            if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor/')) {
              return 'vendor-charts';
            }
            // All Radix UI primitives — large but stable
            if (id.includes('node_modules/@radix-ui/')) {
              return 'vendor-radix';
            }
            // TanStack Query
            if (id.includes('node_modules/@tanstack/')) {
              return 'vendor-query';
            }
            // Everything else in node_modules goes into a general vendor chunk
            if (id.includes('node_modules/')) {
              return 'vendor-misc';
            }
          },
        },
      },
      // Warn at 400KB, hard-limit chunks at 600KB (Vite default is 500KB)
      chunkSizeWarningLimit: 600,
    },
  };
});
