'use strict';

/**
 * Copyright: @厦门以梦科技
 * Author: jerry
 * Date  : 16/7/13
 */

const AbstractMiddleware = require('./AbstractMiddleware');

class AbstractAppMiddleware extends AbstractMiddleware {
  constructor( name ) {
    super(name, 'app');

    this.order = 1000;
  }
}

module.exports = AbstractAppMiddleware;