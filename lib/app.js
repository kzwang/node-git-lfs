var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');
var config = require('config');


var routeBatch = require('./routes/batch');
var routeObjects = require('./routes/objects');

mongoose.connect(config.get('db.connection'), config.get('db.options'));

var app = express();


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));


routeBatch(app);
routeObjects(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message
    });
});


module.exports = app;
