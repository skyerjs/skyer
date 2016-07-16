'use strict';

/**
 * Copyright: @厦门以梦科技
 * Author: jerry
 * Date  : 16/7/14
 */

const copy = require('copy-to');
const fs   = require('fs');
const path = require('path');
const _    = require('lodash');

const AbstractElement = require('./AbstractElement');

class ConfigManager extends AbstractElement {
  constructor( path ) {
    super('configManager');

    this._config      = {};
    this._oldConfig   = {};
    this._localConfig = {};

    this._path = path;
  }

  _init() {
    const NODE_ENV = process.env.NODE_ENV;

    const envConfigPath = path.join(this._path, 'env');
    const fileNames     = fs.readdirSync(envConfigPath)
      .filter(file => {
        return path.extname(file) === '.js';
      })
      .map(file => {
        return path.basename(file, '.js');
      });

    const env = fileNames.indexOf(NODE_ENV) > -1 ? NODE_ENV : 'development';

    const hasCommonConf = fileNames.indexOf('common') > -1;
    const hasLocalConf  = fileNames.indexOf('local') > -1;

    let envConfig = require(path.join(envConfigPath, env));

    if ( hasCommonConf ) {
      envConfig = Object.assign(require(path.join(envConfigPath, 'common')), envConfig);
    }

    const config = envConfig || {};
    config.env   = env;

    if ( hasLocalConf && env === 'development' ) {
      config.localConfig = require(path.join(envConfigPath, 'local')) || {};
      this._localConfig  = config.localConfig;
    }

    this.loadConfig(config);
  }

  loadConfig( config ) {
    this._oldConfig = this._config;
    copy(config).override(this._config);
    copy(this._localConfig).override(this._config);
  }

  get( key ) {
    return this._config[key];
  }

  set( key, value ) {
    this._oldConfig[key] = this.get(key);
    this._config[key]    = value;
  }

  getAll() {
    return this._config;
  }

  delete( key ) {
    delete this._config[key];
    delete this.defaultConfig[key];
    delete this._oldConfig[key];
    delete this._localConfig[key];
  }

  defaults( obj ) {

  }

  default( key, value ) {

  }

  getConfig() {
    return this._config;
  }

  getOldConfig() {
    return this._oldConfig;
  }

}

module.exports = ConfigManager;