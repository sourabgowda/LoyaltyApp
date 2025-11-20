
const admin = require('firebase-admin');
admin.initializeApp();

const customerFunctions = require('./customer');
const bunkFunctions = require('./bunk');
const pointsFunctions = require('./points');
const userFunctions = require('./user');
const configFunctions = require('./config');

exports.registerCustomer = customerFunctions.registerCustomer;
exports.createBunk = bunkFunctions.createBunk;
exports.assignManagerToBunk = bunkFunctions.assignManagerToBunk;
exports.creditPoints = pointsFunctions.creditPoints;
exports.redeemPoints = pointsFunctions.redeemPoints;
exports.setUserRole = userFunctions.setUserRole;
exports.onUserCreate = userFunctions.onUserCreate;
exports.updateGlobalConfig = configFunctions.updateGlobalConfig;
exports.deleteUser = userFunctions.deleteUser;
