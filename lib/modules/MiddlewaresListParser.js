'use strict';

const _     = require('lodash');
const debug = require('debug')('skyer:modules:middlewares-parser');

const AbstractParser       = require('../abstract/AbstractParser');
const MiddlewareConfigItem = require('./MiddlewareConfigItem');


class MiddlewaresListParser extends AbstractParser {
  constructor( middlewaresList ) {
    super();

    this._results = []; // Array<MiddlewareConfigItem> with unique name sort by order asc

    this.middlewaresConf = middlewaresList;
  }

  _parse() {
    if ( !Array.isArray(this.middlewaresConf) ) {
      debug('invalid custom middlewares config');
    }

    const results = {};

    this.middlewaresConf.forEach(confItem => {
      const parsedItem = this._parseItem(confItem);
      if ( parsedItem ) {
        // unique by name
        results[parsedItem.name] = parsedItem;
      }
    });

    // sort by order
    const items = Object.keys(results).map(key => {
      return results[key];
    });

    this._results = _.sortBy(items, 'order');
  }

  _parseItem( item ) {
    // is array

    if ( Array.isArray(item) ) {
      const name  = item[0];
      const order = item[1];

      if ( typeof name !== 'string' ) {
        debug('invalid middleware item config, array[0] should be string');
        return null;
      }

      if ( Number.isNaN(Number(order)) ) {
        debug('invalid middleware item config, array[1] should be valid number');
        return null;
      }

      return new MiddlewareConfigItem(name, order);
    } else {
      if ( typeof item !== 'object' ) {
        debug('invalid middleware item config,should be array or object');
        return null;
      }

      const name  = item.name;
      const order = item.order;

      if ( typeof name !== 'string' ) {
        debug('invalid middleware item config for object, name should be string');
        return null;
      }

      if ( Number.isNaN(Number(order)) ) {
        debug('invalid middleware item config for object, order should be valid number');
        return null;
      }

      return new MiddlewareConfigItem(name, order);
    }
  }
}

module.exports = MiddlewaresListParser;