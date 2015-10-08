var request = require('supertest');

var should = require('chai').should();

var app = require('../lib/app');

describe('App', function() {
    it('should return 404 for not exist endpoint', function(done) {
        request(app)
            .get('/does_not_exist')
            .expect(404, done);
    })
});