'use strict';

var child_process = require('child_process');
var request = require('supertest');
var config = require('config');
var stream = require('stream');
var AWS = require('aws-sdk');
var jwt = require('jsonwebtoken');
var S3rver = require('s3rver');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var app = require('../lib/app');
var generateJWTToken = require('../lib/store')._generateJWTToken;

const JWT_CONFIG = config.get('jwt');


describe('Batch Endpoint', function() {

    var s3_server;

    beforeEach(function (done) {
        let store_type = config.get('store.type');
        if (store_type === 's3' || store_type === 's3_direct') {
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

    it('should return 422 for invalid request body', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({})
            .expect(422, done);
    });

    it('should return 422 for invalid operation', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send( {
                "operation": "invalid_operation",
                "objects": [
                    {
                        "oid": "1111111",
                        "size": 123
                    }
                ]
            })
            .expect(422, done);
    });

    it('should return valid content type header', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send( {
                "operation": "upload",
                "objects": [
                    {
                        "oid": "1111111",
                        "size": 123
                    }
                ]
            })
            .expect('Content-Type', /application\/vnd\.git-lfs\+json/)
            .expect(200, done);

    });


    it('should handle upload operation', function(done) {
        var oid = 'testid';
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({
                "operation": "upload",
                "objects": [
                    {
                        "oid": oid,
                        "size": 123
                    }
                ]
            })
            .expect(function(res) {
                should.exist(res.body.objects);
                res.body.objects.should.have.length(1);
                res.body.objects[0].oid.should.equal(oid);
                res.body.objects[0].size.should.equal(123);

                should.exist(res.body.objects[0].actions);
                should.exist(res.body.objects[0].actions.upload);
                should.exist(res.body.objects[0].actions.verify);


                should.exist(res.body.objects[0].actions.upload.header);
                should.exist(res.body.objects[0].actions.upload.header['Authorization']);
                should.exist(res.body.objects[0].actions.verify.header);
                should.exist(res.body.objects[0].actions.verify.header['Authorization']);

                should.exist(res.body.objects[0].actions.upload.expires_at);
                should.exist(res.body.objects[0].actions.verify.expires_at);

            })
            .expect(200, done);
    });

    it('should handle download non exist object', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({
                "operation": "download",
                "objects": [
                    {
                        "oid": "1111111",
                        "size": 123
                    }
                ]
            })
            .expect(function(res) {
                should.exist(res.body.objects);
                res.body.objects.should.have.length(1);
                res.body.objects[0].oid.should.equal('1111111');
                res.body.objects[0].size.should.equal(123);

                should.exist(res.body.objects[0].error);
                res.body.objects[0].error.code.should.equal(404);
            })
            .expect(200, done);
    });

    it('should handle download operation', function(done) {
        let body = 'testbody';
        // upload test file
        request(app)
            .put('/testuser/testrepo/objects/testid')
            .set('Authorization', 'JWT ' + generateJWTToken('upload', 'testuser', 'testrepo', 'testid'))
            .send(body)
            .end(function() {
                request(app)
                    .post('/testuser/testrepo/objects/batch')
                    .send({
                        "operation": "download",
                        "objects": [
                            {
                                "oid": "testid",
                                "size": body.length
                            }
                        ]
                    })
                    .expect(function(res) {
                        should.exist(res.body.objects);
                        res.body.objects.should.have.length(1);
                        res.body.objects[0].oid.should.equal('testid');
                        res.body.objects[0].size.should.equal(body.length);

                        should.exist(res.body.objects[0].actions);
                        should.exist(res.body.objects[0].actions.download);


                        should.exist(res.body.objects[0].actions.download.header);
                        should.exist(res.body.objects[0].actions.download.header['Authorization']);


                        should.exist(res.body.objects[0].actions.download.expires_at);


                    })
                    .expect(200, done);
            });

    });

    it('should handle verify operation', function(done) {
        var oid = 'testid';
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({
                "operation": "verify",
                "objects": [
                    {
                        "oid": oid,
                        "size": 123
                    }
                ]
            })
            .expect(function(res) {
                should.exist(res.body.objects);
                res.body.objects.should.have.length(1);
                res.body.objects[0].oid.should.equal(oid);
                res.body.objects[0].size.should.equal(123);

                should.exist(res.body.objects[0].actions);
                should.exist(res.body.objects[0].actions.verify);

                should.exist(res.body.objects[0].actions.verify.header);
                should.exist(res.body.objects[0].actions.verify.header['Authorization']);

                should.exist(res.body.objects[0].actions.verify.expires_at);

            })
            .expect(200, done);
    });

    describe('Authentication', function() {

        var TestAuthenticator = require('./../lib/authenticator/test');

        afterEach(function() {
            TestAuthenticator.CAN_READ = true;
            TestAuthenticator.CAN_WRITE = true;
        });

        it('should return 403 if has authorization header but cannot read', function(done) {
            TestAuthenticator.CAN_READ = false;
            request(app)
                .post('/testuser/testrepo/objects/batch')
                .set('Authorization', 'test')
                .send({
                    "operation": "verify",
                    "objects": [
                        {
                            "oid": "1111111",
                            "size": 123
                        }
                    ]
                })
                .expect(403, done);
        });

        it('should return 401 if no authorization header and cannot read', function(done) {
            TestAuthenticator.CAN_READ = false;
            request(app)
                .post('/testuser/testrepo/objects/batch')
                .send({
                    "operation": "verify",
                    "objects": [
                        {
                            "oid": "1111111",
                            "size": 123
                        }
                    ]
                })
                .expect('LFS-Authenticate', 'Basic realm="Git LFS"')
                .expect(401, done);
        });

        it('should return 403 if has authorization header but cannot write', function(done) {
            TestAuthenticator.CAN_READ = true;
            TestAuthenticator.CAN_WRITE = false;
            request(app)
                .post('/testuser/testrepo/objects/batch')
                .set('Authorization', 'test')
                .send({
                    "operation": "upload",
                    "objects": [
                        {
                            "oid": "1111111",
                            "size": 123
                        }
                    ]
                })
                .expect(403, done);
        });
    });
});