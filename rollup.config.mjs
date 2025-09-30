import { defineConfig } from 'rollup';
import del from 'rollup-plugin-delete';
import typescript from '@rollup/plugin-typescript';
import { nodeExternals } from 'rollup-plugin-node-externals';

const output = './lib';

export default defineConfig({
    external: [/node_modules/],
    input: 'index.ts',
    treeshake: true,
    plugins: [
        del({ targets: [output] }),
        nodeExternals(),
        typescript({ tsconfig: './tsconfig.lib.json' })
    ],
    output: {
        dir: output,
        esModule: true,
        format: 'esm',
        preserveModules: true,
        entryFileNames: '[name].js'
    }
});
