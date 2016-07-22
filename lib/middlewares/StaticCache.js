'use strict';

class StaticCacheMiddleware extends Skyer.AppMiddleware {
  constructor( options ) {
    super(options);

    this.order = 50;
  }

  __default() {
    const staticCache = require('koa-static-cache');

    const config = this.config;

    return staticCache(this.skyer.options.public_path, config);
  }

  _defaultOptions() {
    return {
      config_key: 'staticCache',
      config_val: {
        maxAge: 365 * 24 * 60 * 60,
        gzip: true
      }
    };
  }
}

module.exports = StaticCacheMiddleware;
