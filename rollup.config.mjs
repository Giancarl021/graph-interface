import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';
import typescript from '@rollup/plugin-typescript';

const OUTPUT_DIR = './lib';

export default defineConfig({
    external: [/node_modules/],
    input: 'index.ts',
    treeshake: true,
    plugins: [del({ targets: [OUTPUT_DIR] }), nodeResolve(), typescript()],
    output: {
        dir: OUTPUT_DIR,
        esModule: true,
        format: 'esm',
        preserveModules: true,
        entryFileNames: '[name].js'
    }
});
