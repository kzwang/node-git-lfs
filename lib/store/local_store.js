'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp-promise');

var Store = require('./');

class LocalStore extends Store {
  constructor(options) {
    super();
    this._options = options || {};
  }

  put(user, repo, oid, stream) {
    var filePath = this._filePath(user, repo, oid);
    return mkdirp(path.dirname(filePath)).then(function() {
      return new Promise(function(resolve, reject) {
        var out = fs.createWriteStream(filePath);
        stream.pipe(out);
        stream.on('end', function() { resolve(); });
      });
    });
  }

  get(user, repo, oid) {
    var filePath = this._filePath(user, repo, oid);
    return Promise.resolve(fs.createReadStream(filePath));
  }

  getSize(user, repo, oid) {
    var filePath = this._filePath(user, repo, oid);
    return new Promise(function(resolve, reject) {
      fs.stat(filePath, function(err, stat) {
        resolve(!err && stat ? stat.size : -1);
      });
    });
  }

  _filePath(user, repo, oid) {
    return path.join(this._options.path, user, repo, oid);
  }
}

module.exports = LocalStore;
