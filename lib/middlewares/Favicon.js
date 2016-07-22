'use strict';

const path = require('path');

class FaviconMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 30;
  }

  __default() {
    const favicon = require('koa-favicon');

    return favicon(path.join(this.skyer.options.public_path, 'favicon.ico'));
  }
}

module.exports = FaviconMiddleware;
