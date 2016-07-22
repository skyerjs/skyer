'use strict';

class RateLimitMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 25;
  }

  __default( app ) {
    const limit = require('koa-limit');

    const config = this.skyer.config;

    const options = config.get('koaLimit') || {};

    if ( options.store && typeof options.store === 'function' ) {
      // factory function for return store db client.
      options.store = options.store.call(this.skyer, app);
    }

    return limit(options);
  }
}

module.exports = RateLimitMiddleware;