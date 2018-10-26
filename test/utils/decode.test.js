'use strict'

const assert = require('assert');
const decache = require('decache');
var decode, decodeClear;

describe('Decode.js Testing', () => {
    describe('Configs set to clear text', () => {
        var nconf = null;
        before(() => {
            nconf = require('nconf');
            nconf.use('memory');
            nconf.set('cleartext', 'true');
            nconf.save(() => {
                decodeClear = require('../../utils/decode');
            });
        })
        it('Should return same value passed in', (done) => {
            assert.equal(decodeClear("anything"), "anything");
            done()
        });
    });
    describe('Configs are encoded', () => {
        var nconf = null;
        before(() => {
            nconf = require('nconf');
            nconf.use('memory');
            nconf.reset();
            decache('../../utils/decode');
            decode = require('../../utils/decode');
        })
        it('Should decode base64 value', (done) => {
            assert.equal(decode("YW55dGhpbmc="), "anything");
            done();
        });
    });
});
