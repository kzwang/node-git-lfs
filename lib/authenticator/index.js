'use strict';

/**
 * Abstract Authenticator, should use subclass
 */
class Authenticator {

    /**
     * Register authenticator
     *
     * @param {String} name, name of the authenticator
     * @param {Authenticator} authenticator, class of the Authenticator
     */
    static registerAuthenticator(name, authenticator){
        this.authenticators[name] = authenticator
    }

    /**
     * Get registered authenticator by name
     * @param {String} name
     * @param {Object} options, optional
     * @returns {Authenticator} instance of authenticator
     */
    static getAuthenticator(name, options) {
        return new this.authenticators[name](options);
    }

    /**
     * Check request has read access or not
     * @param {String} user
     * @param {String} repo
     * @param {String} authorization, Authorization header
     * @returns {Promise<Boolean>}
     */
    canRead(user, repo, authorization) {

    };

    /**
     * Check request has read access or not
     * @param {String} user
     * @param {String} repo
     * @param {String} authorization, Authorization header
     * @returns {Promise<Boolean>}
     */
    canWrite(user, repo, authorization) {

    }

    /**
     * Check ssh authorization and return HTTP Authorization header if success
     * @param {String} publicAlgo, public key algorithm
     * @param {Buffer} publicData, public key data
     * @param {String} signAlgo, signature algorithm
     * @param {Buffer} blob
     * @param {Buffer} signature
     * @returns {Promise<String>}
     */
    checkSSHAuthorization(publicAlgo, publicData, signAlgo, blob, signature){

    }

}

Authenticator.authenticators = {};

var exports = module.exports = Authenticator;

Authenticator.registerAuthenticator('basic', require('./basic'));
Authenticator.registerAuthenticator('none', require('./none'));
Authenticator.registerAuthenticator('test', require('./test'));