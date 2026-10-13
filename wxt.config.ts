import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.tiktok.com/*', '*://*.youtube.com/*'],
  },
  webExt: {
    disabled: true,
  },
});
