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

const BASE_URL = config.get('base_url');



describe('Objects Endpoint', function() {

    var s3_server;

    before(function (done) {
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

                    var s3 = new AWS.S3({
                        accessKeyId: 'test',
                        secretAccessKey: 'test',
                        endpoint: 'http://localhost:4569',
                        s3ForcePathStyle: true
                    });

                    var params = {
                        Bucket: config.get('store.options.bucket')
                    };

                    s3.createBucket(params, done);
                });
        }

    });

    after(function (done) {
        if (s3_server) {
            s3_server.close(done);
        }

    });

    it('should return 200 for put object', function(done) {
        request(app)
            .put('/testuser/testrepo/objects/test')
            .send('testObject')
            .expect(200, done);
    });
});