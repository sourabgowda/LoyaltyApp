const admin = require('firebase-admin');
admin.initializeApp();

const users = require('./callable/users');
const bunks = require('./callable/bunks');
const points = require('./callable/points');
const adminFunctions = require('./callable/admin');
const userTriggers = require('./triggers/users');

module.exports = {
    ...users,
    ...bunks,
    ...points,
    ...adminFunctions,
    ...userTriggers
};