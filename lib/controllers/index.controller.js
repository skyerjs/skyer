'use strict';

const AbstractController = require('../abstract/AbstractController');

class IndexController extends AbstractController {
  constructor() {
    super();
  }

  index() {
    return function* () {
      this.body = 'Hello Skyer!';
    };
  }
}

module.exports = IndexController;