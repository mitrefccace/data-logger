'use strict'

const assert = require('assert');
var validator = require('../../utils/validator');


describe('Validotor.js Testing', () => {
    describe('isUniqueId()', () => {
        it('Should return true for valid UniqueIds', () => {
            assert.equal(validator.isUniqueId("40651204817492.56"), true);
        });
        it('Should return false for invalid UniqueIds', () => {
            assert.equal(validator.isUniqueId("4065120481749256"), false);
            assert.equal(validator.isUniqueId("abc4065120481749256"), false);
            assert.equal(validator.isUniqueId("40651204a81749256"), false);
            assert.equal(validator.isUniqueId(4065120481749256), false);
            assert.equal(validator.isUniqueId("406512048.1749.256"), false);
            assert.equal(validator.isUniqueId(), false);
            assert.equal(validator.isUniqueId("uniqueid"), false);
            assert.equal(validator.isUniqueId("4065120481111111111111111111111111111.256"), false);
        });
    });
    describe('isDtmfDigit()', () => {
        it('Should return true for valid DTMF Digits', () => {
            assert.equal(validator.isDtmfDigit("1"), true);
            assert.equal(validator.isDtmfDigit("2"), true);
            assert.equal(validator.isDtmfDigit("3"), true);
            assert.equal(validator.isDtmfDigit("4"), true);
            assert.equal(validator.isDtmfDigit("5"), true);
            assert.equal(validator.isDtmfDigit("6"), true);
            assert.equal(validator.isDtmfDigit("7"), true);
            assert.equal(validator.isDtmfDigit("8"), true);
            assert.equal(validator.isDtmfDigit("9"), true);
            assert.equal(validator.isDtmfDigit("0"), true);
            assert.equal(validator.isDtmfDigit(1), true);
            assert.equal(validator.isDtmfDigit(2), true);
            assert.equal(validator.isDtmfDigit(3), true);
            assert.equal(validator.isDtmfDigit(4), true);
            assert.equal(validator.isDtmfDigit(5), true);
            assert.equal(validator.isDtmfDigit(6), true);
            assert.equal(validator.isDtmfDigit(7), true);
            assert.equal(validator.isDtmfDigit(8), true);
            assert.equal(validator.isDtmfDigit(9), true);
            assert.equal(validator.isDtmfDigit(0), true);
        });
        it('Should return true for invalid DTMF Digits', () => {
            assert.equal(validator.isDtmfDigit("A"), false);
            assert.equal(validator.isDtmfDigit("12"), false);
            assert.equal(validator.isDtmfDigit(12), false);
            assert.equal(validator.isDtmfDigit("#"), false);
            assert.equal(validator.isDtmfDigit(), false);
        });
    });

    describe('isChannel()', () => {
        it('Should return true for valid isChannel', () => {
            assert.equal(validator.isChannel("SIP/8500@sip.com:9876"), true);
        });
        it('Should return false for invalid isChannel', () => {
            assert.equal(validator.isChannel('SIP/8500@sip.com:987688888888888888888888888888888888888'), false);
            assert.equal(validator.isChannel(1), false);
            assert.equal(validator.isChannel("1"), false);
            assert.equal(validator.isChannel("9000@SIP/"), false);
            assert.equal(validator.isChannel(), false);
        });
    });

    describe('isPasswordComplex()', () => {
        it('Should return true for valid isPasswordComplex', () => {
            assert.equal(validator.isPasswordComplex("ABC123abc!@#"), true);
            assert.equal(validator.isPasswordComplex("123abc!@#ABC"), true);
        });
        it('Should return false for invalid isPasswordComplex', () => {
            assert.equal(validator.isPasswordComplex(), false);
            assert.equal(validator.isPasswordComplex(""), false);
            assert.equal(validator.isPasswordComplex("word"), false);
            assert.equal(validator.isPasswordComplex("Word"), false);
            assert.equal(validator.isPasswordComplex("word123"), false);
            assert.equal(validator.isPasswordComplex("word123!@#"), false);
            assert.equal(validator.isPasswordComplex("Word123"), false);
            assert.equal(validator.isPasswordComplex("Word!!!"), false);
            assert.equal(validator.isPasswordComplex("WORD123!@#"), false);
            assert.equal(validator.isPasswordComplex("SuperLongButValidCharacters123!@#"), false);
            assert.equal(validator.isPasswordComplex("Word 123!!"), false);
        });
    });

    describe('isUsernameValid()', () => {
        it('Should return true for valid isUsernameValid', () => {
            assert.equal(validator.isUsernameValid("username"), true);
            assert.equal(validator.isUsernameValid("Username"), true);
            assert.equal(validator.isUsernameValid("userName"), true);
            assert.equal(validator.isUsernameValid("userName1"), true);
            assert.equal(validator.isUsernameValid("user_name"), true);
            assert.equal(validator.isUsernameValid("user_name123"), true);
            assert.equal(validator.isUsernameValid("user_name_123"), true);
        });
        it('Should return false for invalid isChannel', () => {
            assert.equal(validator.isUsernameValid('abc'), false);
            assert.equal(validator.isUsernameValid('longusernamewedontallow'), false);
            assert.equal(validator.isUsernameValid('char!'), false);
            assert.equal(validator.isUsernameValid('test-this'), false);
            assert.equal(validator.isUsernameValid(), false);
        });
    });

    describe('isNameValid()', () => {
        it('Should return true for valid isNameValid', () => {
            assert.equal(validator.isNameValid("M"), true);
            assert.equal(validator.isNameValid("Night"), true);
            assert.equal(validator.isNameValid("Shyamalan"), true);
            assert.equal(validator.isNameValid("Hyphen-name"), true);
            assert.equal(validator.isNameValid("Smith Jr."), true);
        });
        it('Should return false for invalid isNameValid', () => {
            assert.equal(validator.isNameValid(), false);
            assert.equal(validator.isNameValid(''), false);
            assert.equal(validator.isNameValid('longmadeupnamethatisbiggerthanfortyfivecharacters'), false);
            assert.equal(validator.isNameValid('Numb3r'), false);
            assert.equal(validator.isNameValid('Loud!'), false);
        });
    });
});
