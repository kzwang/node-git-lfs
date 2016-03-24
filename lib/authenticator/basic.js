'use strict';

var _ = require('lodash');
var fs = require('fs');
var crypto = require('crypto');
var ssh_utils = require('ssh2').utils;
var path = require('path');

var Authenticator = require('./');
var clientPublicKeys = {};
/**
 * RegExp for basic auth credentials
 *
 * credentials = auth-scheme 1*SP token68
 * auth-scheme = "Basic" ; case insensitive
 * token68     = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
 * @private
 */
const CREDENTIALS_REG_EXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9\-\._~\+\/]+=*) *$/;


/**
 * RegExp for basic auth user/pass
 *
 * user-pass   = userid ":" password
 * userid      = *<TEXT excluding ":">
 * password    = *TEXT
 * @private
 */
const USER_PASS_REG_EXP = /^([^:]*):(.*)$/;


class Credentials {
	constructor(username, password) {
		this.username = username;
		this.password = password;
	}
}

class BasicAuthenticator extends Authenticator {

	/**
	 * Construct BasicAuthenticator instance
	 * @param {Object} options, optional
	 */
	constructor(options) {
		super();
		this._options = options || {};
		this._clientPublicKeys = {};
		var clientPublicKeyPathFile = _.get(options, 'client_public_key');
		if (clientPublicKeyPathFile) {
			this._clientPublicKeys[path.basename(clientPublicKeyPathFile, path.extname(clientPublicKeyPathFile))] = ssh_utils.genPublicKey(ssh_utils.parseKey(fs.readFileSync(clientPublicKeyPathFile)));
		} else {
			var clientPublicKeyPath = _.get(options, 'client_public_key_path');
			var self = this;
			if (clientPublicKeyPath) {
				this.readFiles(clientPublicKeyPath, function(filename, content) {
					if (path.extname(filename) === ".pub") {
						console.log('Adding Public key ' + filename);
						self._clientPublicKeys[filename] = ssh_utils.genPublicKey(ssh_utils.parseKey(content));
					}
				}, function(error) {
					throw err;
				});
			}
		}
	}

	readFiles(dirname, onFileContent, onError) {
		fs.readdir(dirname, function(err, filenames) {
			if (err) {
				console.error('could not read')
				onError(err);
				return;
			}
			filenames.forEach(function(filename) {
				fs.readFile(dirname + filename, function(err, content) {
					if (err) {
						onError(err);
						return;
					}
					onFileContent(filename, content);
				});
			});
		});
	}

	canRead(user, repo, authorization) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var credential = BasicAuthenticator._getCredential(authorization) || {};
			resolve(self._options.username === credential.username && self._options.password === credential.password);
		});
	};

	canWrite(user, repo, authorization) {
		return this.canRead(user, repo, authorization);
	}

	checkSSHAuthorization(publicAlgo, publicData, signAlgo, blob, signature) {
		var self = this;

		return new Promise(function(resolve, reject) {
			if (!self._clientPublicKeys && Object.keys(self._clientPublicKeys).length > 0) {
				console.log('Do not have any keys!');
				return resolve();
			}

			for (var key in self._clientPublicKeys) {
				var verifier = crypto.createVerify(signAlgo);
				verifier.update(blob);
				let value = self._clientPublicKeys[key];
				if (verifier.verify(value.publicOrig, signature, 'binary')) {
					console.log('Was able to verify using key ' + key);
					var encodedUserPass = new Buffer(self._options.username + ':' + self._options.password).toString('base64');
					return resolve(`Basic ${encodedUserPass}`);
				}
			}
			// Key not found
			console.error('There are ' + Object.keys(self._clientPublicKeys).length + ' public keys present on the server, but none matches');
			return resolve();
		});

	}

	static _getCredential(authorization) {
		var match = CREDENTIALS_REG_EXP.exec(authorization || '');

		if (!match) {
			return;
		}

		var userPass = USER_PASS_REG_EXP.exec(BasicAuthenticator._decodeBase64(match[1]));

		if (!userPass) {
			return
		}

		return new Credentials(userPass[1], userPass[2])
	}

	static _decodeBase64(str) {
		return new Buffer(str, 'base64').toString()
	}

}

module.exports = BasicAuthenticator;
