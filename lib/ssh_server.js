var fs = require('fs');
var config = require('config');
var ssh2 = require('ssh2');
var logger = require('winston');


var Authenticator = require('./authenticator');

const AUTHENTICATOR = Authenticator.getAuthenticator(config.get('authenticator.type'), config.get('authenticator.options'));

const BASE_URL = config.get('base_url');

module.exports = new ssh2.Server({
    privateKey: fs.readFileSync(config.get('ssh.key.private'))
	//,passphrase: config.get('ssh.key.privatepassphrase')
}, function(client) {
    logger.info('SSH Client connected');
    client.on('authentication', function(ctx) {
        if (ctx.username != 'git') {
			logger.info('SSH Client username != git');
            return ctx.reject();
        }
        if (ctx.method === 'publickey') {
            if (ctx.signature) {
                AUTHENTICATOR.checkSSHAuthorization(ctx.key.algo, ctx.key.data, ctx.sigAlgo, ctx.blob, ctx.signature)
                    .then(function(authorization) {
                        if (authorization) {
                            client.user = {
                                username: ctx.username,
                                authorization: authorization
                            };
                            ctx.accept();
                        } else {
							logger.err('SSH Client authorization failed');
                            ctx.reject();
                        }
                    })
                    .catch(function(err) {
						logger.err('SSH Client checkSSHAuthorization error ' + err);
                        ctx.reject();
                    });
            } else {
				logger.info('No signature present');
                // if no signature present, that means the client is just checking
                // the validity of the given public key
                ctx.accept();
            }
        } else {
			logger.warn('SSH Client method != publickey');
            ctx.reject();
        }

    }).on('ready', function() {
        logger.info('SSH Client authenticated');

        client.on('session', function(accept, reject) {
            var session = accept();
            session.once('exec', function(accept, reject, info) {
                var stream = accept();
                var sendMessage = function(message) {
                    stream.write(message);
                    stream.exit(0);
                    stream.end();
                };

                var command = info.command;
                var commands = command.split(' ');
                if (commands.length < 3 || commands[0].toLowerCase() != 'git-lfs-authenticate' || (commands[2] != 'download' && commands[2] != 'upload')) {
                    return sendMessage('Unknown command: ' + command);
                }


                var res = {
                    header: {
                        Authorization: client.user.authorization
                    },
                    href: `${BASE_URL}${commands[1]}`

                };
                sendMessage(JSON.stringify(res));

            });
        });
    }).on('end', function() {
        logger.info('SSH Client disconnected');
    });
});