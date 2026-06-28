import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'tests/**',
      'public/**',
      'relatorio-testes/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console':        'warn',
      'eqeqeq':            'error',
      'semi':              ['error', 'always'],
      'quotes':            ['error', 'single'],
      'indent':            ['error', 2],
      'no-unused-vars':    'warn',
      'no-var':            'error',
      'prefer-const':      'error',
      'curly':             'error',
      'no-trailing-spaces':'error',
    },
  },
];
