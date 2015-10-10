'use strict';

var AWS = require('aws-sdk');

var Store = require('./');

class S3Store extends Store {

    /**
     * Construct S3Store instance
     * @param {Object} options, optional
     */
    constructor(options) {
        super();
        this._options = options || {};

        let s3_config = {
            accessKeyId: this._options.access_key,
            secretAccessKey: this._options.secret_key
        };

        // optional S3 endpoint
        if (this._options.endpoint) {
            s3_config.endpoint = this._options.endpoint;
            s3_config.s3ForcePathStyle = true;
        }

        // optional S3 region
        if (this._options.region) {
            s3_config.region = this._options.region;
        }

        this._s3 = new AWS.S3(s3_config);

    }

    /**
     * Upload object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Stream} stream
     * @returns {Promise}
     */
    put(user, repo, oid, stream) {
        var self = this;
        return new Promise(function(resolve, reject) {
            let params = {Bucket: self._options.bucket, Key: S3Store._getKey(user, repo, oid), Body: stream};
            self._s3.upload(params, function(err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });

    }

    /**
     * Download object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Stream}
     */
    get(user, repo, oid) {
        var params = {Bucket: this._options.bucket, Key: S3Store._getKey(user, repo, oid)};
        return this._s3.getObject(params).createReadStream();
    }

    /**
     * Get object size
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Number>}
     */
    getSize(user, repo, oid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var params = {Bucket: self._options.bucket, Key: S3Store._getKey(user, repo, oid)};
            self._s3.headObject(params, function (err, data) {
                if (err) {
                    if (err.statusCode === 404) {
                        return resolve(-1);
                    }
                    reject(err);
                }
                resolve(Number(data.ContentLength));
            })
        });
    }

    /**
     * Check object exist or not
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Boolean>}
     */
    exist(user, repo, oid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var params = {Bucket: self._options.bucket, Key: S3Store._getKey(user, repo, oid)};
            self._s3.headObject(params, function (err, data) {
                if (err) {
                    if (err.statusCode === 404) {
                        return resolve(false);
                    }
                    reject(err);
                }
                resolve(true);
            })
        });
    }

    static _getKey(user, repo, oid) {
        return `${user}/${repo}/${oid}`;
    }

}



module.exports = S3Store;