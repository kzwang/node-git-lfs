#!/bin/bash
docker run --name=git-lfs -d -e DNSDOCK_IMAGE=git-lfs -w /app -v `pwd`:/app -v /data/git-lfs:/data node:4.2.1 npm start
