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
    // Game engine specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Performance critical code
    'no-console': 'warn', // Allow for debugging game logic
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Timer and interval management
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Complexity rules for game logic
    'complexity': ['warn', 15], // Game logic can be complex
    'max-depth': ['warn', 5],
    'max-lines-per-function': ['warn', 100], // Game functions can be longer
    
    // Memory management
    'no-unreachable': 'error',
    'no-unused-expressions': 'error',
    
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
        'max-lines-per-function': 'off',
      },
    },
  ],
};