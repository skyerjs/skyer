'use strict';

const path = require('path');

class StaticCacheMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 50;
  }

  __default() {
    const staticCache = require('koa-static-cache');

    // todo: options config
    return staticCache(this.skyer.options.public_path, {
      maxAge: 365 * 24 * 60 * 60,
      gzip: true
    });
  }
}

module.exports = StaticCacheMiddleware;
