#!/usr/bin/env node
const http = require('http');

console.log('Starting application webapp34 (port: 3034)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from webapp34!', 'utf-8');
}).listen(3034);