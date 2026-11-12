import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 纯前端静态站点，无任何代理需求
export default defineConfig({
  plugins: [react()],
});
