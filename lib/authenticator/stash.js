'use strict';
var path = require('path');
var fetch = require('node-fetch');
var logger = require('winston');

var Authenticator = require('.');
var BasicAuthenticator = require('./basic');

const LEVEL_READ = 'REPO_READ';
const LEVEL_WRITE = 'REPO_WRITE';

class StashAuthenticator extends Authenticator {
  constructor(options) {
    super();
    this._options = options || {};
  }

  canRead(user, repo, authorization) {
    return this._checkWithStash(user, repo, LEVEL_READ, authorization);
  }

  canWrite(user, repo, authorization) {
    return this._checkWithStash(user, repo, LEVEL_WRITE, authorization);
  }

  // TODO: Check SSH public keys with Stash
  checkSSHAuthorization() {
    return Promise.resolve();
  }

  _checkWithStash(user, repo, level, authorization) {
    if (authorization.split(' ')[0].toLowerCase() !== 'basic') {
      return Promise.resolve(false);
    }
    repo = repo.replace(/\.git$/, '');

    const url =
      this._options.url +
      'rest/api/1.0/repos?name=' + encodeURIComponent(repo) +
      '&projectname=' + encodeURIComponent(user) +
      '&permission=' + encodeURIComponent(level);
    return fetch(url, {
      headers: {
        'Authorization': authorization
      }
    }).then(function (resp) { return resp.json(); })
      .then(function (json) { return json.size === 1; })
      .catch(function (err) {
        logger.error('[Stash] Failed to verify user. Rejecting action', err);
        return false;
      });
  }
}

module.exports = StashAuthenticator;
