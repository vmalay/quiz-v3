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
    // tRPC specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // API layer rules
    'no-console': 'warn', // Allow for API debugging
    
    // Security rules for API endpoints
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Input validation
    'no-template-curly-in-string': 'error',
    
    // Error handling
    'prefer-promise-reject-errors': 'error',
    'no-throw-literal': 'error',
    
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
        pathGroups: [
          {
            pattern: '@trpc/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@quiz-battle/**',
            group: 'internal',
            position: 'before',
          },
        ],
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