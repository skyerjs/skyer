'use strict';

const _ = require('lodash');

class SwigMiddleware extends Skyer.AppMiddleware {
  constructor( options ) {
    super(options);

    this.order = 5;
  }

  __default( app ) {
    const render = require('koa-swig');

    const options = this.config || {};
    options.root = options.root || this.skyer.options.view_path;

    // static register app.context property
    app.context.render = render(options);

    // will not be register to app middleware
    return false;
  }

  _defaultOptions() {
    return {
      config_key: 'swig',
      config_val: {
        root: '',
        autoescape: true,
        // disable, set to false or 'memory'
        cache: false,
        ext: 'html',
        locals: '',
        writeBody: true
        //filters: filters,
        //tags: tags,
        //extensions: extensions
      }
    };
  }
}

module.exports = SwigMiddleware;
