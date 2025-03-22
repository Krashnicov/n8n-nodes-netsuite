import typescriptParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Adapt the dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create compatibility layer
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Include built-in recommended rules
  js.configs.recommended,
  
  // Setup parser and ignore patterns for TypeScript files
  {
    files: ['**/*.ts'],
    ignores: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
        extraFileExtensions: ['.json'],
      },
      ecmaVersion: 2019,
      sourceType: 'module',
      globals: {
        browser: true,
        es6: true,
        node: true,
        URL: true,
        URLSearchParams: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
