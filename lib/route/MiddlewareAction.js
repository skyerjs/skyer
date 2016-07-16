'use strict';

const Action = require('./Action');

class MiddlewareAction extends Action {
  constructor( str ) {
    super(str, 'Middleware');
  }

  _init() {
    super._init();

    this._actionSep     = this.skyer.options.middleware_action_separator;
    this._prefixSep     = this.skyer.options.middleware_prefix_separator;
    this._actionSuffix  = this.skyer.options.middleware_action_suffix;
    this._defaultAction = this.skyer.options.middleware_default_action;
  }
}

module.exports = MiddlewareAction;