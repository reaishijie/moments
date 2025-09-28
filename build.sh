#!/bin/bash

set -e  # 出错就退出

FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
OUTPUT_DIR="momentsQuickDeploy"

echo "============================"
echo " 开始构建 "
echo "============================"

############################
# 0. 清理输出目录（保留特定文件）
############################
echo "[0/3] 清理输出目录..."
mkdir -p $OUTPUT_DIR
find "$OUTPUT_DIR" -mindepth 1 \
  ! -name '.env.docker' \
  ! -name 'docker-compose.yml' \
  ! -name 'Dockerfile' \
  -exec rm -rf {} +

############################
# 1. 构建前端
############################
echo "[1/3] 构建前端..."
cd $FRONTEND_DIR
npm install
npm run build
cd ..

# 把 dist 重命名为 public 并复制到 quickDeploy/public
mkdir -p $OUTPUT_DIR/public
cp -r $FRONTEND_DIR/dist/* $OUTPUT_DIR/public/

############################
# 2. 构建后端
############################
echo "[2/3] 构建后端..."
cd $BACKEND_DIR
npm install
npm run build
cd ..

# 复制后端需要的文件到 quickDeploy 根目录
cp $BACKEND_DIR/package.json $OUTPUT_DIR/
cp -r $BACKEND_DIR/dist $OUTPUT_DIR/
cp -r $BACKEND_DIR/prisma $OUTPUT_DIR/
cp $BACKEND_DIR/.env.example $OUTPUT_DIR/ || true   # 如果不存在就忽略

############################
# 3. 提示完成
############################
echo "============================"
echo " 构建完成 ✅"
echo " 输出目录: $OUTPUT_DIR/"
echo "============================"
