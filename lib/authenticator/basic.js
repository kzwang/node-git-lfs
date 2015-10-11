'use strict';

var _ = require('lodash');
var fs = require('fs');
var btoa = require('btoa');
var crypto = require('crypto');
var ssh_utils = require('ssh2').utils;

var Authenticator = require('./');

/**
 * RegExp for basic auth credentials
 *
 * credentials = auth-scheme 1*SP token68
 * auth-scheme = "Basic" ; case insensitive
 * token68     = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
 * @private
 */
const CREDENTIALS_REG_EXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9\-\._~\+\/]+=*) *$/;


/**
 * RegExp for basic auth user/pass
 *
 * user-pass   = userid ":" password
 * userid      = *<TEXT excluding ":">
 * password    = *TEXT
 * @private
 */
const USER_PASS_REG_EXP = /^([^:]*):(.*)$/;


class Credentials {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}

class BasicAuthenticator extends Authenticator {

    /**
     * Construct BasicAuthenticator instance
     * @param {Object} options, optional
     */
    constructor(options) {
        super();
        this._options = options || {};
        var clientPublicKeyPath = _.get(options, 'client_public_key');
        if (clientPublicKeyPath) {
            this.clientPublicKey = ssh_utils.genPublicKey(ssh_utils.parseKey(fs.readFileSync(clientPublicKeyPath)));
        }
    }

    canRead(user, repo, authorization) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var credential = BasicAuthenticator._getCredential(authorization) || {};
            resolve(self._options.username === credential.username && self._options.password === credential.password);
        });
    };

    canWrite(user, repo, authorization) {
        return this.canRead(user, repo, authorization);
    }

    checkSSHAuthorization(publicAlgo, publicData, signAlgo, blob, signature){
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!self.clientPublicKey) {
                return resolve();
            }

            var verifier = crypto.createVerify(signAlgo);
            verifier.update(blob);
            if (verifier.verify(self.clientPublicKey.publicOrig, signature, 'binary')){
                var encodedUserPass = new Buffer(self._options.username + ':' + self._options.password).toString('base64');
                return resolve(`Basic ${encodedUserPass}`);
            } else {
                return resolve();
            }

        });

    }

    static _getCredential(authorization) {
        var match = CREDENTIALS_REG_EXP.exec(authorization || '');

        if (!match) {
            return;
        }

        var userPass = USER_PASS_REG_EXP.exec(BasicAuthenticator._decodeBase64(match[1]));

        if (!userPass) {
            return
        }

        return new Credentials(userPass[1], userPass[2])
    }

    static _decodeBase64(str) {
        return new Buffer(str, 'base64').toString()
    }

}

module.exports = BasicAuthenticator;