FROM node:4.2.1

RUN apt-get update && apt-get install -y \
 git

ENV APP_DIR /data

WORKDIR ${APP_DIR}

RUN git clone --depth=1 https://github.com/kzwang/node-git-lfs.git ${APP_DIR} && \
    npm install

EXPOSE 3000 2222

ENTRYPOINT ["./git-lfs-server.js"]