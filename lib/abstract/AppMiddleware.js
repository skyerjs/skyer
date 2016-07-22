'use strict';

const AbstractMiddleware = require('./AbstractMiddleware');

class AbstractAppMiddleware extends AbstractMiddleware {
  constructor( options ) {
    super('app', options);

    this.order = 1000;
  }
}

module.exports = AbstractAppMiddleware;