'use strict';

class CorsMiddleware extends Skyer.AppMiddleware {
  constructor( options ) {
    super(options);

    this.order = 70;
  }

  __default() {
    const cors = require('kcors');

    return cors();
  }
}

module.exports = CorsMiddleware;
