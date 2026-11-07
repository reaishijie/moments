#!/bin/sh
# QuickDeploy 启动脚本：保证容器一定带着强随机 JWT_SECRET 启动。
#
# momentsQuickDeploy/.env.docker 是公开在仓库里的示例配置，不能承载真实密钥。
# 这里在首次启动时生成密钥并写入挂载卷（/app/data），后续重启复用同一份密钥，
# 从而既避免使用公开默认密钥，又不会在重启后让所有登录态失效。
set -e

DATA_DIR="${MOMENTS_SECRET_DIR:-/app/data}"
SECRET_FILE="$DATA_DIR/jwt_secret"

is_weak_secret() {
    case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
        "" | "demo_jwt_secret" | "secret" | "changeme" | "change_me" | "password" | "your_secret" | "jwt_secret")
            return 0
            ;;
    esac
    return 1
}

if is_weak_secret "$JWT_SECRET"; then
    mkdir -p "$DATA_DIR"
    if [ -s "$SECRET_FILE" ]; then
        JWT_SECRET="$(cat "$SECRET_FILE")"
        echo "[entrypoint] 复用已持久化的 JWT_SECRET"
    else
        JWT_SECRET="$(openssl rand -hex 32)"
        printf '%s' "$JWT_SECRET" > "$SECRET_FILE"
        chmod 600 "$SECRET_FILE"
        echo "[entrypoint] 已生成新的 JWT_SECRET 并保存到 $SECRET_FILE"
    fi
    export JWT_SECRET
fi

exec "$@"
