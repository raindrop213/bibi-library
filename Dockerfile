# 使用官方Node.js运行时作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev

# 复制应用代码
COPY . .

# 创建缩略图目录和书库目录
RUN mkdir -p .thumb books

# 暴露端口（固定为4545）
EXPOSE 4545

# 启动应用
CMD ["node", "server.js"]