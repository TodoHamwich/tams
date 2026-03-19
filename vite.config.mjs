import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'scripts',
    lib: {
      entry: 'src/tams.js',
      formats: ['es'],
      fileName: 'tams'
    },
    rollupOptions: {
        output: {
            manualChunks: undefined,
        },
    },
    sourcemap: true,
    minify: false, // Keep it readable for the user for now
    emptyOutDir: false, // Don't delete the folder, as it might contain other things
  }
});
