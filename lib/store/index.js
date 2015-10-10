'use strict';

class Store {

    /**
     * Register store
     *
     * @param {String} name, name of the store
     * @param {Object} store, class of the store
     */
    static registerStore(name, store){
        this.stores[name] = store
    }

    /**
     * Get registered store by name
     * @param {String} name
     * @param {Object} options, optional
     * @returns {Store} instance of store
     */
    static getStore(name, options) {
        return new this.stores[name](options);
    }

    /**
     * Save object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @param {Stream} stream
     * @returns {Promise}
     */
    put(user, repo, oid, stream) {
        throw new Error('Can not use put from Store class');
    }

    /**
     * Download object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Stream}
     */
    get(user, repo, oid) {
        throw new Error('Can not use get from Store class');
    }

    /**
     * Download object
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Number>}
     */
    getSize(user, repo, oid) {
        throw new Error('Can not use getSize from Store class');
    }

    /**
     * Check object exist or not
     * @param {String} user
     * @param {String} repo
     * @param {String} oid
     * @returns {Promise<Boolean>}
     */
    exist(user, repo, oid) {
        throw new Error('Can not use exist from Store class');
    }
}

Store.stores = {};



var exports = module.exports = Store;

Store.registerStore('s3', require('./s3_store'));