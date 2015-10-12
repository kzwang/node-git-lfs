'use strict';

var _ = require('lodash');
var config = require('config');
var wrap = require('co-express');
var jwt = require('jsonwebtoken');

var Store = require('../store');

const BASE_URL = config.get('base_url');

const STORE = Store.getStore(config.get('store.type'), config.get('store.options'));

const JWT_CONFIG = config.get('jwt');

var checkJWT = function(action) {
    return wrap(function*(req, res, next) {
        let user = req.params.user;
        let repo = req.params.repo;
        let oid = req.params.oid;

        let authorization = req.header('Authorization');

        if (!authorization || !authorization.startsWith('JWT ')) {
            return res.status(401).end();
        }

        authorization = authorization.substring(4, authorization.length);
        try {
            var decoded = jwt.verify(authorization, JWT_CONFIG.secret, {issuer: JWT_CONFIG.issuer});
            if (decoded.action != action || decoded.user != user || decoded.repo != repo || (decoded.oid && decoded.oid != oid)) {
                return res.status(403).end();
            }
        } catch(err) {
            // Any JWT error is considered as Forbidden
            return res.status(403).end();
        }

        next();

    });
};

var exports = module.exports = function(app) {

    app.put('/:user/:repo/objects/:oid', checkJWT('upload'), wrap(function* (req, res, next) {
        var data = yield STORE.put(req.params.user, req.params.repo, req.params.oid, req);
        res.sendStatus(200);
    }));

    app.get('/:user/:repo/objects/:oid', checkJWT('download'), wrap(function* (req, res, next) {
        var size = yield STORE.getSize(req.params.user, req.params.repo, req.params.oid);
        if (size < 0) {
            return res.sendStatus(404);
        }
        res.set('Content-Length', size);
        var dataStream = yield STORE.get(req.params.user, req.params.repo, req.params.oid);
        dataStream.pipe(res);
    }));
};

exports.checkJWT = checkJWT;