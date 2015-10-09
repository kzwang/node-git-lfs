'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');

var Store = require('../store');

var LfsObject = require('../model/lfs_object');


const BASE_URL = config.get('base_url');


const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

module.exports = function(app) {
    app.put('/:user/:repo/objects/:id', wrap(function* (req, res, next) {
        var data = yield STORE.put(req.params.user, req.params.repo, req.params.id, req);
        res.sendStatus(200);
    }));
};