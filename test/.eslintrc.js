const config = require('../.eslintrc');

module.exports = {
  ...config,
  extends: [
    ...config.extends,
    'plugin:wdio/recommended'
  ]
};
