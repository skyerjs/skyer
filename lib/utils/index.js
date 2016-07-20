'use strict';

const _    = require('lodash');
const path = require('path');


exports.fullEqual = function fullEqual( a, b ) {
  if ( !this.fullContains(a, b) ) {
    return false;
  }

  return this.fullContains(b, a);
};

exports.fullContains = function fullContains( a, b ) {
  if ( a === null === b ) {
    return true;
  }
  if ( a === null || b === null ) {
    return false;
  }

  for ( let key in a ) {
    if ( typeof a[key] !== 'object' ) {
      if ( a[key] !== b[key] ) {
        return false;
      }
    } else if ( typeof b[key] !== 'object' ) {
      return false;
    } else {
      if ( !fullContains(a[key], b[key]) ) {
        return false;
      }
    }
  }

  return true;
};


/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api public
 */

exports.isGenerator = function isGenerator( obj ) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
};

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api public
 */
exports.isGeneratorFunction = function isGeneratorFunction( obj ) {
  var constructor = obj.constructor;
  if ( !constructor ) return false;
  if ( 'GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName ) return true;
  return this.isGenerator(constructor.prototype);
};

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */
exports.isPromise = function isPromise( obj ) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
};


exports.requireSafe = ( file ) => {
  const fsexists = require('fsexists');
  if ( fsexists.existsSync(file) ) {
    return require(file);
  }

  return null;
};

exports.getPrefix = function getPrefix( realPath, prefixPath ) {
  const basename = path.basename(realPath);

  const prefix = realPath.substring(prefixPath.length, realPath.length - basename.length - 1);

  return prefix || '/';
};

exports.parseController = function parseController( Controller ) {
  return this.parseNameByType(Controller, 'Controller');
};

exports.parseMiddleware = function parseMiddleware( Middleware ) {
  return this.parseNameByType(Middleware, 'Middleware');
};

exports.parseService = function parseService( Service ) {
  return this.parseNameByType(Service, 'Service');
};

exports.parseNameByType = function ( Class, type ) {
  if ( Class.alias ) {
    return Class.alias;
  }

  const regExp = new RegExp(`(\\S+)${type}$`);

  if ( regExp.test(Class.name) ) {
    return _.lowerFirst(RegExp.$1);
  }

  return null;
};

exports.parseRoute = function parseRoute( Route ) {
  const name = Route.name;

  if ( /(\S+)Route$/.test(name) ) {
    // todo: 首字母小写
    return RegExp.$1.toLowerCase();
  }

  // invalid Route name
  return null;
};

exports.parseConstKeyByFile = function ( file ) {
  if ( /(\S+).const.js$/.test(path.basename(file)) ) {

    // todo: user.status.const.js  -> { user:{status:{}} }
    return RegExp.$1;
  }

  return null;
};