'use strict';

class EtagMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 110;
  }

  __default() {

    const etag = require('koa-etag');

    return etag();
  }
}

module.exports = EtagMiddleware;
