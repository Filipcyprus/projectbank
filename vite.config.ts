import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // host: true binds to 0.0.0.0 so the dev server is reachable from other
  // devices on the same network (e.g. a phone testing the PWA install),
  // not just this machine.
  server: { port: 5173, open: false, host: true },
});
