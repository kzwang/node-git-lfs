'use strict';

var config = require('config');
var fs = require('fs');
var Client = require('ssh2').Client;

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var sshServer = require('../lib/ssh_server');

var TestAuthenticator = require('./../lib/authenticator/test');

const BASE_URL = config.get('base_url');

const SSH_PORT = config.get('ssh.port');

const SSH_IP = config.get('ssh.ip');
sshServer.listen(SSH_PORT, SSH_IP, function() {
    console.log('Listening on port ' + this.address().port);
});

describe('SSH Server', function() {
    it('should reject if username is not git', function(done) {
        var conn = new Client();
        conn.on('error', function(err) {
            err.message.should.equal('All configured authentication methods failed');
            done();
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'invalid'
        });
    });

    it('should reject if not using publickey authentication', function(done) {
        var conn = new Client();
        conn.on('error', function(err) {
            err.message.should.equal('All configured authentication methods failed');
            done();
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            password: 'password'
        });
    });

    it('should reject if not valid publickey', function(done) {
        TestAuthenticator.SSH_VALID = false;
        var conn = new Client();
        conn.on('error', function(err) {
            err.message.should.equal('All configured authentication methods failed');
            done();
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            privateKey: fs.readFileSync('./ssh/client.pri')
        });
    });

    it('should accept if valid publickey', function(done) {
        TestAuthenticator.SSH_VALID = true;
        var conn = new Client();
        conn.on('ready', function(err) {
            done();
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            privateKey: fs.readFileSync('./ssh/client.pri')
        });
    });

    it('should return auth header if success', function(done) {
        TestAuthenticator.SSH_VALID = true;
        var conn = new Client();
        conn.on('ready', function(err) {
            conn.exec('git-lfs-authenticate user/repo.git download', function(err, stream) {
                if (err) return done(err);
                var result;
                stream.on('close', function(code, signal) {
                    conn.end();
                }).on('data', function(data) {
                    let resultObject = JSON.parse(data);
                    should.exist(resultObject.header);
                    should.exist(resultObject.header['Authorization']);
                    should.exist(resultObject.href);
                    resultObject.href.should.equal(`${BASE_URL}user/repo.git`);
                    done();
                });
            });
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            privateKey: fs.readFileSync('./ssh/client.pri')
        });
    });

    it('should return error if not git-lfs-authenticate command', function(done) {
        TestAuthenticator.SSH_VALID = true;
        var conn = new Client();
        conn.on('ready', function(err) {
            conn.exec('test', function(err, stream) {
                if (err) return done(err);
                var result;
                stream.on('close', function(code, signal) {
                    conn.end();
                }).on('data', function(data) {
                    data.should.startWith('Unknown command');
                    done();
                });
            });
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            privateKey: fs.readFileSync('./ssh/client.pri')
        });
    });

    it('should return error if invalid git-lfs-authenticate command', function(done) {
        TestAuthenticator.SSH_VALID = true;
        var conn = new Client();
        conn.on('ready', function(err) {
            conn.exec('git-lfs-authenticate user/repo.git test', function(err, stream) {
                if (err) return done(err);
                var result;
                stream.on('close', function(code, signal) {
                    conn.end();
                }).on('data', function(data) {
                    data.should.startWith('Unknown command');
                    done();
                });
            });
        }).connect({
            host: '127.0.0.1',
            port: SSH_PORT,
            username: 'git',
            privateKey: fs.readFileSync('./ssh/client.pri')
        });
    });
});