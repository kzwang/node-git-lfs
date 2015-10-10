'use strict';

var stream = require('stream');
var config = require('config');

var MongoClient = require('mongodb').MongoClient,
    MongoGridStore = require('mongodb').GridStore,
    ObjectID = require('mongodb').ObjectID;

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var GridStore = require('../../lib/store/grid_store');



describe('Grid Store', function() {

    var store, db;

    beforeEach(function* () {
        store = new GridStore(config.get('store.options'));
        db = yield store._getConnection();
    });

    afterEach(function* () {
        yield db.dropDatabase();
    });


    it('should be able to put object', function*() {
        let body = 'testbody';
        let s = new stream.Readable();
        s.push(body);
        s.push(null);

        yield store.put('testuser', 'testrepo', 'testid', s);

        var gs = new MongoGridStore(db, 'testuser/testrepo/testid', 'r');

        yield gs.open();
        var data = yield gs.read(body.length);
        data.toString().should.equal(body);

        yield gs.close();

    });

    it('should be able to get object', function*(done) {
        try {
            let body = 'testbody';

            var gs = new MongoGridStore(db, 'testuser/testrepo/testid', 'w');

            yield gs.open();
            yield gs.write(body);
            yield gs.close();

            var s = yield store.get('testuser', 'testrepo', 'testid');
            s.setEncoding('utf8');
            let string = '';
            s.on('data',function(chunk){
                string += chunk;
            });

            s.on('end',function(){
                string.should.equal(body);
                done();
            });
        } catch(err) {
            done(err);
        }


    });


    describe('getSize', function() {
        it('should return object size', function* () {
            let body = 'testbody';

            var gs = new MongoGridStore(db, 'testuser/testrepo/testid', 'w');

            yield gs.open();
            yield gs.write(body);
            yield gs.close();

            var size = yield store.getSize('testuser', 'testrepo', 'testid');
            size.should.equal(body.length);


        });

        it('should return -1 for non exist object', function* () {
            var size = yield store.getSize('testuser', 'testrepo', 'testid');
            size.should.equal(-1);
        });
    });

    describe('exist', function() {
        it('should return false for non exist object', function* () {
            var exist = yield store.exist('testuser', 'testrepo', 'not_exist');
            exist.should.equal(false);

        });

        it('should return true for exist object', function* () {
            let body = 'testbody';

            var gs = new MongoGridStore(db, 'testuser/testrepo/testid', 'w');

            yield gs.open();
            yield gs.write(body);
            yield gs.close();

            var exist = yield store.exist('testuser', 'testrepo', 'testid');

            exist.should.equal(true);
        });
    });



});