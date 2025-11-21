
const admin = require('firebase-admin');
admin.initializeApp();

const customerFunctions = require('./customer');
const bunkFunctions = require('./bunk');
const pointsFunctions = require('./points');
const userFunctions = require('./user');
const configFunctions = require('./config');
const adminFunctions = require('./admin');
const managerFunctions = require('./manager');

exports.registerCustomer = customerFunctions.registerCustomer;
exports.createBunk = bunkFunctions.createBunk;
exports.assignManagerToBunk = bunkFunctions.assignManagerToBunk;
exports.unassignManagerFromBunk = bunkFunctions.unassignManagerFromBunk;
exports.deleteBunk = bunkFunctions.deleteBunk;
exports.creditPoints = pointsFunctions.creditPoints;
exports.redeemPoints = pointsFunctions.redeemPoints;
exports.setUserRole = userFunctions.setUserRole;
exports.onUserCreate = userFunctions.onUserCreate;
exports.updateGlobalConfig = configFunctions.updateGlobalConfig;
exports.deleteUser = userFunctions.deleteUser;
exports.getAllBunks = adminFunctions.getAllBunks;
exports.getAllTransactions = adminFunctions.getAllTransactions;
exports.updateUserProfile = userFunctions.updateUserProfile;
exports.getAssignedBunk = managerFunctions.getAssignedBunk;
exports.getCustomerProfile = customerFunctions.getCustomerProfile;
exports.getCustomerTransactions = customerFunctions.getCustomerTransactions;
exports.getManagerTransactions = managerFunctions.getManagerTransactions;
