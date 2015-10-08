var request = require('supertest');

var should = require('chai').should();

var app = require('../lib/app');

describe('Batch Endpoint', function() {
    it('should not return 404', function(done) {
        request(app)
            .post('/user/repo/objects/batch')
            .end(function(err, res) {
                should.not.exist(err);
                res.status.should.not.equal(404);
                done();
            });
    })
});