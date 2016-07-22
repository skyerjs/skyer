'use strict';

class SessionMiddleware extends Skyer.AppMiddleware {
  constructor(options) {
    super(options);

    this.order = 60;
  }

  __default( app ) {
    const config = this.skyer.config;

    const sessConf = config.get('session') || {};

    app.keys = sessConf.keys || ['skyer', 'session_keys'];

    const session = require('koa-generic-session');

    const options = sessConf.options || {};

    if ( options.store && typeof options.store === 'function' ) {
      // factory function for return db store object.
      options.store = options.store.call(this.skyer, app);
    }

    return session(options);
  }
}

module.exports = SessionMiddleware;
