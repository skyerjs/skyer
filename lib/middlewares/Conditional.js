'use strict';

class ConditionalMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 100;
  }

  __default() {
    const conditional = require('koa-conditional-get');

    return conditional();
  }
}

module.exports = ConditionalMiddleware;
