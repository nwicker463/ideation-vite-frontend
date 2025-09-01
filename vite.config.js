import path from 'path';
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ alias @ to src/
      react: path.resolve('./node_modules/react'),        // ✅ de-dupe React
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  },
  build: {
    rollupOptions: {
      external: ["fsevents"], // 👈 explicitly mark fsevents as external
    },
  },
  optimizeDeps: {
    exclude: ["fsevents"],
  },
  ssr: {
    noExternal: ["fsevents"],
  },
});