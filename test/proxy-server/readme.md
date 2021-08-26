# Test Environment

| Service                | Proxy Server   | Port        |
|------------------------|----------------|-------------|
| Test App               | none           | 25194       |
| NodePad Dashboard      | none           | 20181       |
| NodePad Dashboard      | HAProxy        | 20281       |
| NodePad Dashboard      | Nginx          | 20381       |
| NodePad Proxy          | none           | 20182       |
| NodePad Proxy          | HAProxy        | 20282       |
| NodePad Proxy          | Nginx          | 20382       |


# URLs

|                   | NodePad Dashbaord                | Test App                         |
|-------------------|----------------------------------|----------------------------------|
| No Proxy          | http://localhost:20181/          | http://testapp.localhost:20182/  |
| HAProxy           | http://localhost:20281/          | http://testapp.localhost:20282/  |
| Nginx             | http://localhost:20381/          | http://testapp.localhost:20382/  |

# Howto

- Run `docker-compose up --build`
- Visit http://localhost:20281 and launch **testapp**. 
- Check http://localhost:20381 for Nginx (Dashboard)
- Check http://testapp.localhost:20282 for HAProxy
- Check http://testapp.localhost:20382 for Nginx
- Clean up by `docker-compose down`