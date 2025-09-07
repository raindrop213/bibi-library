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
      - ACCESS_PASSWORD=password
      - EXCLUDED_TAGS=ECHI,ADULT
      - PAGE_SIZE=30
      - SERIES_PAGE_SIZE=30
      - THUMBNAIL_CLEAN_INTERVAL=60
      - THUMBNAIL_CLEAN_TIME=04:00
      - GOOGLE_ANALYTICS_ID=null  # 可选：设置Google Analytics ID
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
  -e ACCESS_PASSWORD=password \
  -e EXCLUDED_TAGS=ECHI,ADULT \
  -e PAGE_SIZE=30 \
  -e SERIES_PAGE_SIZE=30 \
  -e THUMBNAIL_CLEAN_INTERVAL=60 \
  -e THUMBNAIL_CLEAN_TIME=04:00 \
  -e GOOGLE_ANALYTICS_ID=null \
  rd213/bibi-library:latest
```

## 🏷️ 版本标签
- `latest`: 最新稳定版本（主分支）

## 🔧 环境变量
- `ACCESS_PASSWORD`: 访问密码（默认：password）
- `EXCLUDED_TAGS`: 排除的标签，逗号分隔（默认：ECHI,ADULT）
- `PAGE_SIZE`: 每页显示数量（默认：30）
- `SERIES_PAGE_SIZE`: 丛书列表每页显示数量（默认：30）
- `THUMBNAIL_CLEAN_INTERVAL`: 缩略图清理间隔天数（默认：60）
- `THUMBNAIL_CLEAN_TIME`: 缩略图清理时间，格式HH:MM（默认：04:00）
- `GOOGLE_ANALYTICS_ID`: Google Analytics跟踪ID（可选，格式：G-XXXXXXXXXX）

## 📁 挂载目录
- `/app/books`: 书籍目录

## 🔗 相关链接
- [GitHub仓库](https://github.com/raindrop213/bibi-library)
- [项目文档](https://github.com/raindrop213/bibi-library/blob/main/README.md)

## 📄 许可证
MIT License
