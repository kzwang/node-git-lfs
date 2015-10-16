#!/usr/bin/env node

'use strict';

var app = require('./lib/app');
var http = require('http');
var config = require('config');
var logger = require('winston');

const PORT = parseInt(config.get('port'), 10) || 3000;
const SSH_ENABLED = config.get('ssh.enabled');

app.set('port', PORT);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);


function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error('Port ' + PORT + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error('Port ' + PORT + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    logger.info('Listening LFS on port ' + server.address().port);
}

if (SSH_ENABLED) {
    var sshServer = require('./lib/ssh_server');
    const SSH_PORT = parseInt(config.get('ssh.port'));
    const SSH_IP = config.get('ssh.ip');
    sshServer.listen(SSH_PORT, SSH_IP, function() {
        logger.info('Listening SSH on port ' + this.address().port);
    });
}
