'use strict';

var child_process = require('child_process');
var request = require('supertest');
var config = require('config');
var stream = require('stream');
var AWS = require('aws-sdk');
var S3rver = require('s3rver');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var app = require('../lib/app');
var generateJWTToken = require('../lib/store')._generateJWTToken;

const BASE_URL = config.get('base_url');


const TEST_USER = "testuser";
const TEST_REPO = "testrepo";
const TEST_OID = "testoid";
const TEST_BODY = "testBody";

describe('Verify Endpoint', function() {

    var s3_server, s3_client;

    beforeEach(function (done) {
        let store_type = config.get('store.type');
        if (store_type === 's3') {
            // cleanup s3 folder
            child_process.execSync('rm -rf s3 && mkdir -p s3', {
                cwd: '/tmp'
            });

            // setup mock s3 server
            s3_server = new S3rver({
                port: 4569,
                hostname: 'localhost',
                silent: false,
                directory: '/tmp/s3'
            }).run(function (err, host, port) {
                    if(err) {
                        return done(err);
                    }

                    s3_client = new AWS.S3({
                        accessKeyId: config.get('store.options.access_key'),
                        secretAccessKey: config.get('store.options.secret_key'),
                        endpoint: config.get('store.options.endpoint'),
                        s3ForcePathStyle: true
                    });

                    var params = {
                        Bucket: config.get('store.options.bucket')
                    };

                    s3_client.createBucket(params, done);
                });
        } else {
            done();
        }

    });

    afterEach(function (done) {
        if (s3_server) {
            s3_server.close(done);
        } else {
            done();
        }

    });

    it('should return 200 for valid object', function(done) {
        // upload test file
        request(app)
            .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
            .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO, TEST_OID))
            .send(TEST_BODY)
            .end(function() {
                request(app)
                    .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
                    .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER, TEST_REPO))
                    .send({
                        "oid": TEST_OID,
                        "size": TEST_BODY.length
                    })
                    .expect(200, done);
            });
    });

    it('should return 422 for non exist object', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER, TEST_REPO))
            .send({
                "oid": "non_exist",
                "size": 100
            })
            .expect(422, done);
    });

    it('should return 422 for size not match', function(done) {
        // upload test file
        request(app)
            .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
            .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO, TEST_OID))
            .send(TEST_BODY)
            .end(function() {
                request(app)
                    .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
                    .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER, TEST_REPO))
                    .send({
                        "oid": TEST_OID,
                        "size": TEST_BODY.length + 1
                    })
                    .expect(422, done);
            });
    });

    it('should return 422 for invalid request', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER, TEST_REPO))
            .send({
                "test": "test"
            })
            .expect(422, done);
    });


    it('should return 401 if not Authorization header', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(401, done);
    });

    it('should return 401 if Authorization header not start with JWT', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'Basic test')
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(401, done);
    });

    it('should return 403 if user in token not correct', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER + "1", TEST_REPO))
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(403, done);
    });

    it('should return 403 if repo in token not correct', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT ' + generateJWTToken('verify', TEST_USER, TEST_REPO + "1"))
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(403, done);
    });


    it('should return 403 if action in token not correct', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT ' + generateJWTToken('verify1', TEST_USER, TEST_REPO))
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(403, done);
    });

    it('should return 403 if invalid JWT token', function(done) {
        request(app)
            .post(`/${TEST_USER}/${TEST_REPO}/objects/verify`)
            .set('Authorization', 'JWT test')
            .send({
                "oid": TEST_OID,
                "size": TEST_BODY.length
            })
            .expect(403, done);
    });
});