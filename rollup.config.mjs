import { defineConfig } from 'rollup';
import del from 'rollup-plugin-delete';
import typescript from '@rollup/plugin-typescript';

const output = './lib';

export default defineConfig({
    input: 'index.ts',
    treeshake: true,
    plugins: [del({ targets: [output] }), typescript()],
    output: {
        dir: output,
        esModule: true,
        format: 'esm',
        preserveModules: true,
        entryFileNames: '[name].js'
    }
});
