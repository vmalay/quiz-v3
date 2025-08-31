module.exports = {
  extends: [
    '../../.eslintrc.js',
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // Node.js specific rules
    'no-console': 'warn', // Allow console logs in API for debugging
    'no-process-exit': 'error',
    'no-sync': 'warn',
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Error handling
    'prefer-promise-reject-errors': 'error',
    'no-throw-literal': 'error',
    
    // TypeScript specific for API
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};