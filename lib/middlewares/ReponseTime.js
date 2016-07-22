'use strict';

class ResponseTimeMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 10;
  }

  __default() {
    const responseTime = require('koa-response-time');

    return responseTime();
  }
}

module.exports = ResponseTimeMiddleware;
