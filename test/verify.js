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

const BASE_URL = config.get('base_url');



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
        let body = 'testbody';

        // upload test file
        request(app)
            .put('/testuser/testrepo/objects/testid')
            .send(body)
            .end(function() {
                request(app)
                    .post('/testuser/testrepo/objects/verify')
                    .send({
                        "oid": "testid",
                        "size": body.length
                    })
                    .expect(200, done);
            });
    });

    it('should return 422 for non exist object', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/verify')
            .send({
                "oid": "non_exist",
                "size": 100
            })
            .expect(422, done);
    });

    it('should return 422 for size not match', function(done) {
        let body = 'testbody';
        // upload test file
        request(app)
            .put('/testuser/testrepo/objects/testid')
            .send(body)
            .end(function() {
                request(app)
                    .post('/testuser/testrepo/objects/verify')
                    .send({
                        "oid": "testid",
                        "size": body.length + 1
                    })
                    .expect(422, done);
            });
    });

    it('should return 422 for invalid request', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/verify')
            .send({
                "test": "test"
            })
            .expect(422, done);
    });
});