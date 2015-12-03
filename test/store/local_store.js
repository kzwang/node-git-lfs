'use strict';

var stream = require('stream');
var fs = require('fs');
var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var LocalStore = require('../../lib/store/local_store');

describe('Local Store', function() {

    var store = new LocalStore({});

    it('should be able to put object', function (done) {
        try {
            let body = 'testbody';
            let buffer = new Buffer(body, 'utf8');
            let s = new stream.Readable();
            s.push(buffer);
            s.push(null);
            store.put('testuser', 'testrepo', 'testid', s);

            fs.stat(LocalStore._getFile('testuser', 'testrepo', 'testid'), function(err, stat) {
                if (err) return done(err);

                stat.size.should.equal(buffer.length);
                done();
            });
        } catch (err) {
            done(err);
        }
    });

    it('should be able to get object', function (done) {
        let body = 'testbody';
        let s = new stream.Readable();
        s.push(body);
        s.push(null);

        store.get('testuser', 'testrepo', 'testid').then(function (s) {
            s.setEncoding('utf8');
            let string = '';
            s.on('data', function (chunk) {
                string += chunk;
            });

            s.on('end', function () {
                string.should.equal(body);

                done();
            });
        });
    });

    describe('getSize', function () {
        it('should return object size', function (done) {
            let body = 'testbody';
            let s = new stream.Readable();
            s.push(body);
            s.push(null);

            store.getSize('testuser', 'testrepo', 'testid')
                .then(function (size) {
                    size.should.equal(body.length);
                    done();
                })
                .catch(function() {
                    done();
                });
        });

        it('should return -1 for non exist object', function (done) {
            store.getSize('testuser', 'testrepo', 'testid')
                .then(function (size) {
                    size.should.equal(-1);
                    done();
                })
                .catch(done);
        });
    });

    describe('exist', function () {
        it('should return false for non exist object', function* () {
            var exist = yield store.exist('testuser', 'testrepo', 'not_exist');
            exist.should.equal(false);
        });

        it('should return true for exist object', function (done) {
            let body = 'testbody';
            let buffer = new Buffer(body, 'utf8');
            let s = new stream.Readable();
            s.push(buffer);
            s.push(null);

            let filePath = LocalStore._getFile('testuser', 'testrepo', 'testid');
            let file = fs.createWriteStream(filePath);
            file.write(buffer);
            file.close();

            store.exist('testuser', 'testrepo', 'testid')
                .then(function (exist) {
                    exist.should.equal(true);
                    done();
                })
                .catch(function () {
                    fs.unlink(filePath);
                    done();
                });
        });
    });


});