#!/usr/bin/env node
const http = require('http');

console.log('Starting application webapp (port: 3001)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from webapp!', 'utf-8');
}).listen(3001);