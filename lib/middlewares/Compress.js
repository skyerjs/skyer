'use strict';

class CompressMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 35;
  }

  __default( app ) {
    const compress = require('koa-compress');

    const config = this.skyer.config;

    const options = config.get('koaCompress') || {};

    return compress(options);
  }
}

module.exports = CompressMiddleware;
