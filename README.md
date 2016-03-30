# Node Git LFS
[![Build Status](https://travis-ci.org/kzwang/node-git-lfs.svg?branch=master)](https://travis-ci.org/kzwang/node-git-lfs)
[![Coverage Status](https://coveralls.io/repos/kzwang/node-git-lfs/badge.svg?branch=master&service=github)](https://coveralls.io/github/kzwang/node-git-lfs?branch=master)
[![Code Climate](https://codeclimate.com/github/kzwang/node-git-lfs/badges/gpa.svg)](https://codeclimate.com/github/kzwang/node-git-lfs)

A NodeJS implementation of [Git LFS](https://git-lfs.github.com/) Server.

## Installation
```shell
npm install node-git-lfs
```

## Features

  - Support [Git LFS v1 Batch API](https://github.com/github/git-lfs/blob/master/docs/api/http-v1-batch.md)
  - Support [SSH Authentication](https://github.com/github/git-lfs/tree/master/docs/api#authentication)
  - Multiple store supported - currently `AWS S3`, `Azure Storage`, `MongoDB GridFS`, `file system`
  - Multiple authentication method support - currently `basic` and `none`
  - Use [JWT](http://jwt.io) to secure `download`, `upload` and `verify` endpoints
  - Option to directly upload to and download from AWS S3
  - Use SHA256 checksum when upload directly to AWS S3

## Configuration
All configurations can be done via environment variable or configuration file

#### Environment Variables

 - `LFS_BASE_URL` - URL of the LFS server - **required**
 - `LFS_PORT` - HTTP portal of the LFS server, defaults to `3000` - **required**
 - `LFS_STORE_TYPE` - Object store type, can be either `s3` (for AWS S3), `s3_direct` (for direct upload and download from AWS S3) or `grid` (for MongoDB GridFS), defaults to `s3`  - **required**
 - `LFS_AUTHENTICATOR_TYPE` - Authenticator type, can be `basic` (for basic username and password), `none` (for no authentication), defaults to `none` - **required**
 - `LFS_JWT_ALGORITHM` - JWT signature algorithm, defaults to `HS256`
 - `LFS_JWT_SECRET` - JWT signature secret - **required**
 - `LFS_JWT_ISSUER` - Issuer of the JWT token, defaults to `node-git-lfs`
 - `LFS_JWT_EXPIRES` - JWT token expire time, defaults to `30m`

If **storage type** is `s3` or `s3_direct`:

 - `AWS_ACCESS_KEY` - AWS access key - **required**
 - `AWS_SECRET_KEY` - AWS secret key - **required**
 - `LFS_STORE_S3_BUCKET` - AWS S3 bucket - **required**
 - `LFS_STORE_S3_ENDPOINT` - AWS S3 endpoint, normally this will be set by region
 - `LFS_STORE_S3_REGION` - AWS S3 region
 - `LFS_STORE_S3_STORAGE_CLASS` - AWS S3 storage class, can be `STANDARD`, `STANDARD_IA` or `REDUCED_REDUNDANCY`, defaults to `STANDARD`

If **storage type** is `azure`:

 - `AZURE_STORAGE_ACCOUNT` - Azure storage account - **required**
 - `AZURE_STORAGE_ACCESS_KEY` - Azure access key - **required**
 - `AZURE_STORAGE_CONNECTION_STRING` - Azure connection string - **required**
 - `AZURE_STORAGE_CONTAINER` - Azure container name

If **storage type** is `grid`:

 - `LFS_STORE_GRID_CONNECTION` - MongoDB connection URL - **required**
 
If **storage type** is `local`:

 - `LFS_STORE_LOCAL_PATH` - Path to storage location - **required**

If **authenticator type** is `basic`:

  - `LFS_AUTHENTICATOR_USERNAME` - Username - **required**
  - `LFS_AUTHENTICATOR_PASSWORD` - Password - **required**
  - `LFS_AUTHENTICATOR_CLIENT_PUBLIC_KEY` - Location of the client's public key (this option is stronger than setting the path)
  - `LFS_AUTHENTICATOR_CLIENT_PUBLIC_KEY_PATH` - Location of the client's public key folder (e.g. './ssh/public/')


##### SSH Environment Variables

  - `LFS_SSH_ENABLED` - Enable SSH server, defaults to `true`
  - `LFS_SSH_PORT` - SSH server port, defaults to `2222`
  - `LFS_SSH_IP` - SSH server bind IP, defaults to `0.0.0.0`
  - `LFS_SSH_PUBLIC_KEY` - SSH server public key - **required** if SSH is enabled
  - `LFS_SSH_PRIVATE_KEY` - SSH server private key - **required** if SSH is enabled
  
## Usage

These are some sample files to show how it could look on your machines

#### .gitattributes

``` bash
*.psd filter=lfs diff=lfs merge=lfs -text
*.svg filter=lfs diff=lfs merge=lfs -text
```

#### .gitconfig

``` bash
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true
[lfs]
	url = "ssh://git@myserver.local:2222/user/repository"
	batch = true
[remote "origin"]
	url = git@github.org:user/repository.git
	fetch = +refs/heads/*:refs/remotes/origin/*
	remote = origin
	merge = refs/heads/master
	lfsurl = "ssh://git@myserver.local:2222/user/repository"
```

#### copy the public key to clipboard

```bash
cat ~/.ssh/id_rsa.pub | pbcopy
```

## License

This Software is released under the [Apache License](LICENSE)