# Node Git LFS
[![Build Status](https://travis-ci.org/kzwang/node-git-lfs.svg?branch=master)](https://travis-ci.org/kzwang/node-git-lfs)
[![Coverage Status](https://coveralls.io/repos/kzwang/node-git-lfs/badge.svg?branch=master&service=github)](https://coveralls.io/github/kzwang/node-git-lfs?branch=master)
[![Code Climate](https://codeclimate.com/github/kzwang/node-git-lfs/badges/gpa.svg)](https://codeclimate.com/github/kzwang/node-git-lfs)

A NodeJS implementation of [Git LFS](https://git-lfs.github.com/) Server.

## Installation
```shell
npm install node-git-lfs
```

## Configuration
All configurations can be done via environment variable or configuration file

#### Environment Variables

 - `LFS_BASE_URL` - URL of the LFS server - **required**
 - `LFS_PORT` - HTTP portal of the LFS server, default to `3000` - **required**
 - `LFS_STORE_TYPE` - Object store type, can be either `s3` (for AWS S3) or `grid` (for MongoDB GridFS), default to `s3`  - **required**
 - `LFS_AUTHENTICATOR_TYPE` - Authenticator type, can be `basic` (for basic username and password), `none` (for no authentication), default to `none` - **required**

If **storage type** is `s3`:

 - `AWS_ACCESS_KEY` - AWS access key - **required**
 - `AWS_SECRET_KEY` - AWS secret key - **required**
 - `LFS_STORE_S3_BUCKET` - AWS S3 bucket - **required**
 - `LFS_STORE_S3_ENDPOINT` - AWS S3 endpoint, normally this will be set by region
 - `LFS_STORE_S3_REGION` - AWS S3 region

If **storage type** is `grid`:

 - `LFS_STORE_GRID_CONNECTION` - MongoDB connection URL - **required**

If **authenticator type** is `basic`:

  - `LFS_AUTHENTICATOR_USERNAME` - Username - **required**
  - `LFS_AUTHENTICATOR_PASSWORD` - Password - **required**
  - `LFS_AUTHENTICATOR_CLIENT_PUBLIC_KEY` - Location of the client's public key


##### SSH Environment Variables

  - `LFS_SSH_ENABLED` - Enable SSH server, default to `true`
  - `LFS_SSH_PORT` - SSH server port, default to `2222`
  - `LFS_SSH_IP` - SSH server bind IP, default to `0.0.0.0`
  - `LFS_SSH_PUBLIC_KEY` - SSH server public key
  - `LFS_SSH_PRIVATE_KEY` - SSH server private key