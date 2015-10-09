'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');
var parse = require('co-body');

var validate = require('jsonschema').validate;

var LfsObject = require('../model/lfs_object');

const BATCH_REQUEST_SCHEMA = require('../../schema/http-v1-batch-request-schema.json');

const BASE_URL = config.get('base_url');



var handleUploadObject = function* (req, object) {
    var lfsObject = new LfsObject({
        user: req.params.user,
        repo: req.params.repo,
        oid: object.oid,
        size: object.size
    });

    var savedObject = yield lfsObject.save();
    return {
        oid: object.oid,
        size: object.size,
        actions: {
            upload: {
                href: `${BASE_URL}/${req.params.user}/${req.params.repo}/objects/${savedObject._id}`
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
            var body = req.jsonBody;
            var operation = body.operation;

            // validate operation
            if (operation !== 'upload' && operation !== 'verify' && operation !== 'download') {
                return res.sendStatus(422);
            }

            // validate objects
            var objects = body.objects;
            var results;
            switch (operation) {
                case 'upload':
                    let yields = [];
                    _.forEach(objects, function(object) {
                        yields.push(handleUploadObject(req, object));
                    });
                    results = yield yields;
                    break
            }

            var response = {
                objects: results
            };
            res.status(200).json(response);
        } catch (err) {
            next(err);
        }

    }));
};