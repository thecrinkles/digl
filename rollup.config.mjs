import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/index.ts',
    output: { dir: 'dist/esm', format: 'esm' },
    plugins: [typescript(), terser()],
  },
  {
    input: 'src/index.ts',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [typescript({ tsconfig: 'tsconfig.cjs.json' }), terser()],
  },
];
