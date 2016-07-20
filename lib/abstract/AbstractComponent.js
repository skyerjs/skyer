'use strict';

const _     = require('lodash');
const debug = require('debug')('skyer:abstract:component');

const utils = require('../utils/index');

const AbstractElement = require('./AbstractElement');

class AbstractComponent extends AbstractElement {
  constructor( name, options ) {
    super('abstractComponent');

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

    this.manager = null;

    this.on('error', err => {
      debug('component %s err:', this.name, err);
      console.log(err.stack);

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

  setHandler( handler ) {
    this._handler = handler;
  }

  getHandler() {
    return this._handler;
  }

  _beforeBuild() {
    // debug('[%s] before build component', this.name);

  }

  _build() {
    // debug('[%s] building component', this.name);

    this.version++;
    this.buildTime = new Date();

    this._setConfig(this.config);
  }

  _afterBuild() {
    // debug('[%s] after build component', this.name);
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
    const newConf = this.config;
    debug('[%s] hotUpdate component, new config: %j', this.name, newConf);

    debug('[%s] check hotUpdate component', this.name);

    if ( !this._isConfigChanged(newConf) ) {
      debug('[%s] hotUpdate component just do nothing, because config has not change.', this.name);
      return;
    }

    debug('[%s HotUpdate] check component custom hotUpdate logic, version:%s', this.name, this.version);
    if ( !this._shouldHotUpdate() ) {
      debug('[%s HotUpdate] finish custom hotUpdate logic, version:%s', this.name, this.version);
      return;
    }

    debug('[%s HotUpdate] no custom hotUpdate logic, should be rebuild, version:%s', this.name, this.version);

    debug('[%s HotUpdate] before rebuild, version:%s', this.name, this.version);
    this.build();
    debug('[%s HotUpdate] after  rebuild, version:%s', this.name, this.version);
  }

  _setConfig( config ) {
    this._config = config;
  }

  _getConfig() {
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

  get config() {
    return this._getConfig();
  }

  associate() {

  }

  shutdown() {
    super.shutdown();
    debug('[%s] shutdown component version:%s', this.name, this.version);
  }
}

module.exports = AbstractComponent;