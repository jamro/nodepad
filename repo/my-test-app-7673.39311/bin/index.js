#!/usr/bin/env node
const http = require('http');

console.log('Starting application my-test-app-7673 (port: 39311)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from my-test-app-7673!', 'utf-8');
}).listen(39311);