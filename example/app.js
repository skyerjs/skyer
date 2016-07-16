'use strict';

/**
 * 1: Enter root directory
 * 2: exec: npm install
 * 3: Enter example directory
 * 4: exec:  export DEBUG=skyer*;node app.js
 * 5: exec: curl http://localhost:3000/
 * 6: show: Hello Skyer!
 */

const Skyer = require('../index');

new Skyer().fly();
