'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');
var parse = require('co-body');

var validate = require('jsonschema').validate;

var Store = require('../store');
var Authenticator = require('../authenticator');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

const AUTHENTICATOR = Authenticator.getAuthenticator(config.get('authenticator.type'), config.get('authenticator.options'));

const BATCH_REQUEST_SCHEMA = require('../../schema/http-v1-batch-request-schema.json');

const BASE_URL = config.get('base_url');

const PRIVATE_LFS = config.get('private');


/**
 * Process upload object
 *
 * @param {String} user
 * @param {String} repo
 * @param {Object} object
 * @returns {Object}
 */
var handleUploadObject = function* (user, repo, object) {
    var oid = object.oid;

    return {
        oid: object.oid,
        size: object.size,
        actions: {
            upload: {
                href: `${BASE_URL}${user}/${repo}/objects/${oid}`,
                header: {
                    "Authorization": "TODO"
                }
            },
            verify: {
                href: `${BASE_URL}${user}/${repo}/objects/verify`,
                header: {
                    "Authorization": "TODO"
                }
            }
        }
    }
};

/**
 * Process download object
 *
 * @param {String} user
 * @param {String} repo
 * @param {Object} object
 * @returns {Object}
 */
var handleDownloadObject = function* (user, repo, object) {
    var oid = object.oid;

    var result = {
        oid: object.oid,
        size: object.size
    };

    var exist = yield STORE.exist(user, repo, oid);
    if (exist) {
        result.actions = {
            download: {
                href: `${BASE_URL}${user}/${repo}/objects/${oid}`,
                header: {
                    "Authorization": "TODO"
                }
            }
        }
    } else {
        result.error = {
            "code": 404,
            "message": "Object does not exist on the server"
        }
    }
    return result;
};

/**
 * Process verify object
 *
 * @param {String} user
 * @param {String} repo
 * @param {Object} object
 * @returns {Object}
 */
var handleVerifyObject = function* (user, repo, object) {
    var oid = object.oid;

    return {
        oid: object.oid,
        size: object.size,
        actions: {
            verify: {
                href: `${BASE_URL}${user}/${repo}/objects/verify`,
                header: {
                    "Authorization": "TODO"
                }
            }
        }
    }
};

module.exports = function(app) {
    app.post('/:user/:repo/objects/batch', wrap(function* (req, res, next) {
        // validate request body according to JSON Schema
        try {
            var body = yield parse.json(req);
            req.jsonBody = body;
            var valid = validate(body, BATCH_REQUEST_SCHEMA).valid;
            if (!valid) {
                let err = new Error();
                err.status = 422;
                next(err);
            } else {
                next();
            }
        } catch (err) {
            next(err);
        }
    }), wrap(function* (req, res, next) {
        try {
            res.set('Content-Type', 'application/vnd.git-lfs+json');

            var body = req.jsonBody;
            var operation = body.operation;

            // validate operation
            if (operation !== 'upload' && operation !== 'verify' && operation !== 'download') {
                return res.status(422).end();
            }

            let user = req.params.user;
            let repo = req.params.repo;
            let authorization = req.header('Authorization');

            if (PRIVATE_LFS && !authorization) {
                res.set('LFS-Authenticate', 'Basic realm="Git LFS"');
                return res.status(401).end();
            }


            let canRead = yield AUTHENTICATOR.canRead(user, repo, authorization);

            if (!canRead) {
                if (authorization) {
                    return res.status(403).end();
                } else {
                    res.set('LFS-Authenticate', 'Basic realm="Git LFS"');
                    return res.status(401).end();
                }

            }

            // validate objects
            let objects = body.objects;
            let results;
            let func;
            let yields = [];

            switch (operation) {
                case 'upload':
                    func = handleUploadObject;
                    // can Write only need to be checked for upload operation
                    let canWrite = yield AUTHENTICATOR.canWrite(user, repo, authorization);
                    if (!canWrite && authorization) {
                        return res.status(403).end();
                    }
                    break;
                case 'download':
                    func = handleDownloadObject;
                    break;
                case 'verify':
                    func = handleVerifyObject;
                    break;
            }
            _.forEach(objects, function(object) {
                yields.push(func(user, repo, object));
            });

            results = yield yields;

            var response = {
                objects: results
            };
            res.status(200).json(response);
        } catch (err) {
            next(err);
        }

    }));
};