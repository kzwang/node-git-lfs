'use strict';

var child_process = require('child_process');
var stream = require('stream');
var config = require('config');
var AWS = require('aws-sdk');
var S3rver = require('s3rver');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var S3Store = require('../../lib/store/s3_store');


describe('S3 Store', function() {

    var s3_server, s3_client;

    before(function (done) {
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
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                    endpoint: 'http://localhost:4569',
                    s3ForcePathStyle: true
                });

                var params = {
                    Bucket: 'test'
                };

                s3_client.createBucket(params, done);
            });

    });

    after(function (done) {
        if (s3_server) {
            s3_server.close(done);
        }

    });

    it('should allow config endpoint', function() {
        let endpoint = 'http://localhost:4569';
        let store = new S3Store({
            'endpoint': endpoint
        });

        store._s3.config.endpoint.should.equal(endpoint);
    });

    it('should allow config region', function() {
        let region = 'us-west-2';
        let store = new S3Store({
            'region': region
        });

        store._s3.config.region.should.equal(region);
    });

    it('should be able to put object', function *(done) {
        try {
            let store = new S3Store({
                'access_key': 'test',
                'secret_key': 'test',
                'endpoint': 'http://localhost:4569',
                'bucket': 'test'
            });
            let body = 'testbody';
            let s = new stream.Readable();
            s.push(body);
            s.push(null);
            yield store.put('testuser', 'testrepo', 'testid', s);

            let params= {
                Bucket: 'test',
                Key: 'testuser/testrepo/testid'
            };
            s3_client.headObject(params, function(err, data) {
                if (err) return done(err);
                data.ContentLength.should.equal(String(body.length));
                done();
            });
        } catch(err) {
            done(err);
        }


    });


});