const functions = require('firebase-functions');

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

function isValidFirstName(firstName) {
  return typeof firstName === 'string' && /^[A-Za-z]{1,40}$/.test(firstName);
}

function isValidLastName(lastName) {
  return typeof lastName === 'string' && /^[A-Za-z]+(?: [A-Za-z]+){0,2}$/.test(lastName) && lastName.length <= 80;
}

function isValidPincode(pincode) {
    return typeof pincode === 'string' && /^\d{6}$/.test(pincode);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidPhoneNumber(phone) {
    return typeof phone === 'string' && /^\d{10}$/.test(phone);
}

function isValidRole(role) {
    const allowedRoles = ['customer', 'manager', 'admin'];
    return typeof role === 'string' && allowedRoles.includes(role);
}

function isValidBunkName(name) {
    return typeof name === 'string' && name.length > 0 && name.length <= 50;
}

function isValidCoordinates(location) {
    return location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
}

function isValidCreditPercentage(percentage) {
    return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
}

function isValidPointValue(value) {
    return typeof value === 'number' && value > 0;
}

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidFirstName,
    isValidLastName,
    isValidPincode,
    isNonEmptyString,
    isValidPhoneNumber,
    isValidRole,
    isValidBunkName,
    isValidCoordinates,
    isValidCreditPercentage,
    isValidPointValue
};