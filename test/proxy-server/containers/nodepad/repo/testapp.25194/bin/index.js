#!/usr/bin/env node
      const http = require('http');

      const port = process?.env?.port;

      if(!port) {
        throw new  Error('PORT env not defined');
      }

      console.log('Starting application testapp (port: ' + port + ')...');

      http.createServer(function (request, response) {
        console.log(`Request ${request.method} ${request.url}`);
        response.end('Hello from testapp!', 'utf-8');
      }).listen(port);