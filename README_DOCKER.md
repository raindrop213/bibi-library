# Docker 发布说明

## 🚀 快速开始

### 1. 在Docker Hub创建仓库
- 登录 [Docker Hub](https://hub.docker.com/)
- 创建新仓库：`bibi-library`
- 选择公开或私有

### 2. 配置GitHub Secrets
在GitHub仓库的 `Settings > Secrets and variables > Actions` 中添加：
- `DOCKER_USERNAME`: 你的Docker Hub用户名
- `DOCKER_PASSWORD`: Docker Hub访问令牌

### 3. 自动发布
- 推送到 `main` 或 `master` 分支会自动构建并发布 `latest` 标签
- 创建版本标签（如 `v1.0.0`）会自动发布对应版本

### 4. 手动发布
```bash
# Windows
scripts\publish.bat

# 或指定版本
scripts\publish.bat v1.0.0
```

## 📋 镜像信息
- **名称**: `rd213/bibi-library`
- **端口**: 4545
- **基础镜像**: `node:22-alpine`

## 🔍 查看镜像
https://hub.docker.com/r/rd213/bibi-library
