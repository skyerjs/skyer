'use strict';

const _     = require('lodash');
const path  = require('path');
const glob  = require('glob');
const debug = require('debug')('skyer:manager:component');

const LoggerComponent = require('../components/LoggerComponent');

// const ServiceDiscovery = require('../service/discovery');

const AbstractElement   = require('./../abstract/AbstractElement');
const AbstractComponent = require('../abstract/AbstractComponent');

const MANAGER_STATES = {
  INIT: 0,
  BUILD: 1,
  UPDATE: 2
};

const defaultOptions = {};

class ComponentManager extends AbstractElement {
  constructor( options ) {
    super('componentManager');

    this.options = _.extend(defaultOptions, options || {});

    this.state = MANAGER_STATES.INIT;

    this.configManager = null;

    // todo: 写成component
    this._serviceDiscoveryMap = {};

    this._systemComponents = [];

    this._buildInComponentFactoryMap = {};

    this._userComponents = {};

    this.components = {};
  }

  _init() {
    this._loadComponents();

    this.state = MANAGER_STATES.INIT;

    this._buildAllComponents();
    this._systemComponentsHotUpdate();
    this._associateComponents();

    this.state = MANAGER_STATES.BUILD;

    return this;
  }

  _loadComponents() {
    debug('loading logger component...');
    this._loadLoggerComponent();
    debug('loading system component...');
    this._loadSystemComponents();
    debug('loading user component...');
    this._loadUserComponents();
    debug('load component finish! registering components by config...');
    this._registerComponents();
  }

  _loadLoggerComponent() {
    const loggerComponent = new LoggerComponent('logger');
    loggerComponent.setSkyer(this.skyer);
    this._initComponent(loggerComponent);

    debug('load logger component finish');

    this._systemComponents.push(loggerComponent);
  }

  _loadSystemComponents() {
    debug('load system components');

    // todo:
  }

  _loadUserComponents() {
    debug('>>>>>>>> Load user components');
    this._loadComponentsByPath(this.skyer.options.component_path, this._buildComponentFactory);
  }

  _associateComponents() {
    for ( let name in this.components ) {
      this.components[name].associate(this);
    }
  }

  _buildComponentFactory( ComponentClass ) {
    const alias = this._getComponentName(ComponentClass);

    this._buildInComponentFactoryMap[alias] = ( name, options ) => {
      const component = new ComponentClass(name, options);
      if ( typeof name !== 'string' ) {
        component.name = alias;
      }

      return component;
    };

    return alias;
  }

  _getComponentName( ComponentClass ) {
    if ( ComponentClass.alias ) {
      return ComponentClass.alias;
    }

    // UserComponent => name=user
    // UserStatusComponent => name=userStatus
    // UserApi  => name=userApi
    const name = ComponentClass.name;

    if ( /(\S+)Component$/.test(name) ) {
      return _.lowerFirst(RegExp.$1);
    }

    return _.lowerFirst(name);
  }

  _loadComponentsByPath( p, worker ) {
    if ( typeof worker !== 'function' ) {
      worker = function () {
      };
    }

    const files = glob.sync(p + "/**/*.component.js");

    files.forEach(file => {
      const Component = require(file);

      if ( typeof Component === 'object' ) {
        this.logger.verbose('export object :', file);

        // 内部有多个组件
        Object.keys(Component).forEach(key => {
          const ChildrenComponent = Component[key];

          worker.bind(this)(ChildrenComponent);
        });
      }

      if ( typeof Component === 'function' ) {
        this.logger.verbose('export function :', file);

        worker.bind(this)(Component);
      }
    });
  }

  _registerComponents() {
    const components = this.skyer.config.get('components');

    if ( !Array.isArray(components) ) {
      debug('invalid components config, should be array');
      return;
    }

    // todo: add ComponentsListParser module

    components.forEach(componentConf => {
      // componentConf is Array  todo:// support other data constructor
      // register component
      const name = componentConf[0];
      if ( typeof name === 'function' ) {
        // name is ComponentClass
        componentConf[0] = this._buildComponentFactory(name);
      }

      this.registerComponent.apply(this, componentConf);
    });
  }

  _systemComponentsHotUpdate() {
    debug('>>>>>>>> hotUpdate all system components');
    this._systemComponents.forEach(component => {
      component.hotUpdate();
    });
  }

  // instance all components
  _buildAllComponents() {
    debug('>>>>>>>> build all components');

    for ( let alias in this._userComponents ) {
      const componentInfo = this._userComponents[alias];

      const name = componentInfo.name;

      const componentOrFactory = componentInfo.componentOrFactory;

      this._buildComponent(name, alias, componentOrFactory);
    }
  }

  _initComponent( component ) {
    if ( !(component instanceof  AbstractComponent) ) {
      this.logger.error('invalid component');
      return null;
    }

    this.components[component.name] = component;

    component.setSkyer(this.skyer);
    component.registerManager(this);
    component.build();

    return component;
  }

  _buildComponent( name, alias, componentOrFactoryOrOptions ) {
    this.logger.verbose('parse component name:%s  alias:%s', name, alias);

    // 自定义组件: 如果有自定义 handler
    if ( componentOrFactoryOrOptions instanceof AbstractComponent ) {
      // 组件实例
      this._initComponent(componentOrFactoryOrOptions);
    } else if ( typeof componentOrFactoryOrOptions === 'function' ) {
      // 组件工厂,返回的是一个 component 实例
      const component = componentOrFactoryOrOptions.call(this);
      this._initComponent(component);
    } else {
      const buildInComponentFactory = this._buildInComponentFactoryMap[name];

      // 调用内建组件工厂来 构建组件
      if ( buildInComponentFactory ) {
        // 组件工厂,返回的是一个 component 实例
        let component = buildInComponentFactory(alias, componentOrFactoryOrOptions);

        this._initComponent(component);
      } else {
        this.logger.error('invalid component or factory -> name:%s alias:%s', name, alias);
      }
    }
  }

