import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts', './src/antd/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2015',
  dts: true,
  sourcemap: true,
  clean: true,
});
