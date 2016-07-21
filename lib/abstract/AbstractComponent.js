'use strict';

const _     = require('lodash');
const debug = require('debug')('skyer:abstract:component');

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

  // abstract method
  _defaultOptions() {
    return {};
  }

  // abstract method
  _getConfig() {
    return {};
  }

  // abstract method
  _shouldHotUpdate() {
    return true;
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
    debug('[%s] before build component', this.name);

  }

  // abstract method
  _build() {
    debug('[%s] building component', this.name);

    this.version++;
    this.buildTime = new Date();

    this._setConfig(this.config);
  }

  _afterBuild() {
    debug('[%s] after build component', this.name);
  }

  build() {
    super.build();

    try {
      this._beforeBuild();

      const handlerOrPromise = this._build();
      // notice: support generic function and async function which return promise.
      if ( this.utils.isPromise(handlerOrPromise) ) {
        handlerOrPromise.then(handler => {
          this.setHandler(handler);
          this._afterBuild();
        }).catch(err => {
          debug(err);
          this.emit('eror', err);
        });
      } else {
        // is component handler
        this.setHandler(handlerOrPromise);
        this._afterBuild();
      }
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

  _isConfigChanged( newConf ) {
    if ( !this._config && newConf ) {
      return true;
    }

    return this.utils.fullEqual(this._config, newConf);
  }

  get config() {
    return this._getConfig();
  }

  // todo: components associate
  associate() {

  }

  shutdown() {
    super.shutdown();
    debug('[%s] shutdown component version:%s', this.name, this.version);
  }
}

module.exports = AbstractComponent;
