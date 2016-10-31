'use strict';

var fs = require('fs');
var path = require('path');

var Store = require('./');

class LocalStore extends Store {

    constructor(options) {
        super();
        this._options = options || {};
		console.log("local path: " + this._options.local_path);
    }

    put(user, repo, oid, stream) {
		var self = this;
        return new Promise(function (resolve, reject) {
            try {
                var file = fs.createWriteStream(LocalStore._getFile(user, repo, oid, self._options.local_path));

                stream.on('error', function (err) {
                    reject(err);
                });

                stream.on('end', function () {
                    file.close();
                    resolve();
                });

                stream.pipe(file);
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });

    }


    get(user, repo, oid) {
        var file = LocalStore._getFile(user, repo, oid, this._options.local_path);
        return new Promise(function (resolve, reject) {
            fs.stat(file, function(err, stat) {
                if (err || !stat.isFile())
                    reject();

                resolve(fs.createReadStream(file));
            });
        });
    }


    getSize(user, repo, oid) {
        var file = LocalStore._getFile(user, repo, oid, this._options.local_path);
        return new Promise(function (resolve, reject) {
            fs.stat(file, function (err, stat) {
                if (err || stat == undefined)
                    return reject();

                if(!stat.isFile())
                    return resolve(-1);

                return resolve(stat.size);
            });
        });
    }


    exist(user, repo, oid) {
        var file = LocalStore._getFile(user, repo, oid, this._options.local_path);
        return new Promise(function (resolve, reject) {
            fs.stat(file, function (err, stat) {
                if (err || stat === undefined)
                    reject();

                resolve(stat.isFile());
            });
        });
    }


    static _getKey(user, repo, oid) {
        // Base64 encode to avoid filesystem character set limitations
        // and to avoid arbitrary file read and write
        return new Buffer(`${user}/${repo}/${oid}`, 'utf8').toString('base64');
    }

    static _getFile(user, repo, oid, local_path) {
        var p = local_path || path.join(process.cwd(), 'data/');
        return path.join(p, LocalStore._getKey(user, repo, oid));
    }
}

module.exports = LocalStore;