'use strict';

/**
 * Copyright: @厦门以梦科技
 * Author: jerry
 * Date  : 16/7/13
 */
const AbstractElement = require('./AbstractElement');

class AbstractController extends AbstractElement {
  constructor( name ) {
    super(name);
  }

  __beforeAction() {

  }

  __afterAction() {

  }

  *sleep( timeout ) {
    return new Promise(( resolve, reject ) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }
}

module.exports = AbstractController;