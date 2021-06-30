# Test Environment

| Property              |       Value |
|-----------------------|-------------|
| AppID                 | testapp     |
| App Port              | 25194       |
| NodePad Port          | 25193       |
| Proxy Port            | 25101       |
| NodePad UI (internal) | http://localhost:25193/nodepad/ |
| NodePad UI (proxy)    | http://localhost:25101/nodepad/ |
| App URL (internal)    | http://testapp.localhost:25193/ |
| App URL (proxy)       | http://testapp.localhost:25101/ |

# Howto

- Run `docker-compose up`
- Visit http://localhost:25101/nodepad/ and launch **testapp**. 
- Check http://testapp.localhost:25101
- Clean up by `docker-compose down`