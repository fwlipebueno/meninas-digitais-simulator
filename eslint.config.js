import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/**', 'playwright-report/**', 'test-results/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: [
      '*.{js,ts}',
      'apps/*/*.config.ts',
      'apps/api/**/*.ts',
      'tests/**/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
