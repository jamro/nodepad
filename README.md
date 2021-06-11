# NodePad
NodePad is a simple tool to manage your NodeJs apps. Main Features
- [REST API](#rest-api)
- [Web User Interface](#web-user-interface)
- Upload of application bundle to the server
- Starting/stopping of node applications
- Preview logs
- Traffic routing based on domain names
- Authorization to NodePad API/UI
- Basic app monitoring

Under the hood, **NodePad** runs [PM2](https://www.npmjs.com/package/pm2) as a process manager.

# Installation

## Github

Clone Git Repository
```bash
git clone https://github.com/jamro/nodepad.git
cd nodepad
```

Install all node packages
```bash
npm install
```

Launch **NodePad**
```bash
npm start
```

Open **NodePad** in youur Browser:
- User Interface: http://localhost:3000/nodepad/
- REST API: http://localhost:3000/nodepad/api

# Main Features

## REST API
All features are available through REST API. See http://localhost:3000/nodepad/api for more details

## Web User Interface
The UI is available at http://localhost:3000/nodepad/ and it could be an alternative to the [REST API](#rest-api)

![Applicatoin list user interface](./docs/nodepad_ui.jpg)


