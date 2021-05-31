#!/usr/bin/env node
const http = require('http');

console.log('Starting application webapp35 (port: 3035)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from webapp35!', 'utf-8');
}).listen(3035);