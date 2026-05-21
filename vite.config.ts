import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { localApiPlugin } from "./plugins/vite-local-api";

// Vite emits `<link rel="modulepreload">` for every chunk it can reach from
// the entry — including heavy route-only chunks (jspdf, qrcode, html2canvas).
// On the homepage that means downloading ~270 KB of JS the user may never
// need. This plugin filters the preload list to a critical-only whitelist.
function trimPreloads(allow: RegExp): Plugin {
  return {
    name: "trim-modulepreloads",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(
          /\s*<link rel="modulepreload"[^>]+>/g,
          (tag) => (allow.test(tag) ? tag : ""),
        );
      },
    },
  };
}

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
      // Keep only critical vendor chunks in <link rel="modulepreload">.
      // Other route chunks are fetched on demand (or via our idle warm-up).
      // Drop preloads for chunks that only matter to other routes. The big
      // ones (jspdf, qrcode) shouldn't be fetched on the homepage.
      trimPreloads(/^(?!.*\/(pdf-vendor|qr-vendor|charts-vendor)-).+\.js/),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Pre-bundle commonly used deps so dev cold-start is fast and HMR stays warm.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "date-fns",
        "clsx",
        "tailwind-merge",
      ],
    },
    esbuild: {
      // Strip console.log + debugger in production for smaller bundles + less runtime work.
      drop: mode === "production" ? ["console", "debugger"] : [],
      legalComments: "none",
    },
    build: {
      // Modern browsers — smaller, faster output (~10-20% smaller than es2015 default).
      target: "es2020",
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      // Drop runtime preload of route-only heavy chunks (jspdf, qrcode,
      // recharts) when other routes are warmed — they're only ever needed on
      // the page that imports them.
      modulePreload: {
        resolveDependencies: (_filename, deps) =>
          deps.filter((d) => !/(pdf-vendor|qr-vendor|charts-vendor)-/.test(d)),
      },
      // Manual chunking is tricky: any lib that consumes React via CJS interop
      // breaks if it lands in a chunk that loads before React's exports are
      // ready ("Cannot read properties of undefined (reading 'forwardRef')").
      // Strategy: only split self-contained, route-specific deps. Everything
      // else (React + all React-aware libs) stays together so the binding is
      // always in scope when needed.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            // PDF + canvas — only on TicketGenerator, already dynamically imported.
            // No React dependency, fully self-contained.
            if (
              id.includes("/jspdf/") ||
              id.includes("/html2canvas/") ||
              id.includes("/dompurify/")
            ) return "pdf-vendor";

            // QR code — Scanner + TicketGenerator only. No React dependency.
            if (id.includes("/qrcode") || id.includes("/html5-qrcode/")) return "qr-vendor";

            // Charts — used only on Admin. recharts pulls in d3-*, which is
            // huge and unused elsewhere. recharts IS React-aware but Admin is
            // lazy-loaded anyway so this chunk is only fetched on that route.
            if (id.includes("/recharts/") || id.includes("/d3-")) return "charts-vendor";

            // Everything else (React, Radix, framer-motion, react-query, etc.)
            // stays in the default chunks Vite generates per dynamic-import
            // boundary. This preserves the React module binding across files
            // and avoids the forwardRef-undefined crash.
            return;
          },
        },
      },
    },
  };
});
