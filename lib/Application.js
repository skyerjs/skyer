'use strict';

const koa = require('koa');
const path = require('path');
const debug = require('debug')('skyer:application');

const Router = require('koa-router');

class Application {
  constructor( skyer ) {
    this.skyer = skyer;

    this._default_listen_port = 3000;
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
    const appConf = this.skyer.config.get('app');
    if( appConf && typeof appConf === 'object' ) {
      Object.keys(appConf).forEach(key => {
        debug('app.%s = %s', key, appConf[key]);
        this.app[key] = appConf[key];
      });
    }
  }

  _registerRoutes() {
    for( let key in this.skyer._routes ) {
      this._registerRouteByNs(key);
    }
  }

  _registerRouteByNs( ns ) {
    const routes = this.skyer._routes[ns];

    for( let key in routes ) {
      let route = routes[key];
      this._registerRoute(ns, key, route);
    }
  }

  _registerRoute( prefix, key, route ) {
    let routerPrefix = '';
    if( key === 'index' ) {
      routerPrefix = prefix;
    } else {
      if( prefix === '/' ) {
        routerPrefix = prefix + key;
      } else {
        routerPrefix = prefix + '/' + key;
      }
    }

    if( routerPrefix === '/' ) {
      routerPrefix = '';
    }

    debug('routerPrefix:%s', routerPrefix);

    const router = new Router({
      prefix: routerPrefix
    });

    route.routeParamsList = route.routeParamsList || [];
    // debug('>>>>>>>>>> routeParams length: %s', route.routeParamsList.length);
    route.routeParamsList.forEach(routeParams => {
      this._registerRouteItem(router, routeParams);
    });

    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  _registerRouteItem( router, routeParams ) {
    let controllerName = routeParams.controllerAction.name;
    let actionName = routeParams.controllerAction.action;
    let controllerPrefix = routeParams.controllerAction.prefix;
    let controllersKey = '/' + controllerPrefix;

    let controllers = this.skyer.controllers[controllersKey];
    let controller = controllers[controllerName];

    let action = controller[actionName];

    if( !action && typeof action !== 'function' ) {
      debug('Cannot find action:%s for controller:%s prefix:%s', actionName, controllerName, controllerPrefix);
      return;
    }

    let routeArgs = [];
    routeArgs.push(routeParams.path);

    // 注入中间件
    let middlewares = routeParams.middlewares || [];
    middlewares.forEach(middlewareAction => {

      let middlewareName = middlewareAction.name;
      let actionName = middlewareAction.action;
      let prefix = middlewareAction.prefix;
      let middlewaresKey = '/' + prefix;

      let middlewares = this.skyer._route_middlewares[middlewaresKey];
      let middleware = middlewares[middlewareName];

      let action = middleware[actionName];
      if( !action ) {
        debug('Cannot find action:%s for middleware:%s prefix:%s', actionName, middlewareName, prefix);
        return;
      }

      routeArgs.push(action.call(middleware));
    });

    routeArgs.push(action.call(controller));
    debug('register route: %s %s', routeParams.method, routeParams.path);
    router[routeParams.method].apply(router, routeArgs);
  }

  _registerMiddlewaresByDefault() {
    const allMiddlewares = this.skyer._sys_middlewares.concat(this.skyer._app_middlewares);

    // instance
    const middlewaresInst = allMiddlewares.map(Middleware => {
      // Middleware is Class
      let name = this.skyer.utils.parseMiddleware(Middleware);
      if( !name ) {
        debug('invalid Middleware');
        return null;
      }

      const instance = new Middleware(name);
      instance.setSkyer(this.skyer).build();

      return instance;
    }).filter(inst => {
      return inst !== null && inst !== undefined;
    });

    function sortByOrder( a, b ) {
      return a.order - b.order;
    }

    middlewaresInst.sort(sortByOrder);

    this._registerMiddlewares(middlewaresInst);
  }

  _registerMiddlewaresByConfig() {
    const middlewareItems = this.skyer._custom_middlewares_items || [];

    const middlewares = middlewareItems.map(item => {
      const name = item.name;
      const order = item.order;
      const options = item.options;

      // find Middleware class by name
      const MiddlewareClass = this.skyer._middlewares_name_class_map[name];
      if( !MiddlewareClass ) {
        return null;
      }

      const instance = new MiddlewareClass(options);
      instance.name = name;
      instance.setSkyer(this.skyer).build();
      order && (instance.order = order);

      return instance;
    }).filter(inst => {
      // todo: inst instanceof AbstractMiddleware
      return inst !== undefined && inst !== null;
    });

    function sortByOrder( a, b ) {
      return a.order - b.order;
    }

    middlewares.sort(sortByOrder);

    this._registerMiddlewares(middlewares);
  }

  _registerMiddlewares( middlewares ) {
    const defaultAction = this.skyer.options.middleware_default_action;

    middlewares.forEach(middleware => {
      const middlewareFunc = middleware[defaultAction].call(middleware, this.app);
      if( !middlewareFunc || typeof middlewareFunc !== 'function' ) {
        debug('app load middleware [%s] with order: %s by not register, due to it return false/invalid function',
          middleware.name,
          middleware.order
        );
        return;
      }

      debug('app use middleware with order: %s  [%s]', middleware.order, middleware.name);
      this.app.use(middlewareFunc);
    });
  }

  _start() {
    if( this.skyer._is_custom_middlewares ) {
      this._registerMiddlewaresByConfig();
    } else {
      this._registerMiddlewaresByDefault();
    }

    this._registerRoutes();
    this._listen();
  }

  _listen() {
    this.app.on('error', err => {
      console.error(err);
    });

    const port = this._getListenPort();
    this.app.port = port;

    this.app.listen(port, this.skyer._listen_default_callback);
  }

  _getListenPort() {
    return this.skyer._listen_port
      || (this.skyer.config.get('http') || {}).port
      || this._default_listen_port;
  }

  _afterStart() {
    this.skyer.app = this.app;
  }
}

module.exports = Application;
