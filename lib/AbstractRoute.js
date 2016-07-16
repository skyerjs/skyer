'use strict';

const RouteParams     = require('./route_params/RouteParams');
const AbstractElement = require('./AbstractElement');

class AbstractRoute extends AbstractElement {
  constructor() {
    super();

    this.routes = [];

    this.routeParamsList = [];
  }

  build() {
    super.build();

    this.routeParamsList = this._parseRoutes();
  }

  // return Array<RouteParams>
  _parseRoutes() {
    return this.routes
      .map(routeParamsArr => {
        const routeParams = new RouteParams(routeParamsArr);
        routeParams.setSkyer(this.skyer);
        routeParams.build();
        return routeParams;
      }).filter(routeParamInst => {
        return routeParamInst.isValid();
      });
  }
}

module.exports = AbstractRoute;