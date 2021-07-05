# Test Environment

| Property              |       Value |
|-----------------------|-------------|
| AppID                 | testapp     |
| App Port              | 25194       |
| NodePad Port          | 25193       |
| HAProxy Port          | 25101       |
| Nginx Port            | 25102       |

# URLs

|                   | NodePad UI                       | Test App                         |
|-------------------|----------------------------------|----------------------------------|
| Local             | http://localhost:25193/nodepad/  | http://testapp.localhost:25193/  |
| HAProxy           | http://localhost:25101/nodepad/  | http://testapp.localhost:25101/  |
| Nginx             | http://localhost:25102/nodepad/  | http://testapp.localhost:25102/  |

# Howto

- Run `docker-compose up`
- Visit http://localhost:25101/nodepad/ and launch **testapp**. 
- Check http://testapp.localhost:25101 for HAProxy
- Check http://testapp.localhost:25102 for Nginx
- Clean up by `docker-compose down`