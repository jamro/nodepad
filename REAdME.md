# NodePad
NodePad is a simple tool to manage your NodeJs apps. It offers:
- REST API
- Web User Interface
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