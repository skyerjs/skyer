'use strict';

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