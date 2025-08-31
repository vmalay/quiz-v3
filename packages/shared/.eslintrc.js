module.exports = {
  extends: [
    '../../.eslintrc.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Domain model rules
    'no-console': 'warn', // Warn about console logs in shared domain code
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Class and object rules
    'class-methods-use-this': 'off', // Domain objects may have methods that don't use this
    'max-classes-per-file': ['warn', 10], // Allow more classes in domain files
    
    // Import rules for clean architecture
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript handles this
    
    // Complexity rules
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 50],
  },
  env: {
    node: true,
    browser: true,
    es6: true,
  },
};