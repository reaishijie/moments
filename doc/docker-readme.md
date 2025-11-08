# 瞬刻 - Docker部署文档

1. 该文件夹（[momentsQuickDeploy](https://github.com/reaishijie/moments/tree/main/momentsQuickDeploy)）已经打包好Docker相关文件，只需要在此文件夹下构建并启动。
2. 上传源码到服务器 或 使用git拉取文件

   ```bash
   git clone https://github.com/reaishijie/moments.git
   ```
3. 进行构建和运行操作

   ```bash
   cd moments/momentsQuickDeploy # 切换到快速部署目录
   vi docker-compose.yml # 设置数据库账号密码以及端口
   vi Dockerfile # 修改端口
   vi .env.docker # 修改docker数据库信息
   docker compose build # 构建镜像
   docker compose up -d # 后台运行容器
   ```
4. 设置反向代理

   将你的域名反向代理到http://127.0.0.1:9889 （如果修改了端口这里记得也修改）
