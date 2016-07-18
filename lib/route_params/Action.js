'use strict';

const AbstractElement = require('./../abstract/AbstractElement');

class Action extends AbstractElement {
  constructor( str, type ) {
    super();

    this.str = str;

    this.prefix = '';
    this.name   = '';

    this.action = '';

    this._type = type;

    this._isValid = true;

    this.skyer          = null;
    this._actionSep     = '';
    this._prefixSep     = '';
    this._actionSuffix  = '';
    this._defaultAction = '';
  }

  build() {
    super.build();

    const arr = this.str.split(this._actionSep);
    if ( arr.length < 2 ) {
      let nameWithPrefix = arr[0];
      if ( !nameWithPrefix.endsWith(this._type) ) {
        this._isValid = false;
        return;
      }

      this._parseNameAndPrefix(nameWithPrefix);

      this.action = this._defaultAction + this._actionSuffix;
      return;
    }

    const nameAndPrefix = arr[0];
    this.action         = arr[1];

    this._parseNameAndPrefix(nameAndPrefix);
  }

  _parseNameAndPrefix( nameAndPrefix ) {
    const prefixArr = nameAndPrefix.split(this._prefixSep);

    function regExpParse( name ) {
      const regExp = new RegExp(`(\\S+)${this._type}$`);

      if ( regExp.test(name) ) {
        this.name = RegExp.$1.toLowerCase() || (this._defaultAction + this._actionSuffix);
      }
    }

    if ( prefixArr.length === 1 ) {
      this.prefix = '';
      regExpParse.call(this, prefixArr[0]);
    } else {
      this.prefix = prefixArr[0];
      regExpParse.call(this, prefixArr[1]);
    }
  }

  isValid() {
    return this._isValid;
  }
}

module.exports = Action;