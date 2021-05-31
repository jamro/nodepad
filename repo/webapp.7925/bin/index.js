#!/usr/bin/env node
const http = require('http');

console.log('Starting application webapp (port: 7925)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from webapp!', 'utf-8');
}).listen(7925);