#!/usr/bin/env node
const http = require('http');

console.log('Starting application jmrlab (port: 8084)...');

http.createServer(function (request, response) {
  console.log(`Request ${request.method} ${request.url}`);
  response.end('Hello from jmrlab!', 'utf-8');
}).listen(8084);