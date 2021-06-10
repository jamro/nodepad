#!/usr/bin/env node
      const http = require('http');

      console.log('Starting application asdf (port: 3332)...');

      http.createServer(function (request, response) {
        console.log(`Request ${request.method} ${request.url}`);
        response.end('Hello from asdf!', 'utf-8');
      }).listen(3332);