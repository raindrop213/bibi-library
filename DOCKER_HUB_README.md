# bibi-library

Calibre书库 + bibi阅读器的Web应用，支持EPUB电子书在线阅读。

## 🚀 快速开始

### 使用Docker Compose（推荐）
```yaml
version: "3.8"
services:
  bibi-library:
    image: rd213/bibi-library:latest
    container_name: bibi-library
    ports:
      - "4545:4545"
    volumes:
      - /path/to/books:/app/books:ro
    environment:
      - ACCESS_PASSWORD=your_password
      - EXCLUDED_TAGS=ECHI,ADULT
    restart: unless-stopped
```

### 使用Docker命令
```bash
# 拉取最新版本
docker pull rd213/bibi-library:latest

# 运行容器
docker run -d \
  --name bibi-library \
  -p 4545:4545 \
  -v /path/to/books:/app/books:ro \
  -e ACCESS_PASSWORD=your_password \
  -e EXCLUDED_TAGS=ECHI,ADULT \
  rd213/bibi-library:latest
```

## 🏷️ 版本标签
- `latest`: 最新稳定版本（主分支）
- `v1.0.0`: 语义化版本标签

## 🔧 环境变量
- `ACCESS_PASSWORD`: 访问密码（默认：nsfw）
- `EXCLUDED_TAGS`: 排除的标签，逗号分隔（默认：ECHI,ADULT）

## 📁 挂载目录
- `/app/books`: 书籍目录（只读）

## 📋 技术规格
- **基础镜像**: `node:22-alpine`
- **端口**: 4545
- **大小**: ~184MB
- **架构**: linux/amd64

## 🔗 相关链接
- [GitHub仓库](https://github.com/raindrop213/bibi-library)
- [项目文档](https://github.com/raindrop213/bibi-library/blob/main/README.md)

## 📄 许可证
MIT License
