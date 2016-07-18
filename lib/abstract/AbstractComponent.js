'use strict';

const _     = require('lodash');
const debug = require('debug')('skyer:abstract:component');

const utils = require('../utils/index');

const AbstractElement = require('./AbstractElement');

class AbstractComponent extends AbstractElement {
  constructor( name, options ) {
    super();

    if ( typeof name === 'object' ) {
      options = name;
      name    = null;
    }

    if ( typeof options !== 'object' ) {
      options = {};
    }

    options = options || {};

    this.options = _.extend(this._defaultOptions(), options);

    this.name       = name || this.options.name || 'component';
    this.version    = 0;
    this.buildTime  = null;
    this.updateTime = null;

    this._config  = null;
    this._handler = null;

    this.manager       = null;
    this.configManager = null;

    this.on('error', err => {
      debug('component %s err:', this.name, err);

      // this.logger.error(err.stack, { pid: process.pid });
      // this.manager.sendMail(`component ${this.name} throw error`, err);
    });
  }

  _defaultOptions() {
    return {};
  }

  registerManager( manager ) {
    this.manager = manager;
  }

  registerConfigManager( configManager ) {
    this.configManager = configManager;
  }

  get logger() {
    const logger = this.manager.getComponent('logger');
    return logger.componentLogger;
  }

  setHandler( handler ) {
    this._handler = handler;
  }

  getHandler() {
    return this._handler;
  }

  _beforeBuild() {
    // this.logger.info('[%s] before build component', this.name);

  }

  _build() {
    // this.logger.info('[%s] building component', this.name);

    this.version++;
    this.buildTime = new Date();

    this._setConfig(this._getNewConfig());
  }

  _afterBuild() {
    // this.logger.info('[%s] after build component', this.name);
  }

  build() {
    super.build();

    try {
      this._beforeBuild();

      const handler = this._build();
      this.setHandler(handler);

      this._afterBuild();
    } catch ( e ) {
      this.emit('error', e);
    }
  }

  hotUpdate() {
    const newConf = this._getNewConfig();
    this.logger.verbose('[%s] hotUpdate component, new config: %j', this.name, newConf);

    this.logger.info('[%s] check hotUpdate component', this.name);

    if ( !this._isConfigChanged(newConf) ) {
      this.logger.info('[%s] hotUpdate component just do nothing, because config has not change.', this.name);
      return;
    }

    this.logger.info('[%s HotUpdate] check component custom hotUpdate logic, version:%s', this.name, this.version);
    if ( !this._shouldHotUpdate() ) {
      this.logger.info('[%s HotUpdate] finish custom hotUpdate logic, version:%s', this.name, this.version);
      return;
    }

    this.logger.info('[%s HotUpdate] no custom hotUpdate logic, should be rebuild, version:%s', this.name, this.version);

    this.logger.info('[%s HotUpdate] before rebuild, version:%s', this.name, this.version);
    this.build();
    this.logger.info('[%s HotUpdate] after  rebuild, version:%s', this.name, this.version);
  }

  _setConfig( config ) {
    this._config = config;
  }

  _getNewConfig() {
    return {};
  }

  _shouldHotUpdate() {
    return true;
  }

  _isConfigChanged( newConf ) {
    if ( !this._config && newConf ) {
      return true;
    }

    return utils.fullEqual(this._config, newConf);
  }

  associate() {

  }

  shutdown() {
    super.shutdown();
    this.logger.info('[%s] shutdown component version:%s', this.name, this.version);
  }
}

module.exports = AbstractComponent;
