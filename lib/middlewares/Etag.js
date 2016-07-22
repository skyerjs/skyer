'use strict';

class EtagMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 110;
  }

  __default() {

    const etag = require('koa-etag');

    return etag();
  }
}

module.exports = EtagMiddleware;
