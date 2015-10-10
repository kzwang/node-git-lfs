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

    var s3_server, s3_client, store;

    beforeEach(function (done) {
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

        store = new S3Store({
            'access_key': TEST_AWS_ACEESS_KEY,
            'secret_key': TEST_AWS_SECRET_KEY,
            'endpoint': TEST_S3_ENDPOINT,
            'bucket': TEST_S3_BUCKET
        });

    });

    afterEach(function (done) {
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

            store.get('testuser', 'testrepo', 'testid').then(function(s) {
                s.setEncoding('utf8');
                let string = '';
                s.on('data',function(chunk){
                    string += chunk;
                });

                s.on('end',function(){
                    string.should.equal(body);
                    done();
                });
            })


        });
    });

    describe('getSize', function() {
        it('should return object size', function(done) {

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

                store.getSize('testuser', 'testrepo', 'testid')
                    .then(function(size) {
                        size.should.equal(body.length);
                        done();
                    })
                    .catch(done);

            });
        });

        it('should return -1 for non exist object', function(done) {

            store.getSize('testuser', 'testrepo', 'testid')
                .then(function(size) {
                    size.should.equal(-1);
                    done();
                })
                .catch(done);
        });
    });

    describe('exist', function() {
        it('should return false for non exist object', function* () {

            var exist = yield store.exist('testuser', 'testrepo', 'not_exist');
            exist.should.equal(false);

        });

        it('should return true for exist object', function (done) {
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

                store.exist('testuser', 'testrepo', 'testid')
                    .then(function(exist) {
                        exist.should.equal(true);
                        done();
                    })
                    .catch(done);

            });


        });
    });




});