var request = require('supertest');
var config = require('config');
var mongoose = require('mongoose');

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should();

var app = require('../lib/app');

const BASE_URL = config.get('base_url');

describe('Batch Endpoint', function() {

    beforeEach(function() {
        mongoose.connection.db.dropDatabase();
    });

    it('should return 422 for invalid request body', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({})
            .expect(422, done);
    });

    it('should return 422 for invalid operation', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send( {
                "operation": "invalid_operation",
                "objects": [
                    {
                        "oid": "1111111",
                        "size": 123
                    }
                ]
            })
            .expect(422, done);
    });

    it('should handle upload operation', function(done) {
        request(app)
            .post('/testuser/testrepo/objects/batch')
            .send({
                "operation": "upload",
                "objects": [
                    {
                        "oid": "1111111",
                        "size": 123
                    }
                ]
            })
            .expect(function(res) {
                should.exist(res.body.objects);
                res.body.objects.should.have.length(1);
                res.body.objects[0].oid.should.equal('1111111');
                res.body.objects[0].size.should.equal(123);

                should.exist(res.body.objects[0].actions);
                should.exist(res.body.objects[0].actions.upload);

                res.body.objects[0].actions.upload.href.should.startWith(BASE_URL + '/testuser/testrepo/objects/' );
            })
            .expect(200, done);
    });
});