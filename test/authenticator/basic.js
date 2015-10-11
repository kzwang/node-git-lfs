'use strict';

var crypto = require('crypto');
var fs = require('fs');
var ssh_utils = require('ssh2').utils;

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

    describe('checkSSHAuthorization', function() {
        beforeEach(function() {
            authenticator = new BasicAuthenticator({
                username: 'testuser',
                password: 'testpass',
                client_public_key: './ssh/client.pub'
            });
        });

        it('should return undefined if no public key in option', function* () {
            authenticator = new BasicAuthenticator({
                username: 'testuser',
                password: 'testpass'
            });

            var result = yield authenticator.checkSSHAuthorization();
            should.not.exist(result);
        });

        it('should return undefined if signature not valid', function* () {
            var key = ssh_utils.parseKey(fs.readFileSync('./ssh/server.pri'));
            var algo = 'RSA-SHA1';
            var data = new Buffer('test');
            var sign = crypto.createSign(algo);
            sign.update(data);
            var sig = sign.sign(key.privateOrig, 'binary');
            var result = yield authenticator.checkSSHAuthorization(null, null, algo, data, sig);
            should.not.exist(result);
        });

        it('should return header if signature valid', function* () {
            var key = ssh_utils.parseKey(fs.readFileSync('./ssh/client.pri'));
            var algo = 'RSA-SHA1';
            var data = new Buffer('test');
            var sign = crypto.createSign(algo);
            sign.update(data);
            var sig = sign.sign(key.privateOrig, 'binary');
            var result = yield authenticator.checkSSHAuthorization(null, null, algo, data, sig);
            should.exist(result);
            result.should.equal('Basic ' + new Buffer('testuser:testpass').toString('base64'));
        });
    });

});