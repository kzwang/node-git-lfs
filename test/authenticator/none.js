'use strict';

var should = require('chai').should();

var NoneAuthenticator = require('../../lib/authenticator/none');


describe('None Authenticator', function() {

    var authenticator;

    beforeEach(function() {
       authenticator = new NoneAuthenticator();

    });

    it('should always return true for canRead', function(done) {
        authenticator.canRead('a', 'b', null)
            .then(function(canRead) {
                canRead.should.equal(true);
                done();
            })
            .catch(done);
    });

    it('should always return true for canWrite', function(done) {
        authenticator.canWrite('a', 'b', null)
            .then(function(canWrite) {
                canWrite.should.equal(true);
                done();
            })
            .catch(done);
    });
});