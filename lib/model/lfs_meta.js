var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var lfsMetaSchema = new Schema({
    user: {type: String, required: true},
    repo: {type: String, required: true},
    oid: {type: String, required: true},
    size: Number
});

lfsMetaSchema.index({ user: 1, repo: 1, oid: 1 }, {unique: true});

/**
 * Save LFS metadata
 * @param {String} user
 * @param {String} repo
 * @param {String} oid
 * @param {Object} meta
 * @returns {Promise}
 */
lfsMetaSchema.statics.saveMeta = function(user, repo, oid, meta) {
    var query = {
        user: user,
        repo: repo,
        oid: oid
    };

    var options = {
        'new': true,
        'upsert': true
    };

    meta.user = user;
    meta.repo = repo;
    meta.oid = oid;
    return LfsMeta.findOneAndUpdate(query, meta, options).exec();
};

/**
 * Find LFS metadata by user, repo and oid
 * @param {String} user
 * @param {String} repo
 * @param {String} oid
 * @returns {Promise}
 */
lfsMetaSchema.statics.getMeta = function(user, repo, oid) {
    return LfsMeta.findOne({
        user: user,
        repo: repo,
        oid: oid
    });
};


var LfsMeta = mongoose.model("lfsObject", lfsMetaSchema);

module.exports = LfsMeta;