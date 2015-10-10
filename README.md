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
 - `LFS_STORE_TYPE` - Object store type, can be either `s3` (for AWS S3) or `grid` (for MongoDB GridFS), default to `s3`  - **required**

If storage type is `s3`:

 - `AWS_ACCESS_KEY` - AWS access key - **required**
 - `AWS_SECRET_KEY` - AWS secret key - **required**
 - `LFS_STORE_S3_BUCKET` - AWS S3 bucket - **required**
 - `LFS_STORE_S3_ENDPOINT` - AWS S3 endpoint, normally this will be set by region
 - `LFS_STORE_S3_REGION` - AWS S3 region

If storage type is `grid`:

 - `LFS_STORE_GRID_CONNECTION` - MongoDB connection URL - **required**