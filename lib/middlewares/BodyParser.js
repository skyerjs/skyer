'use strict';


class BodyParserMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 120;
  }

  __default() {
    const bodyParser = require('koa-bodyparser');

    return bodyParser();
  }
}

module.exports = BodyParserMiddleware;
