'use strict';

const AbstractMiddleware = require('./AbstractMiddleware');

class AbstractAppMiddleware extends AbstractMiddleware {
  constructor( name ) {
    super(name, 'app');

    this.order = 1000;
  }
}

module.exports = AbstractAppMiddleware;