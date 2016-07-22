'use strict';

class MiddlewareConfigItem {
  constructor( name, order, options ) {
    this.name    = name;
    this.order   = order;
    this.options = options;
  }
}

module.exports = MiddlewareConfigItem;
 