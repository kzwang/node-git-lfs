'use strict';

var child_process = require('child_process');
var request = require('supertest');
var config = require('config');
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



describe('Objects Endpoint', function() {

    var s3_server;

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

                    var s3_client = new AWS.S3({
                        accessKeyId: 'test',
                        secretAccessKey: 'test',
                        endpoint: 'http://localhost:4569',
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

    describe('PUT', function() {
        it('should return 200 for put object', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO, TEST_OID))
                .send('testObject')
                .expect(200, done);
        });

        it('should return 401 if not Authorization header', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .send('testObject')
                .expect(401, done);
        });

        it('should return 401 if Authorization header not start with JWT', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'Basic test')
                .send('testObject')
                .expect(401, done);
        });

        it('should return 403 if user in token not correct', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER + "1", TEST_REPO, TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if repo in token not correct', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO + "1", TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if oid in token not correct', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO, TEST_OID + "1"))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if action in token not correct', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload1', TEST_USER, TEST_REPO, TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if invalid JWT token', function(done) {
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT test')
                .send('testObject')
                .expect(403, done);
        });
    });

    describe('GET', function() {
        it('should return 404 for get non exist object', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/not_exist`)
                .set('Authorization', 'JWT ' + generateJWTToken('download', TEST_USER, TEST_REPO, "not_exist"))
                .expect(404, done);
        });

        it('should success for get exist object', function (done) {
            let testObject = 'testObject';
            request(app)
                .put(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('upload', TEST_USER, TEST_REPO, TEST_OID))
                .send(testObject)
                .end(function(err, data) {
                    if (err) return done(err);
                    request(app)
                        .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                        .set('Authorization', 'JWT ' + generateJWTToken('download', TEST_USER, TEST_REPO, TEST_OID))
                        .expect(testObject)
                        .expect('Content-Length', String(testObject.length))
                        .expect(200, done);
                });
        });


        it('should return 401 if not Authorization header', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .send('testObject')
                .expect(401, done);
        });

        it('should return 401 if Authorization header not start with JWT', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'Basic test')
                .send('testObject')
                .expect(401, done);
        });

        it('should return 403 if user in token not correct', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('download', TEST_USER + "1", TEST_REPO, TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if repo in token not correct', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('download', TEST_USER, TEST_REPO + "1", TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if oid in token not correct', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('download', TEST_USER, TEST_REPO, TEST_OID + "1"))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if action in token not correct', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT ' + generateJWTToken('download1', TEST_USER, TEST_REPO, TEST_OID))
                .send('testObject')
                .expect(403, done);
        });

        it('should return 403 if invalid JWT token', function(done) {
            request(app)
                .get(`/${TEST_USER}/${TEST_REPO}/objects/${TEST_OID}`)
                .set('Authorization', 'JWT test')
                .send('testObject')
                .expect(403, done);
        });
    });




});