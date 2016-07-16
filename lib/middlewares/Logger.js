'use strict';

class LoggerMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 20;
  }

  _init() {
    this._enabled = this.skyer.env !== 'production';
  }

  __default() {
    return require('koa-logger')();
  }
}

module.exports = LoggerMiddleware;
