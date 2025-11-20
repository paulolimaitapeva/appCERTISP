import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente para process.env
  // Fix: 'cwd' property does not exist on type 'Process' in this context, using '.' instead.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill para permitir o uso de process.env.API_KEY no frontend
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})