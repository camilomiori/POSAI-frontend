import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    hmr: {
      overlay: false
    }
  },
  build: {
    target: 'es2020',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          // UI libraries
          'ui-vendor': ['lucide-react'],
          'charts-vendor': ['recharts'],
          // CSS framework
          'css-vendor': ['tailwindcss']
        },
        // Better file naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = facadeModuleId.split('/').pop()?.split('.')[0] || 'chunk'
            return `js/${name}-[hash].js`
          }
          return 'js/[name]-[hash].js'
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      },
      // Tree shaking optimization
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
      }
    },
    // Enable chunking for better performance
    chunkSizeWarningLimit: 1000,
    // Optimize assets
    assetsInlineLimit: 4096
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  esbuild: {
    // Production optimizations
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    target: 'es2020'
  },
  css: {
    devSourcemap: process.env.NODE_ENV === 'development'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom', 
      '@tanstack/react-query',
      'lucide-react',
      'recharts'
    ],
    // Force pre-bundling of these deps
    force: false
  },
  // Performance optimizations
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
