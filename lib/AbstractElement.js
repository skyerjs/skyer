'use strict';

const EventEmitter = require('events');

class AbstractElement extends EventEmitter {
  constructor( name ) {
    super();

    this.name = name;

    this._enabled = true;

    this.on('error', err => {
      console.log(err);
    });
  }

  setSkyer( skyer ) {
    this.skyer = skyer;
  }

  _init() {

  }

  build() {
    this._init();
  }

  isEnabled() {
    return this._enabled;
  }

  shutdown() {

  }
}

module.exports = AbstractElement;