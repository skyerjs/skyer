'use strict';

const AbstractMiddleware = require('./AbstractMiddleware');

class AbstractRouteMiddleware extends AbstractMiddleware {
  constructor( name ) {
    super(name, 'route');
  }
}

module.exports = AbstractRouteMiddleware;