'use strict';

const _      = require('lodash');
const path   = require('path');
const lodash = require('lodash');
const glob   = require('glob');
const moment = require('moment');

const debug = require('debug')('skyer');

const utils = require('./utils');

const ConfigManager    = require('./manager/ConfigManager');
const ComponentManager = require('./manager/ComponentManager');

const MiddlewaresListParser = require('./modules/MiddlewaresListParser');

const FILE_TYPE = {
  CONFIG: 'config',
  CONTROLLER: 'controller',
  CONSTANT: 'constant',
  ROUTE_MIDDLEWARE: 'route_middleware',
  APP_MIDDLEWARE: 'app_middleware',
  SYS_MIDDLEWARE: 'sys_middleware',
  ROUTE: 'route',
  SERVICE: 'service',
  VIEW: 'view'
};

class Skyer {
  constructor( options ) {
    this.options = lodash.extend(Skyer.defaultConfig, options || {});

    this._config      = {};
    this._consts      = {};
    this._controllers = {};
    this._services    = {};
    this._routes      = {};

    this.componentManager = null;

    this._route_middlewares = {};

    // map for index
    this._sys_app_middlewares_map = {};

    this._app_middlewares = [];
    this._sys_middlewares = [];

    // custom how middlewares register by config.
    this._is_custom_middlewares    = false;
    this._custom_middlewares_items = [];

    this._settings = {};

    this._listen_port     = null;
    this._listen_callback = () => {

    };

    this._listen_default_callback = () => {
      if ( this._listen_callback && typeof this._listen_callback === 'function' ) {
        this._listen_callback.call(this);
      }

      const port = this.app.port;

      debug('skyer app listen on port %s', port);
      this.logger.info('skyer app listen on port %s', port);
    };
  }

  set( key, value, attath ) {
    this._settings[key] = value;
    if ( attath ) {
      Object.defineProperty(this, key, value);
    }

    return this;
  }

  get( key ) {
    return this._settings[key];
  }

  getEnv( name ) {
    return process.env[name];
  }

  // todo: plugin api for skyer ecosystem
  plugin() {

  }

  listen( port, callback ) {
    if ( typeof port === 'function' ) {
      callback = port;
      port     = null;
    }

    this._listen_port = port;

    if ( callback && typeof  callback === 'function' ) {
      this._listen_callback = callback;
    }
  }

  fly() {
    debug('loading config...');
    this._loadConfig();

    debug('loading globals...');
    this._loadGlobals();

    debug('loading component...');
    this._loadComponents();

    debug('loading constants...');
    this._loadConstants();

    debug('loading middlewares...');
    this._loadMiddlewares();
    debug('loading controllers...');
    this._loadControllers();
    debug('loading services...');
    this._loadServices();
    debug('loading routes...');
    this._loadRoutes();

    debug('load finish!');

    debug('starting app...');
    this._start();
  }

  _loadGlobals() {
    const globalsMap = {
      _: lodash,
      moment: moment,
      skyer: this
    };

    const globalsConf = this.config.get('globals');
    if ( !globalsConf ) {
      debug('none globals config');
      return;
    }

    Object.keys(globalsMap).forEach(key => {
      if ( globalsConf[key] ) {
        global[key] = globalsMap[key];
      }
    });
  }

  _loadMiddlewares() {
    this._loadByType(FILE_TYPE.SYS_MIDDLEWARE, this._loadSysMiddleware);
    this._loadByType(FILE_TYPE.APP_MIDDLEWARE, this._loadAppMiddleware);
    this._loadByType(FILE_TYPE.ROUTE_MIDDLEWARE, this._loadRouteMiddleware);

    this._registerAppMiddlewareByConfig();
  }

  _registerAppMiddlewareByConfig() {
    const middlewaresConf = this.config.get('middlewares');
    if ( !middlewaresConf ) {
      debug('none middlewares config, default register all middlewares');
      return;
    }

    if ( typeof middlewaresConf !== 'object' ) {
      debug('invalid middlewares config, default register all middlewares');
      return;
    }

    if ( middlewaresConf.default ) {
      debug('middlewares config to default, default register all middlewares');
      return;
    }

    debug('find middlewares config, parse it!');

    this._is_custom_middlewares = true;

    // parse middlewares list
    const parser = new MiddlewaresListParser(middlewaresConf.list);
    parser.setSkyer(this).build();

    this._custom_middlewares_items = parser.getResults();
  }

