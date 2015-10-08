
var wrap = require('co-express');

module.exports = function(app) {
    app.post('/:user/:repo/objects/batch', wrap(function* (req, res, next) {
        res.sendStatus(200);
    }));
};