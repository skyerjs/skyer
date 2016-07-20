'use strict';

const AbstractElement = require('./AbstractElement');

class AbstractParser extends AbstractElement {
  constructor() {
    super();

    this._results = null;
  }

  _parse() {

  }

  _init() {
    this._parse();
  }

  getResults() {
    return this._results;
  }
}

module.exports = AbstractParser;