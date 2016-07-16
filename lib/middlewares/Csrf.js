'use strict';


class CsrfMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

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
