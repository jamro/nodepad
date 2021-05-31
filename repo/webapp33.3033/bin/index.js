#!/usr/bin/env node
const http = require('http');

console.log('Starting application webapp33 (port: 3033)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from webapp33!', 'utf-8');
}).listen(3033);