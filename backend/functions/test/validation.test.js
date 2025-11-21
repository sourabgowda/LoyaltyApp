
const assert = require('assert');
const {
    isValidEmail,
    isValidPassword,
    isValidFirstName,
    isValidLastName,
    isValidPincode
} = require('../validation');

describe('Validation Functions', () => {

    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            assert.strictEqual(isValidEmail('test@example.com'), true);
            assert.strictEqual(isValidEmail('user.name@domain.co.in'), true);
            assert.strictEqual(isValidEmail('test+alias@example.com'), true);
            assert.strictEqual(isValidEmail('long.email.address.that.is.still.valid@a.very.long.domain.name.com'), true);
            assert.strictEqual(isValidEmail('test@sub.domain.com'), true);
            assert.strictEqual(isValidEmail('123@456.com'), true);
            assert.strictEqual(isValidEmail('test.name+alias@example.com'), true);
        });

        it('should return false for invalid emails', () => {
            assert.strictEqual(isValidEmail('test@.com'), false);
            assert.strictEqual(isValidEmail('test@domain'), false);
            assert.strictEqual(isValidEmail('test'), false);
            assert.strictEqual(isValidEmail(null), false);
            assert.strictEqual(isValidEmail(''), false);
            assert.strictEqual(isValidEmail('test@domain..com'), false);
            assert.strictEqual(isValidEmail('.test@domain.com'), false);
        });
    });

    describe('isValidPassword', () => {
        it('should return true for valid passwords', () => {
            assert.strictEqual(isValidPassword('123456'), true);
            assert.strictEqual(isValidPassword('password123'), true);
            assert.strictEqual(isValidPassword('Pass$word'), true);
        });

        it('should return false for invalid passwords', () => {
            assert.strictEqual(isValidPassword('12345'), false);
            assert.strictEqual(isValidPassword(''), false);
            assert.strictEqual(isValidPassword(null), false);
        });
    });

    describe('isValidFirstName', () => {
        it('should return true for valid first names', () => {
            assert.strictEqual(isValidFirstName('John'), true);
            assert.strictEqual(isValidFirstName('Alice'), true);
            assert.strictEqual(isValidFirstName('J'), true);
            assert.strictEqual(isValidFirstName('AbcdefghijklmnopqrstuvwxyzAbcdefghijklmn'), true); // 40 chars
        });

        it('should return false for invalid first names', () => {
            assert.strictEqual(isValidFirstName('John Doe'), false);
            assert.strictEqual(isValidFirstName('ThisNameIsWayTooLongAndShouldFailValidation'), false);
            assert.strictEqual(isValidFirstName(null), false);
            assert.strictEqual(isValidFirstName('AbcdefghijklmnopqrstuvwxyzAbcdefghijklmno'), false); // 41 chars
            assert.strictEqual(isValidFirstName(''), false);
            assert.strictEqual(isValidFirstName('John123'), false);
            assert.strictEqual(isValidFirstName('John-Doe'), false);
            assert.strictEqual(isValidFirstName("O'Malley"), false);
        });
    });

    describe('isValidLastName', () => {
        it('should return true for valid last names', () => {
            assert.strictEqual(isValidLastName('Doe'), true);
            assert.strictEqual(isValidLastName('Van Der Sar'), true);
            assert.strictEqual(isValidLastName('Doe Bunk'), true);
            assert.strictEqual(isValidLastName('a'.repeat(80)), true);
        });

        it('should return false for invalid last names', () => {
            assert.strictEqual(isValidLastName('a'.repeat(81)), false);
            assert.strictEqual(isValidLastName('ThisLastNameIsWayTooLongAndShouldFailTheValidationProcessBecauseItExceedsTheLimitOf80Characters'), false);
            assert.strictEqual(isValidLastName('This has more than two spaces'), false);
            assert.strictEqual(isValidLastName(null), false);
            assert.strictEqual(isValidLastName(''), false);
            assert.strictEqual(isValidLastName('Doe123'), false);
            assert.strictEqual(isValidLastName('Doe-Bunk'), false);
            assert.strictEqual(isValidLastName("O'Malley"), false);
        });
    });

    describe('isValidPincode', () => {
        it('should return true for valid pincodes', () => {
            assert.strictEqual(isValidPincode('123456'), true);
            assert.strictEqual(isValidPincode('987654'), true);
        });

        it('should return false for invalid pincodes', () => {
            assert.strictEqual(isValidPincode('12345'), false);
            assert.strictEqual(isValidPincode('1234567'), false);
            assert.strictEqual(isValidPincode('012345'), false);
            assert.strictEqual(isValidPincode('abc'), false);
            assert.strictEqual(isValidPincode(null), false);
            assert.strictEqual(isValidPincode(''), false);
            assert.strictEqual(isValidPincode('123a56'), false);
            assert.strictEqual(isValidPincode('123 45'), false);
        });
    });

});
