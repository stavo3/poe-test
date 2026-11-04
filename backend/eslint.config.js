'use strict';
// Static analysis configuration for the API.
//  * @eslint/js recommended      -> correctness (undefined variables, unreachable code ...)
//  * eslint-plugin-security      -> security smells (eval, unsafe regex, non-literal fs paths,
//                                   object injection, child_process ...)
// Security findings are reported as warnings (they need human review because many are
// false positives); real correctness problems and dangerous constructs are errors and
// fail the CI pipeline.
const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'reports/**', 'postman/**', 'logs/**', 'certs/**'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-useless-escape': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-new-buffer': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: { 'security/detect-object-injection': 'off', 'security/detect-non-literal-fs-filename': 'off' },
  },
];
