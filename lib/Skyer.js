'use strict';

const path   = require('path');
const lodash = require('lodash');
const glob   = require('glob');

const debug = require('debug')('skyer');

const ConfigManager    = require('./manager/ConfigManager');
const ComponentManager = require('./manager/ComponentManager');


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
    this._components  = {};

    this._route_middlewares = {};

    this._app_middlewares = [];
    this._sys_middlewares = [];

    this._listen_port     = 3000;
    this._listen_callback = () => {
      debug('sky application listen on port %s', this._listen_port);
    };
  }

  getEnv( name ) {
    return process.env[name];
  }

  listen( port, callback ) {
    this._listen_port = port;

    if ( callback && typeof  callback === 'function' ) {
      this._listen_callback = callback;
    }
  }

  fly() {
    debug('loading global...');
    this._loadGlobal();
    debug('loading config...');
    this._loadConfig();

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

  _loadGlobal() {
    const bootstrapPath = this.options.bootstrap_path;
    const globalFile    = path.join(bootstrapPath, 'global.js');
    this.utils.requireSafe(globalFile);
  }

  _loadMiddlewares() {
    this._loadByType(FILE_TYPE.SYS_MIDDLEWARE, this._loadSysMiddleware);
    this._loadByType(FILE_TYPE.APP_MIDDLEWARE, this._loadAppMiddleware);
    this._loadByType(FILE_TYPE.ROUTE_MIDDLEWARE, this._loadRouteMiddleware);
  }

  _loadSysMiddleware( prefix, Middleware, file ) {
    let name = this.utils.parseMiddleware(Middleware);
    if ( !name ) {
      debug('invalid sys Middleware file: %s', file);
      return;
    }

    const inst = new Middleware();
    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this);
    inst.build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    this._sys_middlewares.push(inst);
  }

  _loadAppMiddleware( prefix, Middleware, file ) {
    let name = this.utils.parseMiddleware(Middleware);
    if ( !name ) {
      debug('invalid app Middleware file: %s', file);
      return;
    }

    const inst = new Middleware();

    inst.name ? ( name = inst.name) : ( inst.name = name);
    inst.setSkyer(this);
    inst.build();

    if ( !inst.isEnabled() ) {
      // todo: logger
      return;
    }

    this._app_middlewares.push(inst);
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
    inst.setSkyer(this);
    inst.build();

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
    inst.setSkyer(this);
    inst.build();

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
    inst.setSkyer(this);
    inst.build();

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
    configManager.setSkyer(this);
    configManager.build();

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
    // 组件管理器注入


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
    return 'SKY_ROOT_PATH';
  }

  static getEnv( name ) {
    return process.env[name];
  }

  static get _() {
    return lodash;
  }

  get utils() {
    // todo: move to utils directory
    return {
      requireSafe: ( file ) => {
        const fsexists = require('fsexists');
        if ( fsexists.existsSync(file) ) {
          return require(file);
        }

        return null;
      },
      getPrefix: function getPrefix( realPath, prefixPath ) {
        const basename = path.basename(realPath);

        const prefix = realPath.substring(prefixPath.length, realPath.length - basename.length - 1);

        return prefix || '/';
      },

      parseController: function parseController( Controller ) {
        const name = Controller.name;

        if ( /(\S+)Controller$/.test(name) ) {
          // todo: 首字母小写
          return RegExp.$1.toLowerCase();
        }

        // invalid controller name
        return null;
      },

      parseMiddleware: function parseMiddleware( Middleware ) {
        const name = Middleware.name;

        if ( /(\S+)Middleware$/.test(name) ) {
          // todo: 首字母小写
          return RegExp.$1.toLowerCase();
        }

        // invalid Middleware name
        return null;
      },

      parseService: function parseService( Service ) {
        const name = Service.name;

        if ( /(\S+)Service$/.test(name) ) {
          // todo: 首字母小写
          return RegExp.$1.toLowerCase();
        }

        // invalid Service name
        return null;
      },

      parseRoute: function parseRoute( Route ) {
        const name = Route.name;

        if ( /(\S+)Route$/.test(name) ) {
          // todo: 首字母小写
          return RegExp.$1.toLowerCase();
        }

        // invalid Route name
        return null;
      },

      parseConstKeyByFile: function ( file ) {
        if ( /(\S+).const.js$/.test(path.basename(file)) ) {

          // todo: user.status.const.js  -> { user:{status:{}} }
          return RegExp.$1;
        }

        return null;
      }
    };
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

  get components() {
    return this._components;
  }

  get logger() {
    // todo:
    return {};
  }
}

Skyer.Route           = require('./abstract/AbstractRoute');
Skyer.Service         = require('./abstract/AbstractService');
Skyer.Controller      = require('./abstract/AbstractController');
Skyer.Component       = require('./abstract/AbstractComponent');
Skyer.AppMiddleware   = require('./abstract/AppMiddleware');
Skyer.RouteMiddleware = require('./abstract/RouteMiddleware');

module.exports = global.Skyer = Skyer;
require('pkginfo')(module, 'name', 'version', 'author');

