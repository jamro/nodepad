#!/usr/bin/env node
const http = require('http');

console.log('Starting application nodered (port: 2283)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from nodered!', 'utf-8');
}).listen(2283);