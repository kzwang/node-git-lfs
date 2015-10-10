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



module.exports = function(app) {
    app.post('/:user/:repo/objects/verify', wrap(function* (req, res, next) {
        try {
            var body = yield parse.json(req);

            var oid = body.oid;
            var size = body.size;
            if (!oid || !size) {
                return res.sendStatus(422);
            }

            var objectSize = yield STORE.getSize(req.params.user, req.params.repo, oid);
            if (size !== objectSize) {
                return res.sendStatus(422);
            }

            res.sendStatus(200);
        } catch (err) {
            next(err);
        }

    }));
};