FROM node:latest
WORKDIR /usr/src/app

COPY ./ ./
COPY ./test/proxy-server/containers/nodepad/repo/ ./repo/
COPY ./test/proxy-server/containers/nodepad/config.js ./config.js

RUN npm install

EXPOSE 25193

CMD [ "npm", "start" ]