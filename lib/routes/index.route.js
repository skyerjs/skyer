'use strict';

const AbstractRoute = require('../abstract/AbstractRoute');

class IndexRoute extends AbstractRoute {
  constructor() {
    super();

    this.routes = [
      ['get', '/', 'IndexController#index']
    ];
  }
}

module.exports = IndexRoute;