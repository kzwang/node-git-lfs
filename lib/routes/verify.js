'use strict';


var config = require('config');
var wrap = require('co-express');
var parse = require('co-body');


var Store = require('../store');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

var checkJWT = require('./objects').checkJWT;



module.exports = function(app) {
    app.post('/:user/:repo/objects/verify', checkJWT('verify'), wrap(function* (req, res, next) {
        try {
            var body = yield parse.json(req);

            var oid = body.oid;
            var size = body.size;
            if (!oid || !size) {
                return res.status(422).end();
            }

            var objectSize = yield STORE.getSize(req.params.user, req.params.repo, oid);
            if (size !== objectSize) {
                return res.status(422).end();
            }

            res.status(200).end();
        } catch (err) {
            next(err);
        }

    }));
};