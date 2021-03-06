'use strict';

const copy = require('copy-to');
const fs   = require('fs');
const path = require('path');
const glob = require('glob');
const _    = require('lodash');

const debug    = require('debug')('skyer:manager:config');
const fsexists = require('fsexists');

const AbstractElement = require('./../abstract/AbstractElement');

class ConfigManager extends AbstractElement {
  constructor( path ) {
    super('configManager');

    this._config = {};

    this._oldConfig   = {};
    this._localConfig = {};

    this._path = path;
  }

  _init() {
    super._init();

    this._loadConfig();
    this._loadEnvConfig();
  }

  // without env
  _loadConfig() {
    const confPath = this._path;

    if ( !fsexists.existsSync(confPath) ) {
      return;
    }

    const files = glob.sync(`${confPath}/*.js`);
    // components.js  =>  module.exports.components = [];

    function load( file ) {
      const module = require(file);
      if ( typeof module !== 'object' ) {
        throw new Error('invalid object');
      }

      const keys = Object.keys(module);
      if ( !keys || keys.length !== 1 ) {
        throw new Error('invalid key count');
      }

      keys.forEach(key => {
        this._config[key] = module[key];
      });
    }

    files.forEach(file => {
      try {
        debug('load config with file:%s', file);
        load.call(this, file);
      } catch ( err ) {
        debug('invalid config file:%s err:%s', file, err.message);
      }
    });
  }

  _loadEnvConfig() {
    const envConfigPath = path.join(this._path, 'env');

    if ( !fsexists.existsSync(envConfigPath) ) {
      return;
    }

    const fileNames = fs.readdirSync(envConfigPath)
      .filter(file => {
        return path.extname(file) === '.js';
      })
      .map(file => {
        return path.basename(file, '.js');
      });

    const env = this.skyer.env;

    const hasCommonConf = fileNames.indexOf('common') > -1;
    const hasLocalConf  = fileNames.indexOf('local') > -1;

    let envConfig = this.skyer.utils.requireSafe(path.join(envConfigPath, env + '.js'));

    if ( hasCommonConf ) {
      envConfig = Object.assign(this.skyer.utils.requireSafe(path.join(envConfigPath, 'common.js')), envConfig);
    }

    if ( hasLocalConf && env === 'development' ) {
      this._localConfig = this.skyer.utils.requireSafe(path.join(envConfigPath, 'local.js'));
    }

    const config = envConfig || {};
    config.env   = env;

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