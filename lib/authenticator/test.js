'use strict';

var Authenticator = require('./');

class TestAuthenticator extends Authenticator {


    constructor(options) {
        super();
    }

    canRead(user, repo, authorization) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(TestAuthenticator.CAN_READ);
        });
    };

    canWrite(user, repo, authorization) {
        return new Promise(function(resolve, reject) {
            resolve(TestAuthenticator.CAN_WRITE);
        });
    }


}

TestAuthenticator.CAN_READ = true;
TestAuthenticator.CAN_WRITE = true;


module.exports = TestAuthenticator;