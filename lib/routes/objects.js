'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');

var Store = require('../store');

const BASE_URL = config.get('base_url');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

module.exports = function(app) {
    app.put('/:user/:repo/objects/:oid', wrap(function* (req, res, next) {
        var data = yield STORE.put(req.params.user, req.params.repo, req.params.oid, req);
        res.sendStatus(200);
    }));

    app.get('/:user/:repo/objects/:oid', wrap(function* (req, res, next) {
        var size = yield STORE.getSize(req.params.user, req.params.repo, req.params.oid);
        if (size < 0) {
            return res.sendStatus(404);
        }
        res.set('Content-Length', size);
        var dataStream = yield STORE.get(req.params.user, req.params.repo, req.params.oid);
        dataStream.pipe(res);
    }));
};