'use strict';

var config = require('config');
var jwt = require('jsonwebtoken');
var ms = require('ms');

const BASE_URL = config.get('base_url');
const LFS_OVERLAY = config.get('lfs_overlay');
const JWT_CONFIG = config.get('jwt');

/**
 * Abstract Store, should use subclass
 */
class Store {

    /**
     * Register store
     *
     * @param {String} name, name of the store
     * @param {Store} store, class of the store
     */
    static registerStore(name, store){
        this.stores[name] = store;
    }

    /**
     * Get registered store by name
     * @param {String} name
     * @param {Object} options, optional
     * @returns {Store} instance of store
     */
    static getStore(name, options) {
        return new this.stores[name](options);
    }

    /**
     * Save object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Stream} stream
     * @returns {Promise}
     */
    put(user, repo, oid, stream) {
        throw new Error('Can not use put from Store class');
    }

    /**
     * Download object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Stream>}
     */
    get(user, repo, oid) {
        throw new Error('Can not use get from Store class');
    }

    /**
     * Download object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Number>}
     */
    getSize(user, repo, oid) {
        throw new Error('Can not use getSize from Store class');
    }

    /**
     * Check object exist or not
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Boolean>}
     */
    exist(user, repo, oid) {
        return this.getSize(user, repo, oid).then(function (size) {
            return size > 0;
        });
    }

    /**
     * LFS Batch API upload action
     *
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Number} size
     * @returns upload action
     */
    getUploadAction(user, repo, oid, size) {
        return {
            href: `${this._getRepoURL(user, repo)}/objects/${oid}`,
            expires_at: Store._getJWTExpireTime(),
            header: {
                'Authorization': 'JWT ' + Store._generateJWTToken('upload', user, repo, oid)
            }
        };
    }

    /**
     * LFS Batch API download action
     *
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Number} size
     * @returns download action
     */
    getDownloadAction(user, repo, oid, size) {
        return {
            href: `${this._getRepoURL(user, repo)}/objects/${oid}`,
            expires_at: Store._getJWTExpireTime(),
            header: {
                'Authorization': 'JWT ' + Store._generateJWTToken('download', user, repo, oid)
            }
        };
    }

    /**
     * LFS Batch API verify action
     *
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Number} size
     * @returns verify action
     */
    getVerifyAction(user, repo, oid, size) {
        return {
            href: `${this._getRepoURL(user, repo)}/objects/verify`,
            expires_at: Store._getJWTExpireTime(),
            header: {
                'Authorization': 'JWT ' + Store._generateJWTToken('verify', user, repo)
            }
        };
    }

    _getRepoURL(user, repo) {
       var path = LFS_OVERLAY ? `${user}/${repo}/info/lfs` : `${user}/${repo}`;
       return `${BASE_URL}${path}`;
    }

    /**
     * Create JWT token
     *
     * @param {String} action, can be 'download', 'upload' or 'verify'
     * @param {String} user
     * @param {String} repo
     * @param {String} [oid], empty for verify request
     */
    static _generateJWTToken(action, user, repo, oid) {
        var signObject = {
            user: user,
            repo: repo,
            action: action
        };
        if (oid) {
            signObject.oid = oid;
        }
        return jwt.sign(signObject, JWT_CONFIG.secret, {
            algorithm: JWT_CONFIG.algorithm,
            expiresIn: JWT_CONFIG.expiresIn,
            issuer: JWT_CONFIG.issuer
        });
    }

    static _getJWTExpireTime() {
        return new Date(new Date().getTime() + ms(JWT_CONFIG.expiresIn)).toISOString();
    }
}

Store.stores = {};

module.exports = Store;

Store.registerStore('s3', require('./s3_store'));
Store.registerStore('s3_direct', require('./s3_direct_store'));
Store.registerStore('azure', require('./azure_store'));
Store.registerStore('grid', require('./grid_store'));
Store.registerStore('local', require('./local_store'));