  /**
   * 预注册组件
   * 一个类型的组件 可以注册多个实例名,实例名唯一
   * 如： (redis, liveRedisClient,xx)  (redis,settingRedisClient,xx)
   *
   * @param name
   * @param alias
   * @param componentOrFactory
   */
  _registerComponent( name, alias, componentOrFactory ) {
    this._userComponents[alias] = {
      name: name,
      componentOrFactory: componentOrFactory
    };
  }

  /**
   * 解析
   *
   * @param name 组件类型名
   * @param alias 组件实例名
   * @param componentOrFactory {options/Component}
   * @returns {{name: string, alias: *, componentOrFactory: *}}
   */
  _prepareComponent( name, alias, componentOrFactory ) {
    // 直接注册组件
    if ( name instanceof AbstractComponent ) {
      componentOrFactory = name;

      name  = componentOrFactory.name;
      alias = componentOrFactory.name;
    }

    // 组件参数 {}
    if ( typeof alias === 'object' ) {
      // 没有自定义组件名
      componentOrFactory = alias;

      alias = name;
    }

    // 组件实例
    if ( alias instanceof AbstractComponent ) {
      componentOrFactory = alias;

      name  = componentOrFactory.name;
      alias = componentOrFactory.name;
    }

    // 组件工厂
    if ( typeof name === 'function' ) {
      componentOrFactory = alias;

      alias = name = '';
    }

    // 组件工厂
    if ( typeof alias === 'function' ) {
      componentOrFactory = alias;

      alias = name;
    }

    if ( !alias ) {
      alias = name;
    }

    return {
      name: name, // c
      alias: alias, // ac
      componentOrFactory: componentOrFactory
    };
  }

  /**
   * 注册组件 , 组件管理器启动之前
   *
   * @param {String|Component} name 组件/组件名
   * @param {String|Component} [alias] 组件/自定义组件名
   * @param {Component|Function|Object} [componentOrFactory] 组件实例/组件工厂/组件构造函数options
   *
   * @returns {ComponentManager}
   */
  registerComponent( name, alias, componentOrFactory ) {
    const parseResult = this._prepareComponent(name, alias, componentOrFactory);

    if ( typeof parseResult.name !== 'string' ) {
      this.logger.error('Fail register component,invalid name');
      return this;
    }

    name  = parseResult.name;
    alias = parseResult.alias;

    debug('Register component name:%s alias:%s', name, alias);
    this._registerComponent(name, alias, parseResult.componentOrFactory);
    return this;
  }

  // get component handler
  get( name ) {
    if ( this.components[name] ) {
      return this.components[name].getHandler();
    }

    return null;
  }

  /**
   * get component by name
   *
   * Example:
   *   const loggerComp = componentManager.getComponent('logger');
   *
   * @param name
   */
  getComponent( name ) {
    return this.components[name];
  }

  getComponentNames() {
    return Object.keys(this.components);
  }

  /**
   * add component runtime
   *
   * @param {String} name 系统/自定义 组件名
   * @param {String/Component/Function/Array} [alias] 组件/自定义组件名
   * @param {Component/Function/Array} [componentOrFactory] 组件/工厂
   */
  addComponent( name, alias, componentOrFactory ) {
    this.registerComponent(name, alias, componentOrFactory);

    if ( this.state !== MANAGER_STATES.INIT ) {
      const parseResult = this._prepareComponent(name, alias, componentOrFactory);

      name  = parseResult.name;
      alias = parseResult.alias;

      debug('Add component name:%s alias:%s', name, alias);

      this._buildComponent(name, alias, parseResult.componentOrFactory);
    }

    return this;
  }

  removeComponent( name ) {
    debug('Remove component %s', name, { pid: process.pid });

    delete this._userComponents[name];

    this.components[name].shutdown();
    delete this.components[name];
    return this;
  }

  registerServiceDiscovery( serviceDiscovery ) {
/*    if ( serviceDiscovery instanceof ServiceDiscovery ) {
      debug('Register serviceDiscovery name:%s', serviceDiscovery.name);
      let loggerComponent = this.getComponent('logger');
      serviceDiscovery.setLogger(loggerComponent.serviceLogger);

      this._serviceDiscoveryMap[serviceDiscovery.name] = serviceDiscovery;
    } else {
      this.logger.error('Invalid serviceDiscovery');
    }
    return this;*/
  }

  getServiceDiscovery( type ) {
    return this._serviceDiscoveryMap[type];
  }

  get logger() {
    return this.get('logger');
  }

  hotUpdate() {
    debug('HotUpdate all components', { pid: process.pid });
    for ( let name in this.components ) {
      const component = this.components[name];
      component.hotUpdate();
    }

    this.state = MANAGER_STATES.UPDATE;

    this._associateComponents();

    return this;
  }

  shutdown() {
    super.shutdown();

    debug('Shutdown all service discovery', { pid: process.pid });
    for ( let key in this._serviceDiscoveryMap ) {
      let serviceDiscovery = this._serviceDiscoveryMap[key];
      serviceDiscovery && serviceDiscovery.shutdown();
    }

    debug('Shutdown all components', { pid: process.pid });
    for ( let name in this.components ) {
      let component = this.components[name];
      component && component.shutdown();
    }
  }
}

module.exports = ComponentManager;
