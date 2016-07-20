'use strict';

const _ = require('lodash');

class SwigMiddleware extends Skyer.AppMiddleware {
  constructor() {
    super();

    this.order = 5;
  }

  __default( app ) {
    const render = require('koa-swig');

    const swigConf = this.skyer.config.get('swig') || {};

    const defaultOpts = {
      root: this.skyer.options.view_path,
      autoescape: true,
      // disable, set to false or 'memory'
      cache: app.env === 'production' ? 'memory' : false,
      ext: 'html',
      // locals: '',
      writeBody: true,
      //filters: filters,
      //tags: tags,
      //extensions: extensions
    };

    const options = _.extend(defaultOpts, swigConf);

    // static register app.context property
    app.context.render = render(options);

    // will not be register to app middleware
    return false;
  }
}

module.exports = SwigMiddleware;
