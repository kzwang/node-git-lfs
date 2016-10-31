'use strict';

var config = require('config');

var jwt = require('jsonwebtoken');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var expect = chai.expect;

var Store = require('../../lib/store');

const BASE_URL = config.get('base_url');
const PORT = process.env.PORT || parseInt(config.get('port'), 10) || 3000;

const JWT_CONFIG = config.get('jwt');

const TEST_USER = 'testUser';
const TEST_REPO = 'testRepo';
const TEST_OID= 'testoid';

describe('Abstract Store', function() {

    var store;

    beforeEach(function () {
        store = new Store();

    });


    it('should throw error for put', function() {
        expect(store.put).to.throw(Error);
    });

    it('should throw error for get', function() {
        expect(store.get).to.throw(Error);
    });

    it('should throw error for getSize', function() {
        expect(store.getSize).to.throw(Error);
    });

    it('should return upload action', function() {
        var action = store.getUploadAction(TEST_USER, TEST_REPO, TEST_OID, 0);
        action.href.should.equal(`${BASE_URL}:${PORT}/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');

        let authorization = action.header['Authorization'];
        let token = authorization.substring(4, authorization.length);
        let decoded = jwt.verify(token, JWT_CONFIG.secret, {issuer: JWT_CONFIG.issuer});
        decoded.user.should.equal(TEST_USER);
        decoded.repo.should.equal(TEST_REPO);
        decoded.oid.should.equal(TEST_OID);
        decoded.action.should.equal('upload');
        should.exist(decoded.iat);
        should.exist(decoded.exp);
    });

    it('should return download action', function() {
        var action = store.getDownloadAction(TEST_USER, TEST_REPO, TEST_OID, 0);
        action.href.should.equal(`${BASE_URL}:${PORT}/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');

        let authorization = action.header['Authorization'];
        let token = authorization.substring(4, authorization.length);
        let decoded = jwt.verify(token, JWT_CONFIG.secret, {issuer: JWT_CONFIG.issuer});
        decoded.user.should.equal(TEST_USER);
        decoded.repo.should.equal(TEST_REPO);
        decoded.oid.should.equal(TEST_OID);
        decoded.action.should.equal('download');
        should.exist(decoded.iat);
        should.exist(decoded.exp);
    });

    it('should return verify action', function() {
        var action = store.getVerifyAction(TEST_USER, TEST_REPO, TEST_OID, 0);
        action.href.should.equal(`${BASE_URL}:${PORT}/${TEST_USER}/${TEST_REPO}/objects/verify`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');

        let authorization = action.header['Authorization'];
        let token = authorization.substring(4, authorization.length);
        let decoded = jwt.verify(token, JWT_CONFIG.secret, {issuer: JWT_CONFIG.issuer});
        decoded.user.should.equal(TEST_USER);
        decoded.repo.should.equal(TEST_REPO);
        decoded.action.should.equal('verify');
        should.exist(decoded.iat);
        should.exist(decoded.exp);
        should.not.exist(decoded.oid);
    });

});