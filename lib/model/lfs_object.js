var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var lfsObjectSchema = new Schema({
    user: {type: String, required: true},
    repo: {type: String, required: true},
    oid: {type: String, required: true},
    size: Number
});

lfsObjectSchema.index({ user: 1, repo: 1, oid: 1 });

var LfsObject = mongoose.model("lfsObject", lfsObjectSchema);

module.exports = LfsObject;