import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
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
      mode === 'development' && localApiPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Vite's default chunking is production-safe and avoids circular dependency
      // issues that can arise from manual chunk splitting (e.g. React.forwardRef
      // being undefined when a dependent chunk loads before the React chunk).
      chunkSizeWarningLimit: 600,
    },
  };
});
