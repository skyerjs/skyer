'use strict';

const AbstractMiddleware = require('./AbstractMiddleware');

class AbstractRouteMiddleware extends AbstractMiddleware {
  constructor( options ) {
    super('route', options);
  }
}

module.exports = AbstractRouteMiddleware;