'use strict';

const _ = require('lodash');

const AbstractElement = require('./AbstractElement');

class AbstractMiddleware extends AbstractElement {
  constructor( name, type, options ) {
    super();

    this.name = name;
    this.type = type;

    options = options || {};

    /**
     * Description:
     *
     *   defaultOptions: { config_key: 'skyer' , config_val: { firstName: 'jerry', lastName: 'wu' } }
     *   constructor options: { config_key: 'new_skyer' , config_val: { firstName: 'JERRY' } }
     *
     *   merge result options: { config_key: 'new_skyer' , config_val: { firstName: 'JERRY',lastName: 'wu' } }
     */

    if ( options.config_val ) {
      const defaultOpts = this._defaultOptions();
      const configVal   = _.extend(defaultOpts.config_val || {}, options.config_val);

      this.options = _.extend(defaultOpts, options);

      this.options.config_val = configVal;
    } else {
      this.options = _.extend(this._defaultOptions(), options);
    }
  }

  // abstract method
  _defaultOptions() {
    return {};
  }

  // abstract method
  _getConfig() {
    const confKey = this.options.config_key;
    const config  = this.skyer.config.get(confKey) || {};

    return _.extend(this.options.config_val, config);
  }

  get config() {
    return this._getConfig();
  }
}

module.exports = AbstractMiddleware;