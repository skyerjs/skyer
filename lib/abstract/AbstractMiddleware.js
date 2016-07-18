'use strict';

const AbstractElement = require('./AbstractElement');

class AbstractMiddleware extends AbstractElement {
  constructor( name, type ) {
    super();

    this.name = name;
    this.type = type;
  }


}

module.exports = AbstractMiddleware;