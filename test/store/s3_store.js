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

const TEST_AWS_ACEESS_KEY = 'test';
const TEST_AWS_SECRET_KEY = 'test';
const TEST_S3_BUCKET = 'test';
const TEST_S3_ENDPOINT = 'http://localhost:4569';


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
                    accessKeyId: TEST_AWS_ACEESS_KEY,
                    secretAccessKey: TEST_AWS_SECRET_KEY,
                    endpoint: TEST_S3_ENDPOINT,
                    s3ForcePathStyle: true
                });

                var params = {
                    Bucket: TEST_S3_BUCKET
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
                'access_key': TEST_AWS_ACEESS_KEY,
                'secret_key': TEST_AWS_SECRET_KEY,
                'endpoint': TEST_S3_ENDPOINT,
                'bucket': TEST_S3_BUCKET
            });
            let body = 'testbody';
            let s = new stream.Readable();
            s.push(body);
            s.push(null);
            yield store.put('testuser', 'testrepo', 'testid', s);

            let params= {
                Bucket: TEST_S3_BUCKET,
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

    it('should be able to get object', function(done) {
        let store = new S3Store({
            'access_key': TEST_AWS_ACEESS_KEY,
            'secret_key': TEST_AWS_SECRET_KEY,
            'endpoint': TEST_S3_ENDPOINT,
            'bucket': TEST_S3_BUCKET
        });

        let body = 'testbody';
        let s = new stream.Readable();
        s.push(body);
        s.push(null);

        let params= {
            Bucket: TEST_S3_BUCKET,
            Key: 'testuser/testrepo/testid',
            Body: s
        };
        s3_client.upload(params, function(err, data) {
            if (err) return done(err);

            let s = store.get('testuser', 'testrepo', 'testid');
            s.setEncoding('utf8');
            let string = '';
            s.on('data',function(chunk){
                string += chunk;
            });

            s.on('end',function(){
                string.should.equal(body);
                done();
            });
        });
    });


});