'use strict';


function fullEqual( a, b ) {
  if ( !fullContains(a, b) ) {
    return false;
  }

  return fullContains(b, a);
}

function fullContains( a, b ) {
  if ( a === null === b ) {
    return true;
  }
  if ( a === null || b === null ) {
    return false;
  }

  for ( let key in a ) {
    if ( typeof a[key] !== 'object' ) {
      if ( a[key] !== b[key] ) {
        return false;
      }
    } else if ( typeof b[key] !== 'object' ) {
      return false;
    } else {
      if ( !fullContains(a[key], b[key]) ) {
        return false;
      }
    }
  }

  return true;
}

exports.fullContains = fullContains;
exports.fullEqual    = fullEqual;
