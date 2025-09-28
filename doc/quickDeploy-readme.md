# 瞬刻 - 快速部署文档

1. 该文件夹（[momentsQuickDeploy](https://github.com/reaishijie/moments/tree/main/momentsQuickDeploy)）已经打包好前端内容，只需要运行在node上即可。
2. 上传源码到服务器 或 使用git拉取文件

   ```bash
   git clone https://github.com/reaishijie/moments.git
   ```
3. 进行运行操作

   ```bash
   cd moments/momentsQuickDeploy # 切换到快速部署目录i
   cp .env.example .env #复制一份环境变量并修改数据库信息
   npm i # 安装依赖 npm install 或只安装运行依赖 npm install --omit=dev
   npm run db:install #初始化数据库
   npm run start #运行程序
   # 推荐使用pm2 进行后台保活 安装pm2后执行 npm run start:pm2
   ```
4. 设置反向代理

   将你的域名反向代理到http://127.0.0.1:9889

```javascript
//配置文件类似以下内容
server {
    listen 80 ; 
    server_name yourdomain.com; 
    index index.php index.html index.htm default.php default.htm default.html; 
    proxy_set_header Host $host; 
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; 
    proxy_set_header X-Forwarded-Host $server_name; 
    proxy_set_header X-Real-IP $remote_addr; 
    proxy_http_version 1.1; 
    proxy_set_header Upgrade $http_upgrade; 
    proxy_set_header Connection $http_connection; 
    access_log /www/sites/yourdomain.com/log/access.log main; 
    error_log /www/sites/yourdomain.com/log/error.log; 
    location ^~ /.well-known/acme-challenge {
        allow all; 
        root /usr/share/nginx/html; 
    }
    include /www/sites/yourdomain.com/proxy/*.conf; 
}
```

## 附录

- [安装nodejs](https://nodejs.org/zh-cn/download)

  windows

  ```bash
  # Download and install Chocolatey:
  powershell -c "irm https://community.chocolatey.org/install.ps1|iex"

  # Download and install Node.js:
  choco install nodejs --version="22.19.0"

  # Verify the Node.js version:
  node -v # Should print "v22.19.0".

  # Verify npm version:
  npm -v # Should print "10.9.3".
  ```
  linux

  ```bash
  # Download and install nvm:
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

  # in lieu of restarting the shell
  \. "$HOME/.nvm/nvm.sh"

  # Download and install Node.js:
  nvm install 22

  # Verify the Node.js version:
  node -v # Should print "v22.19.0".

  # Verify npm version:
  npm -v # Should print "10.9.3".
  ```
  ```bash
  # 安装完成后使用node -v 查看是否安装成功
  ```
- 安装pm2 （需要已经安装nodejs）

  ```bash
  npm install -g pm2
  ```
  ```bash
  # 安装完成后使用pm2 -v 查看是否安装成功
  ```
