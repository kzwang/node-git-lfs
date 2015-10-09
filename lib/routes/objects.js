'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');

var Store = require('../store');

var LfsMeta = require('../model/lfs_meta');

const BASE_URL = config.get('base_url');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

module.exports = function(app) {
    app.put('/:user/:repo/objects/:oid', wrap(function* (req, res, next) {
        var data = yield STORE.put(req.params.user, req.params.repo, req.params.oid, req);
        res.sendStatus(200);
    }));

    app.get('/:user/:repo/objects/:oid', wrap(function* (req, res, next) {
        var meta = yield LfsMeta.getMeta(req.params.user, req.params.repo, req.params.oid);
        if (!meta) {
            return res.sendStatus(404);
        }
        res.set('Content-Length', meta.size);
        var dataStream = STORE.get(req.params.user, req.params.repo, req.params.oid);
        dataStream.pipe(res);
    }));
};