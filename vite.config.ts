import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        // Generate TypeScript declaration files
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts'],
            outDir: 'dist',
            rollupTypes: true
        }),
        // Add Node.js polyfills for browser
        nodePolyfills({
            // Enable specific polyfills matching your webpack config
            include: ['crypto', 'stream', 'http', 'https', 'zlib', 'vm'],
            globals: {
                Buffer: true,
                global: true,
                process: true
            }
        })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    build: {
        lib: {
            // Entry point for library mode
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'WalletSDK',
            formats: ['es', 'cjs'],
            fileName: (format) => {
                if (format === 'es') return 'index.esm.js';
                if (format === 'cjs') return 'index.cjs.js';
                return 'index.js';
            }
        },
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: ['@btc-vision/bitcoin', '@btc-vision/ecpair', '@btc-vision/bip32', '@btc-vision/transaction', 'opnet'],
            output: {
                // Preserve the directory structure for ESM build
                preserveModules: false,
                exports: 'named'
            }
        },
        // Output directory
        outDir: 'dist',
        // Enable source maps for debugging
        sourcemap: true,
        // Minify the output
        minify: 'terser',
        // Target modern browsers but with compatibility
        target: 'es2023'
    },
    // Support for WebAssembly
    optimizeDeps: {
        exclude: ['*.wasm'],
        esbuildOptions: {
            target: 'esnext'
        }
    },
    assetsInclude: ['**/*.wasm']
});
