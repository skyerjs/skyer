'use strict';

/**
 * Copyright: @厦门以梦科技
 * Author: jerry
 * Date  : 16/7/13
 */

const AbstractElement = require('./AbstractElement');

class AbstractMiddleware extends AbstractElement {
  constructor( name, type ) {
    super();

    this.name = name;
    this.type = type;
  }


}

module.exports = AbstractMiddleware;