'use strict';

var config = require('config');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var S3DirectStore = require('../../lib/store/s3_direct_store');

const TEST_AWS_ACEESS_KEY = 'testAccess';
const TEST_AWS_SECRET_KEY = 'testSecret';
const TEST_S3_BUCKET = 'testBucket';
const TEST_S3_ENDPOINT = 'http://localhost:4569';

const TEST_USER = 'testUser';
const TEST_REPO = 'testRepo';
const TEST_OID= 'testoid';


describe('S3 Direct Store', function() {

    var store;

    beforeEach(function () {

        store = new S3DirectStore({
            'access_key': TEST_AWS_ACEESS_KEY,
            'secret_key': TEST_AWS_SECRET_KEY,
            'endpoint': TEST_S3_ENDPOINT,
            'bucket': TEST_S3_BUCKET
        });

    });

    describe('_getEndpoint', function() {
        it('should return custom endpoint', function() {
            let store = new S3DirectStore({
                'access_key': TEST_AWS_ACEESS_KEY,
                'secret_key': TEST_AWS_SECRET_KEY,
                'endpoint': TEST_S3_ENDPOINT,
                'bucket': TEST_S3_BUCKET
            });

            store._getEndpoint().should.equal(TEST_S3_ENDPOINT);
        });

        it('should return default endpoint', function() {
            let store = new S3DirectStore({
                'access_key': TEST_AWS_ACEESS_KEY,
                'secret_key': TEST_AWS_SECRET_KEY,
                'bucket': TEST_S3_BUCKET
            });

            store._getEndpoint().should.equal('https://s3.amazonaws.com');
        });

        it('should return endpoint with region', function() {
            var region = 'us-west-1';
            let store = new S3DirectStore({
                'access_key': TEST_AWS_ACEESS_KEY,
                'secret_key': TEST_AWS_SECRET_KEY,
                'bucket': TEST_S3_BUCKET,
                'region': region
            });

            store._getEndpoint().should.equal('https://s3-us-west-1.amazonaws.com');
        });
    });

    describe('Upload Action', function() {
        it('should default storage class to STANDARD', function() {
            var length = 10;
            var action = store.getUploadAction(TEST_USER, TEST_REPO, TEST_OID, length);
            action.header['x-amz-storage-class'].should.equal('STANDARD');
        });

        it('should allow customize storage class', function() {
            let store = new S3DirectStore({
                'access_key': TEST_AWS_ACEESS_KEY,
                'secret_key': TEST_AWS_SECRET_KEY,
                'bucket': TEST_S3_BUCKET,
                "storage_class": 'STANDARD_IA'
            });
            var length = 10;
            var action = store.getUploadAction(TEST_USER, TEST_REPO, TEST_OID, length);
            action.header['x-amz-storage-class'].should.equal('STANDARD_IA');
        });

        it('should return upload action', function() {
            var length = 10;
            var action = store.getUploadAction(TEST_USER, TEST_REPO, TEST_OID, length);
            action.href.should.equal(`${TEST_S3_ENDPOINT}/${TEST_S3_BUCKET}/${TEST_USER}/${TEST_REPO}/${TEST_OID}`);
            should.exist(action.header);
            should.exist(action.expires_at);
            action.header['Authorization'].should.startWith(`AWS ${TEST_AWS_ACEESS_KEY}:`);
            action.header['Host'].should.equal('localhost');
            should.exist(action.header['Date']);
            action.header['Content-Length'].should.equal(String(length));
            action.header['Content-Type'].should.equal('application/octet-stream');
            action.header['x-amz-content-sha256'].should.equal(TEST_OID);
            should.exist(action.header['x-amz-storage-class']);
        });
    });




    it('should return download action', function() {
        var action = store.getDownloadAction(TEST_USER, TEST_REPO, TEST_OID);
        action.href.should.equal(`${TEST_S3_ENDPOINT}/${TEST_S3_BUCKET}/${TEST_USER}/${TEST_REPO}/${TEST_OID}`);
        should.exist(action.header);
        should.exist(action.expires_at);
        action.header['Authorization'].should.startWith(`AWS ${TEST_AWS_ACEESS_KEY}:`);
        action.header['Host'].should.equal('localhost');
        should.exist(action.header['Date']);
    });


});