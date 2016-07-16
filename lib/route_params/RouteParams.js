'use strict';

const _ = require('lodash');

const AbstractElement  = require('../AbstractElement');
const MiddlewareAction = require('./MiddlewareAction');
const ControllerAction = require('./ControllerAction');

class RouteParams extends AbstractElement {
  constructor( params ) {
    super('routeParams');

    this._routeMethod = ['get', 'put', 'post', 'delete', 'del', 'patch', 'head', 'use', 'all', 'param'];

    this.method = null;
    this.path   = null;

    this.middlewares = [];

    this.controllerAction = null;

    this._params = params || [];

    this._errors  = [];
    this._isValid = true;
  }

  isValid() {
    return this._isValid;
  }

  getErrors() {
    return this._errors;
  }

  error( error ) {
    this._errors.push(error);
    this._isValid = false;
  }

  build() {
    super.build();

    if ( this._params.length === 0 || !Array.isArray(this._params) ) {
      this.error('invalid params');
      return;
    }

    for ( let i = 0; i < this._params.length; i++ ) {
      const param = this._params[i];
      this._initParam(param);
    }
  }

  _initParam( param ) {
    if ( !param ) {
      const errmsg = 'invalid param: ' + param;
      return this.error(errmsg);
    }

    if ( this._isMethod(param) ) {
      if ( this.method ) {
        const errmsg = `invalid param: ${param}. route method already exists!`;
        return this.error(errmsg);
      }

      this.method = param;
    } else if ( this._isPath(param) ) {
      if ( this.path ) {
        const errmsg = `invalid param: ${param}. route path already exists!`;
        return this.error(errmsg);
      }

      this.path = param;
    } else if ( this.method === 'param' && !this.path ) {
      this.path = param;
    } else if ( this._isMiddlewareAction(param) ) {
      let middlewareAction = new MiddlewareAction(param);
      middlewareAction.setSkyer(this.skyer);
      middlewareAction.build();
      this.middlewares.push(middlewareAction);
    } else if ( this._isControllerAction(param) ) {
      this.controllerAction = new ControllerAction(param);
      this.controllerAction.setSkyer(this.skyer);
      this.controllerAction.build();
    } else {
      const errmsg = 'invalid param: ' + param;
      this.error(errmsg);
    }
  }

  _isMethod( param ) {
    return _.includes(this._routeMethod, param);
  }

  _isPath( param ) {
    return param && param.startsWith('/');
  }

  // v1^UserMiddleware#onlyMyself
  _isMiddlewareAction( param ) {
    const separator = this.skyer.options.middleware_action_separator;

    const arr = param.split(separator);

    const middleware = arr[0];
    if ( !middleware.endsWith('Middleware') ) {
      return false;
    }

    return true;
  }

  // v1^UserController#getUserInfo
  _isControllerAction( param ) {
    const separator = this.skyer.options.controller_action_separator;

    const arr = param.split(separator);

    const controller = arr[0];
    if ( !controller.endsWith('Controller') ) {
      return false;
    }

    return true;
  }
}


module.exports = RouteParams;