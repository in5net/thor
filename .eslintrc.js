module.exports = {
  ignorePatterns: '*.js',
  root: true,
  env: {
    es2020: true,
    browser: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-bitwise': ['error', { allow: ['|'] }],
    'no-console': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    radix: ['error', 'as-needed'],
    'no-restricted-globals': 'off',
    'no-new-wrappers': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    'max-classes-per-file': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/ban-types': 'off',
    'import/prefer-default-export': 'off'
  }
};
