'use strict';

var should = require('chai').should();

var BasicAuthenticator = require('../../lib/authenticator/basic');


describe('Basic Authenticator', function() {

    var authenticator;

    beforeEach(function() {
       authenticator = new BasicAuthenticator({
           username: 'testuser',
           password: 'testpass'
       });

    });

    describe('canRead', function() {
        it('should return false if no authorization', function(done) {
            authenticator.canRead('a', 'b', null)
                .then(function(canRead) {
                    canRead.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if not valid authorization', function(done) {
            authenticator.canRead('a', 'b', 'testaaa')
                .then(function(canRead) {
                    canRead.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if user name incorrect', function(done) {
            authenticator.canRead('a', 'b', 'Basic bm90Y29ycmVjdDp0ZXN0cGFzcw==')
                .then(function(canRead) {
                    canRead.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if password incorrect', function(done) {
            authenticator.canRead('a', 'b', 'Basic dGVzdHVzZXI6bm90Y29ycmVjdA==')
                .then(function(canRead) {
                    canRead.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return true for correct username and password', function(done) {
            authenticator.canRead('a', 'b', 'Basic dGVzdHVzZXI6dGVzdHBhc3M=')
                .then(function(canRead) {
                    canRead.should.equal(true);
                    done();
                })
                .catch(done);
        });
    });

    describe('canWrite', function() {
        it('should return false if no authorization', function(done) {
            authenticator.canWrite('a', 'b', null)
                .then(function(canWrite) {
                    canWrite.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if not valid authorization', function(done) {
            authenticator.canWrite('a', 'b', 'testaaa')
                .then(function(canWrite) {
                    canWrite.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if user name incorrect', function(done) {
            authenticator.canWrite('a', 'b', 'Basic bm90Y29ycmVjdDp0ZXN0cGFzcw==')
                .then(function(canWrite) {
                    canWrite.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return false if password incorrect', function(done) {
            authenticator.canWrite('a', 'b', 'Basic dGVzdHVzZXI6bm90Y29ycmVjdA==')
                .then(function(canWrite) {
                    canWrite.should.equal(false);
                    done();
                })
                .catch(done);
        });

        it('should return true for correct username and password', function(done) {
            authenticator.canWrite('a', 'b', 'Basic dGVzdHVzZXI6dGVzdHBhc3M=')
                .then(function(canWrite) {
                    canWrite.should.equal(true);
                    done();
                })
                .catch(done);
        });
    });
});