'use strict';

var co = require('co');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient,
    MongoGridStore = mongodb.GridStore,
    ObjectID = mongodb.ObjectID;


var Store = require('./');



class GridStore extends Store {

    /**
     * Construct GridStore instance
     * @param {Object} options, optional
     */
    constructor(options) {
        super();
        this._options = options || {};
    }


    put(user, repo, oid, stream) {
        var self = this;
        return new Promise(function(resolve, reject) {
            co(function*(){
                try {
                    var db = yield self._getConnection();

                    var gs = new MongoGridStore(db, GridStore._getKey(user, repo, oid), "w");

                    yield gs.open();
                    stream.on('data', co.wrap(function *(chunk) {
                        yield gs.write(chunk);
                    }));

                    stream.on('error', function(err) {
                        reject(err);
                    });


                    stream.on('end', co.wrap(function* () {
                        yield gs.close();
                        resolve();
                    }));
                } catch(err) {
                    reject(err);
                }

            });
        });

    }


    get(user, repo, oid) {
        var self = this;
        return co(function*(){
            var db = yield self._getConnection();
            var gs = new MongoGridStore(db, GridStore._getKey(user, repo, oid), "r");
            yield gs.open();
            return gs.stream();
        });
    }


    getSize(user, repo, oid) {
        var self = this;
        return co(function*() {
            var db = yield self._getConnection();
            var object = yield db.collection('fs.files').find({filename: GridStore._getKey(user, repo, oid)}).limit(1).next();
            if (!object) {
                return -1;
            }
            return object.length;
        });
    }


    static _getKey(user, repo, oid) {
        return `${user}/${repo}/${oid}`;
    }

    *_getConnection() {
        var self = this;
        if (!this._db) {
            this._db = yield MongoClient.connect(self._options.grid_connection);
            try {
                yield this._db.collection('fs.files').createIndex({filename: 1}, {unique: true, background: true});
            } catch(err){

            }

            this._db.on('close', function() {
                self._db = null;
            })
        }
        return this._db;

    }


}

module.exports = GridStore;