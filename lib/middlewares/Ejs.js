'use strict';

const _ = require('lodash');

class EjsMiddleware extends Skyer.AppMiddleware {
  constructor( options ) {
    super(options);

    this.order = 6;
  }

  __default( app ) {
    const render = require('koa-ejs');

    const options = this.config;
    options.root  = options.root || this.skyer.options.view_path;
    render(app, options);

    return false;
  }

  _defaultOptions() {
    return {
      config_key: 'ejs',
      config_val: {
        root: '',
        layout: false,
        viewExt: 'html',
        cache: false,
        debug: true
      }
    };
  }
}

module.exports = EjsMiddleware;
