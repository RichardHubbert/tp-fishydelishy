import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";

const instanceBase = (value: string | undefined) => {
  const raw = (value || '/').trim();
  if (raw === '' || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = instanceBase(env.VITE_BASE_PATH);
  const restaurantName = (env.VITE_RESTAURANT_NAME || 'Your Restaurant').trim() || 'Your Restaurant';
  const productionUrl = basePath === '/'
    ? 'https://tablepilot.co.uk/'
    : `https://tablepilot.co.uk${basePath}/`;
  const htaccessBase = basePath === '/' ? '' : basePath;

  return ({
  base: mode === 'production' ? (basePath === '/' ? '/' : `${basePath}/`) : '/',
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
    {
      name: 'restaurant-instance',
      transformIndexHtml(html: string) {
        return html
          .replaceAll('%RESTAURANT_NAME%', restaurantName)
          .replaceAll('%PRODUCTION_URL%', productionUrl);
      },
      closeBundle() {
        const file = path.resolve(__dirname, 'dist/.htaccess');
        if (!fs.existsSync(file)) return;
        const source = fs.readFileSync(file, 'utf8');
        fs.writeFileSync(file, source.replaceAll('__BASE_PATH__', htaccessBase));
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  });
});
