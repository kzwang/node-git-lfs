'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');
var parse = require('co-body');

var validate = require('jsonschema').validate;

var Store = require('../store');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

const BATCH_REQUEST_SCHEMA = require('../../schema/http-v1-batch-request-schema.json');

const BASE_URL = config.get('base_url');


/**
 * Process upload object
 *
 * @param {Request} req, http request from Express.js
 * @param {Object} object
 * @returns {Object}
 */
var handleUploadObject = function* (req, object) {
    var user = req.params.user;
    var repo = req.params.repo;
    var oid = object.oid;

    return {
        oid: object.oid,
        size: object.size,
        actions: {
            upload: {
                href: `${BASE_URL}${user}/${repo}/objects/${oid}`
            }
        }
    }
};

var handleDownloadObject = function* (req, object) {
    var user = req.params.user;
    var repo = req.params.repo;
    var oid = object.oid;

    var result = {
        oid: object.oid,
        size: object.size
    };

    var exist = yield STORE.exist(user, repo, oid);
    if (exist) {
        result.actions = {
            download: {
                href: `${BASE_URL}${user}/${repo}/objects/${oid}`
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
            var body = req.jsonBody;
            var operation = body.operation;

            // validate operation
            if (operation !== 'upload' && operation !== 'verify' && operation !== 'download') {
                return res.sendStatus(422);
            }

            // validate objects
            var objects = body.objects;
            var results;
            var func;
            let yields = [];
            switch (operation) {
                case 'upload':
                    func = handleUploadObject;
                    break;
                case 'download':
                    func = handleDownloadObject;
                    break;
            }
            _.forEach(objects, function(object) {
                yields.push(func(req, object));
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