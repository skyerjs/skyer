'use strict';

const AbstractRoute = require('../AbstractRoute');

class IndexRoute extends AbstractRoute {
  constructor() {
    super();

    this.routes = [
      ['get', '/', 'IndexController#index']
    ];
  }
}

module.exports = IndexRoute;