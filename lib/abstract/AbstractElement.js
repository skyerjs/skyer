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

  get logger() {
    return this.skyer.logger;
  }

  setSkyer( skyer ) {
    this.skyer = skyer;

    return this;
  }

  _init() {

  }

  build() {
    this._init();

    return this;
  }

  isEnabled() {
    return this._enabled;
  }

  shutdown() {

  }
}

module.exports = AbstractElement;