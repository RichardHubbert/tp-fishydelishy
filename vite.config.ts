import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Import site config for base path
const getBasePath = async () => {
  try {
    const { siteConfig } = await import('./src/config/site');
    return siteConfig.urls.basePath;
  } catch {
    return '/amicicoffee/'; // Fallback
  }
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const basePath = mode === 'production' ? await getBasePath() : '/';
  
  return {
    base: basePath,
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
