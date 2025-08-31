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
    // Database layer specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Console allowed for migration scripts
    'no-console': 'warn',
    
    // Security rules for database operations
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // SQL injection prevention
    'no-template-curly-in-string': 'error',
    
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
      files: ['migrations/**/*', 'seeds/**/*'],
      rules: {
        'no-console': 'off', // Allow console in migration/seed scripts
      },
    },
  ],
};