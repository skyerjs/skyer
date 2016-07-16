'use strict';

/**
 * Copyright: @厦门以梦科技
 * Author: jerry
 * Date  : 16/7/13
 */

const AbstractElement = require('./AbstractElement');

class AbstractService extends AbstractElement {
  constructor() {
    super('service');
  }

  __beforeAction() {

  }

  __afterAction() {

  }
}

module.exports = AbstractService;