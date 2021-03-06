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

  get utils() {
    return this.skyer.utils;
  }

  setSkyer( skyer ) {
    this.skyer = skyer;

    return this;
  }

  // abstract method
  _init() {

  }

  build() {
    this._init();

    return this;
  }

  isEnabled() {
    return this._enabled;
  }

  // abstract method
  shutdown() {

  }
}

module.exports = AbstractElement;