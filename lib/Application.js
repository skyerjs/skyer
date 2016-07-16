'use strict';

const koa  = require('koa');
const path = require('path');

const debug = require('debug')('skyer:application');

const Router = require('koa-router');

class Application {
  constructor( skyer ) {
    this.skyer = skyer;
  }

  start() {
    this._beforeStart();
    this._start();
    this._afterStart();
  }

  _beforeStart() {
    this.app = koa();

    // bootstrap app settings
    this._loadSettings();
  }

  _loadSettings() {
    const bpAppPath   = path.join(this.skyer.options.bootstrap_path, 'app.js');
    const bpAppModule = this.skyer.utils.requireSafe(bpAppPath);

    // todo: can export function or object
    if ( bpAppModule && typeof bpAppModule === 'function' ) {
      bpAppModule.call(this.skyer, this.app);
    }
  }

  _registerRoutes() {
    for ( let key in this.skyer._routes ) {
      this._registerRouteByNs(key);
    }
  }

  _registerRouteByNs( ns ) {
    const routes = this.skyer._routes[ns];

    for ( let key in routes ) {
      let route = routes[key];
      this._registerRoute(ns, key, route);
    }
  }

  _registerRoute( prefix, key, route ) {
    let routerPrefix = '';
    if ( key === 'index' ) {
      routerPrefix = prefix;
    } else {
      if ( prefix === '/' ) {
        routerPrefix = prefix + key;
      } else {
        routerPrefix = prefix + '/' + key;
      }
    }

    if ( routerPrefix === '/' ) {
      routerPrefix = '';
    }

    debug('routerPrefix:%s', routerPrefix);
    const router     = new Router({
      prefix: routerPrefix
    });

    route.routeParamsList = route.routeParamsList || [];
    // debug('>>>>>>>>>> routeParams length: %s', route.routeParamsList.length);
    route.routeParamsList.forEach(routeParams => {
      let controllerName   = routeParams.controllerAction.name;
      let actionName       = routeParams.controllerAction.action;
      let controllerPrefix = routeParams.controllerAction.prefix;
      let controllersKey   = '/' + controllerPrefix;

      let controllers = this.skyer.controllers[controllersKey];
      let controller  = controllers[controllerName];

      let action = controller[actionName];

      if ( !action && typeof action !== 'function' ) {
        debug('Cannot find action:%s for controller:%s prefix:%s', actionName, controllerName, controllerPrefix);
        return;
      }

      let routeArgs = [];
      routeArgs.push(routeParams.path);

      // 注入中间件
      let middlewares = routeParams.middlewares || [];
      middlewares.forEach(middlewareAction => {

        let middlewareName = middlewareAction.name;
        let actionName     = middlewareAction.action;
        let prefix         = middlewareAction.prefix;
        let middlewaresKey = '/' + prefix;

        let middlewares = this.skyer._route_middlewares[middlewaresKey];
        let middleware  = middlewares[middlewareName];

        let action = middleware[actionName];
        if ( !action ) {
          debug('Cannot find action:%s for middleware:%s prefix:%s', actionName, middlewareName, prefix);
          return;
        }

        routeArgs.push(action.call(middleware));
      });

      routeArgs.push(action.call(controller));
      debug('register route: %s %s', routeParams.method, routeParams.path);
      router[routeParams.method].apply(router, routeArgs);
    });

    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  _registerMiddlewares() {
    const allMiddlewares = this.skyer._sys_middlewares.concat(this.skyer._app_middlewares);

    function sortByOrder( a, b ) {
      return a.order - b.order;
    }

    allMiddlewares.sort(sortByOrder);
    const defaultAction  = this.skyer.options.middleware_default_action;

    allMiddlewares.forEach(middleware => {
      debug('app use middleware with order: %s  [%s]', middleware.order, middleware.name);
      this.app.use(middleware[defaultAction].call(middleware, this.app));
    });
  }

  _start() {
    // sort middlewares by order
    this._registerMiddlewares();
    this._registerRoutes();
    this._listen();
  }

  _listen() {
    this.app.on('error', err => {
      console.error(err);
    });

    this.app.listen(this.skyer._listen_port, this.skyer._listen_callback);
  }

  _afterStart() {
    this.skyer.app = this.app;
  }
}

module.exports = Application;
