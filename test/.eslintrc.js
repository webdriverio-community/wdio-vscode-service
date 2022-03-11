const config = require('../.eslintrc');

module.exports = {
  ...config,
  env: {
    jest: true,
  }
};
