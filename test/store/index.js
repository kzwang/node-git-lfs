'use strict';

var config = require('config');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var expect = chai.expect;

var Store = require('../../lib/store');

const BASE_URL = config.get('base_url');

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
        var action = store.getUploadAction(TEST_USER, TEST_REPO, TEST_OID);
        action.href.should.equal(`${BASE_URL}${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');
    });

    it('should return download action', function() {
        var action = store.getDownloadAction(TEST_USER, TEST_REPO, TEST_OID);
        action.href.should.equal(`${BASE_URL}${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');
    });

    it('should return verify action', function() {
        var action = store.getVerifyAction(TEST_USER, TEST_REPO, TEST_OID);
        action.href.should.equal(`${BASE_URL}${TEST_USER}/${TEST_REPO}/objects/verify`);
        should.exist(action.expires_at);
        should.exist(action.header);
        action.header['Authorization'].should.startWith('JWT ');
    });

});