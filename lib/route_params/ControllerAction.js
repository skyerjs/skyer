'use strict';

const Action = require('./Action');

class ControllerAction extends Action {
  constructor( str ) {
    super(str, 'Controller');
  }

  _init() {
    super._init();

    this._actionSep     = this.skyer.options.controller_action_separator;
    this._prefixSep     = this.skyer.options.controller_prefix_separator;
    this._actionSuffix  = this.skyer.options.controller_action_suffix;
    this._defaultAction = this.skyer.options.controller_default_action;
  }
}

module.exports = ControllerAction;