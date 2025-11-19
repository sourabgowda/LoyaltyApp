const test = require('firebase-functions-test')();

require('./test/callable/users.test.js');
require('./test/callable/bunks.test.js');
require('./test/callable/points.test.js');
require('./test/callable/admin.test.js');
require('./test/triggers/users.test.js');