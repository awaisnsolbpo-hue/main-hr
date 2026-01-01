import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: true,
        port: 8080,
        allowedHosts: [
            "desktop-efbo5bl.tail05cf33.ts.net",
            ".tail05cf33.ts.net",  // This allows any subdomain
            ".ts.net",  // Or even more permissive
        ],
    },

    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    esbuild: {
        // Remove console.log and debugger in production
        drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
        rollupOptions: {
            outDir: '/var/www/hr-app/frontend/dist',
            emptyOutDir: true,
            output: {
                manualChunks: {
                    // Core React libraries
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],

                    // UI component libraries
                    'ui-vendor': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-label',
                        '@radix-ui/react-tabs',
                    ],

                    // Utility libraries
                    'utils': ['clsx', 'tailwind-merge', 'date-fns'],

                    // Supabase and API
                    'supabase': ['@supabase/supabase-js'],

                    // Charts and visualization (if used)
                    'charts': [],

                    
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1500,

        // Enable minification
        minify: 'esbuild',

        // Source maps for production debugging (optional, disable for smaller builds)
        sourcemap: mode === 'development',
    },
}));