  _loadSysMiddleware( prefix, Middleware, file ) {
    let name = this.utils.parseMiddleware(Middleware);
    if ( !name ) {
      debug('invalid sys Middleware file: %s', file);
      return;
    }

    const inst = new Middleware();
    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this).build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    this._sys_middlewares.push(inst);
    this._sys_app_middlewares_map[inst.name] = inst;
  }

  _loadAppMiddleware( prefix, Middleware, file ) {
    let name = this.utils.parseMiddleware(Middleware);
    if ( !name ) {
      debug('invalid app Middleware file: %s', file);
      return;
    }

    const inst = new Middleware();

    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this).build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    this._app_middlewares.push(inst);
    this._sys_app_middlewares_map[inst.name] = inst;
  }

  _loadRouteMiddleware( prefix, Middleware, file ) {
    let name = this.utils.parseMiddleware(Middleware);
    if ( !name ) {

      debug('invalid route Middleware file: %s', file);
      return;
    }

    // prefix /  /v1
    const inst = new Middleware();
    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this).build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    if ( !this._route_middlewares[prefix] ) {
      this._route_middlewares[prefix] = {};
    }

    this._route_middlewares[prefix][name] = inst;
  }

  _loadControllers() {
    this._loadByType(FILE_TYPE.CONTROLLER, this._loadController);
  }

  _loadController( prefix, Controller, file ) {
    let name = this.utils.parseController(Controller);
    if ( !name ) {

      debug('invalid controller file: %s', file);
      return;
    }

    const inst = new Controller();

    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this).build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    if ( !this._controllers[prefix] ) {
      this._controllers[prefix] = {};
    }

    this._controllers[prefix][name] = inst;
  }

  _loadServices() {
    this._loadByType(FILE_TYPE.SERVICE, this._loadService);
  }

  _loadService( prefix, Service, file ) {
    let name = this.utils.parseService(Service);
    if ( !name ) {
      debug('invalid service file: %s', file);
      return;
    }

    const inst = new Service();
    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this);

    // prefix /  or /v1 or /v1/test
    const prefixArr = prefix.split('/');

    let currNode = this._services;
    for ( let i = 1; i < prefixArr.length; i++ ) {
      let ns = prefixArr[i];

      if ( ns === '' ) {
        currNode[name] = inst;
      } else {
        if ( !currNode[ns] ) {
          currNode[ns] = {};
        }

        currNode = currNode[ns];

        if ( i === prefixArr.length - 1 ) {
          currNode[name] = inst;
        }
      }
    }
  }

  _loadRoutes() {
    this._loadByType(FILE_TYPE.ROUTE, this._loadRoute);
  }

  _loadRoute( prefix, Route, file ) {
    let name = this.utils.parseRoute(Route);
    if ( !name ) {
      debug('invalid route file: %s', file);
      return;
    }

    const inst = new Route();
    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this).build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    if ( !this._routes[prefix] ) {
      this._routes[prefix] = {};
    }

    this._routes[prefix][name] = inst;
  }

  _loadConfig() {
    const confPath = this.options.config_path;

    const configManager = new ConfigManager(confPath);
    configManager.setSkyer(this).build();

    this._config = configManager;
  }

  _loadConstants() {
    this._loadByType(FILE_TYPE.CONSTANT, this._loadConstant);
  }

  _loadConstant( prefix, Constant, file ) {
    const key = this.utils.parseConstKeyByFile(file);

    const prefixArr = prefix.split('/');

    let currNode = this._consts;
    for ( let i = 1; i < prefixArr.length; i++ ) {
      let ns = prefixArr[i];

      if ( ns === '' ) {
        currNode[key] = Constant;
      } else {
        if ( !currNode[ns] ) {
          currNode[ns] = {};
        }

        currNode = currNode[ns];

        if ( i === prefixArr.length - 1 ) {
          currNode[key] = Constant;
        }
      }
    }
  }

  _loadComponents() {
    const componentManager = new ComponentManager();
    this.componentManager  = componentManager;
    componentManager.setSkyer(this).build();
  }

  _loadByType( fileType, handler ) {
    handler = handler || function () {
      };

    let dirPath = '';
    let files   = '';
    switch ( fileType ) {
      case FILE_TYPE.ROUTE:
        dirPath = this.options.route_path;
        files   = glob.sync(dirPath + '/**/*.route.js');
        if ( !files || files.length === 0 ) {
          // load default routes
          dirPath = path.join(__dirname, 'routes');
          files   = glob.sync(dirPath + '/**/*.route.js');
        }
        break;
      case FILE_TYPE.CONTROLLER:
        dirPath = this.options.controller_path;
        files   = glob.sync(dirPath + '/**/*.controller.js');
        if ( !files || files.length === 0 ) {
          // load default controllers
          dirPath = path.join(__dirname, 'controllers');
          files   = glob.sync(dirPath + '/**/*.controller.js');
        }
        break;
      case FILE_TYPE.SYS_MIDDLEWARE:
        dirPath = path.join(__dirname, 'middlewares');
        files   = glob.sync(dirPath + '/*.js');
        break;
      case FILE_TYPE.ROUTE_MIDDLEWARE:
        dirPath = this.options.route_middleware_path;
        files   = glob.sync(dirPath + '/**/*.middleware.js');
        break;
      case FILE_TYPE.APP_MIDDLEWARE:
        dirPath = this.options.app_middleware_path;
        files   = glob.sync(dirPath + '/**/*.middleware.js');
        break;
      case FILE_TYPE.CONSTANT:
        dirPath = this.options.constant_path;
        files   = glob.sync(dirPath + '/**/*.const.js');
        break;
      case FILE_TYPE.SERVICE:
        dirPath = this.options.service_path;
        files   = glob.sync(dirPath + '/**/*.service.js');
        break;
      case FILE_TYPE.CONFIG:
      case FILE_TYPE.VIEW:
      default:
        return;
    }

    files.forEach(file => {
      let Module = this.utils.requireSafe(file);
      if ( Module ) {
        let prefix = this.utils.getPrefix(file, dirPath);
        handler.bind(this)(prefix, Module, file);
      }
    });
  }

  _start() {
    const Application = require('./Application');
    const app         = new Application(this);
    app.start();
  }

  static get defaultConfig() {
    return {
      config_path: path.join(Skyer.rootPath, 'config'),
      route_path: path.join(Skyer.rootPath, 'app/routes'),
      bootstrap_path: path.join(Skyer.rootPath, 'app/bootstrap'),
      controller_path: path.join(Skyer.rootPath, 'app/controllers'),
      service_path: path.join(Skyer.rootPath, 'app/services'),
      route_middleware_path: path.join(Skyer.rootPath, 'app/middlewares/route'),
      app_middleware_path: path.join(Skyer.rootPath, 'app/middlewares/app'),
      constant_path: path.join(Skyer.rootPath, 'app/constants'),
      component_path: path.join(Skyer.rootPath, 'app/components'),

      logger_path: path.join(Skyer.rootPath, 'logs'),
      public_path: path.join(Skyer.rootPath, 'public'),
      view_path: path.join(Skyer.rootPath, 'app/views'),

      controller_prefix_separator: '^',
      controller_action_separator: '#',
      controller_action_suffix: '',
      controller_default_action: 'index',

      middleware_prefix_separator: '^',
      middleware_action_separator: '#',
      middleware_action_suffix: '',
      middleware_default_action: '__default'
    };
  }

  static get rootPath() {
    return Skyer.getEnv(Skyer.ROOT_PATH_NAME) || global[Skyer.ROOT_PATH_NAME] || process.cwd();
  }

  static get ROOT_PATH_NAME() {
    return 'SKYER_ROOT_PATH';
  }

  static getEnv( name ) {
    return process.env[name];
  }

  get utils() {
    return utils;
  }

  get env() {
    return this.getEnv('NODE_ENV') || 'development';
  }

  get controllers() {
    return this._controllers;
  }

  get services() {
    return this._services;
  }

  get config() {
    return this._config;
  }

  get consts() {
    return this._consts;
  }

  get logger() {
    // todo:
    //  skyer.logger.info('hello')
    //  skyer.logger.orderLogger.info('orderNo')
    return this.componentManager.getComponent('logger');
  }
}

Skyer._     = lodash;
Skyer.utils = utils;

Skyer.Route           = require('./abstract/AbstractRoute');
Skyer.Service         = require('./abstract/AbstractService');
Skyer.Controller      = require('./abstract/AbstractController');
Skyer.Component       = require('./abstract/AbstractComponent');
Skyer.AppMiddleware   = require('./abstract/AppMiddleware');
Skyer.RouteMiddleware = require('./abstract/RouteMiddleware');

module.exports = global.Skyer = Skyer;
require('pkginfo')(module, 'name', 'version', 'author');

