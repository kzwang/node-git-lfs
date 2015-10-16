'use strict';

var crypto = require('crypto');
var AWS = require('aws-sdk');
var URL = require('url');
var ms = require('ms');

var S3Store = require('./s3_store');

const AWS_EXPIRE_TIME = '15m';

class S3DirectStore extends S3Store {

    /**
     * Construct S3DirectStore instance
     * @param {Object} options, optional
     */
    constructor(options) {
        super(options);
        this._options = options || {};
    }


    getUploadAction(user, repo, oid, size) {
        var resource = this._getResource(user, repo, oid);

        var url = this._getURL(resource);

        var headers = {
            'Host': url.hostname,
            'Date': new Date().toUTCString(),
            'Content-Length': String(size),
            'Content-Type': 'application/octet-stream',
            'x-amz-content-sha256': oid
        };

        this._addAuthorizationHeader(headers, 'PUT', resource);

        return {
            href: url.href,
            expires_at: S3DirectStore._getExpireTime(),
            header: headers
        }
    }

    getDownloadAction(user, repo, oid, size) {
        var resource = this._getResource(user, repo, oid);
        var url = this._getURL(resource);

        var headers = {
            'Host': url.hostname,
            'Date': new Date().toUTCString()
        };

        this._addAuthorizationHeader(headers, 'GET', resource);

        return {
            href: url.href,
            expires_at: S3DirectStore._getExpireTime(),
            header: headers
        }

    }

    _getResource(user, repo, oid) {
        return `/${this._options.bucket}/${user}/${repo}/${oid}`;
    }

    _getEndpoint() {
        var endpoint = this._options.endpoint;
        if (endpoint) {
            return endpoint;
        }
        var region = this._options.region;
        if (!region || region.toLowerCase === 'us-east-1') {
            return 'https://s3.amazonaws.com';
        } else {
            return `https://s3-${region}.amazonaws.com`
        }

    }

    _getURL(resource) {
        var endpoint = this._getEndpoint();
        var urlStr = endpoint;
        if (!urlStr.endsWith('/')) {
            urlStr = urlStr + '/';
        }
        urlStr = urlStr + resource.substring(1, resource.length);
        return URL.parse(urlStr);
    }

    _addAuthorizationHeader(headers, method, resource){

        var stringToSign = this._getStringToSign(headers, method, resource);

        var signitureOfHeaders = this._getSignature(this._options.secret_key, stringToSign);

        headers.Authorization = 'AWS ' + this._options.access_key + ":" + signitureOfHeaders;
    };

    _getStringToSign(headers, method, canonicalizedResource){
        var parts = [];
        parts.push(method);
        parts.push(headers['Content-MD5'] || '');
        parts.push(headers['Content-Type'] || '');

        parts.push(headers.Date);

        var amzHeaders = this._getCanonicalizedAmzHeaders(headers);
        if (amzHeaders) parts.push(amzHeaders);
        parts.push(canonicalizedResource);

        return parts.join('\n');

    };

    _getCanonicalizedAmzHeaders(headers){

        var amzHeaders = [];

        AWS.util.each(headers, function (name) {
            if (name.match(/^x-amz-/i))
                amzHeaders.push(name);
        });

        amzHeaders.sort(function (a, b) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        });

        var parts = [];
        AWS.util.arrayEach.call(this, amzHeaders, function (name) {
            parts.push(name.toLowerCase() + ':' + String(headers[name]));
        });

        return parts.join('\n');
    };

    _getSignature(secretKey, stringToSign) {
        return AWS.util.crypto.hmac(secretKey, stringToSign, 'base64', 'sha1');
    }

    static _getExpireTime() {
        return new Date(new Date().getTime() + ms(AWS_EXPIRE_TIME)).toISOString();
    }

}



module.exports = S3DirectStore;