'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./flight-voyado.cjs.production.min.js');
} else {
  module.exports = require('./flight-voyado.cjs.development.js');
}
