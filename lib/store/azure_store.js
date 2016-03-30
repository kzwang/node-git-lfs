'use strict';

var azure = require('azure-storage');

var Store = require('./');

class AzureStore extends Store {

    /**
     * Construct S3Store instance
     * @param {Object} options, optional
     */
    constructor(options) {
        super();
        this._options = options || {};

		// set environment variables
		if (this._options.azure_storage_account) {
			process.env['AZURE_STORAGE_ACCOUNT'] = this._options.azure_storage_account; 
		}
		if (this._options.azure_storage_access_key) {
			process.env['AZURE_STORAGE_ACCESS_KEY'] = this._options.azure_storage_access_key; 
		}

		var retryOperations = new azure.ExponentialRetryPolicyFilter();
        this._blobService = azure.createBlobService().withFilter(retryOperations);
		
		 var self = this;
		this._blobService.createContainerIfNotExists(AzureStore._getContainerName(this._options.azure_storage_container), { 
			publicAccessLevel: 'blob'
		}, function(error, result, response) {
			if (!error) {
				if (result) {
					console.log('Container ' + AzureStore._getContainerName(self._options.azure_storage_container) + ' created');
				} else {
					console.log('Container ' + AzureStore._getContainerName(self._options.azure_storage_container) + ' already there');
				}
  		    } else {
  		    	console.error('Container ' + AzureStore._getContainerName(self._options.azure_storage_container) + ' could not be created');
  		    }
		});
    }


    put(user, repo, oid, stream) {
        var self = this;
        return new Promise(function(resolve, reject) {
			stream.pipe(self._blobService.createWriteStreamToBlockBlob(
				AzureStore._getContainerName(self._options.azure_storage_container),
				AzureStore._getKey(user, repo, oid),
				function(err, result, response){
					if(err){
				    	console.log("Couldn't upload stream");
				        console.error(err);
						return reject(err);
				    } else {
						resolve(response);
					}
				}
			));
        });
    }


    get(user, repo, oid) {
        var self = this;
        return new Promise(function(resolve) {
			resolve(self._blobService.createReadStream(AzureStore._getContainerName(self._options.azure_storage_container), AzureStore._getKey(user, repo, oid)));
        });
    }


    getSize(user, repo, oid) {
        var self = this;
        return new Promise(function(resolve, reject) {
			self._blobService.getBlobProperties(
				AzureStore._getContainerName(self._options.azure_storage_container),
				AzureStore._getKey(user, repo, oid),
				function(err, result, response){
					if(err){
						console.error("Couldn't fetch properties for blob %s", AzureStore._getKey(user, repo, oid));
						console.error(err);
						return reject(err);
				    } else if (!response.isSuccessful) {
        				console.error("Blob %s wasn't found container %s", AzureStore._getContainerName(self._options.azure_storage_container), AzureStore._getKey(user, repo, oid));
						return reject(-1);
					}
					resolve(Number(result.contentLength));
				}
			);
        });
    }


    static _getKey(user, repo, oid) {
        return `${user}/${repo}/${oid}`;
    }
	
    static _getContainerName(azure_storage_container) {
        return azure_storage_container || 'git-lfs';
    }

}



module.exports = AzureStore;