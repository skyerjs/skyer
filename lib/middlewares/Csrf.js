'use strict';

class CsrfMiddleware extends Skyer.AppMiddleware {
  constructor( options ) {
    super(options);

    this.order = 90;

    this._enabled = false;
  }

  __default( app ) {
    const csrf = require('koa-csrf');

    csrf(app);

    return csrf.middleware
  }
}

module.exports = CsrfMiddleware;
