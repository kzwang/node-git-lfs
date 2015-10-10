'use strict';

var Authenticator = require('./');


class NoneAuthenticator extends Authenticator {

    /**
     * Construct NoneAuthenticator instance
     */
    constructor() {
        super();
    }

    canRead(user, repo, authorization) {
        return new Promise(function(resolve, reject) {
            resolve(true);
        });
    };

    canWrite(user, repo, authorization) {
        return new Promise(function(resolve, reject) {
            resolve(true);
        });
    }


}

module.exports = NoneAuthenticator;