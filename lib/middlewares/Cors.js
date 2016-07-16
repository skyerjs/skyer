'use strict';


class CorsMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 70;
  }

  __default() {
    const cors = require('kcors');

    return cors();
  }
}

module.exports = CorsMiddleware;
