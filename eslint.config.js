const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Add custom rules here if needed
    },
  },
];
