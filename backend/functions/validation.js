
// backend/functions/validation.js

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
    return typeof pincode === 'string' && /^[1-9][0-9]{5}$/.test(pincode);
}

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidFirstName,
    isValidLastName,
    isValidPincode
};
