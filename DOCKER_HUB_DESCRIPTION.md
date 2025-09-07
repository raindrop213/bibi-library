Calibre书库 + bibi阅读器的Web应用，支持EPUB电子书在线阅读。

## 快速开始

```bash
docker run -d \
  --name bibi-library \
  -p 4545:4545 \
  -v /path/to/books:/app/books:ro \
  -e ACCESS_PASSWORD=your_password \
  rd213/bibi-library:latest
```

## 环境变量

- `ACCESS_PASSWORD`: 访问密码（默认：nsfw）
- `EXCLUDED_TAGS`: 排除的标签，逗号分隔（默认：ECHI,ADULT）
- `PAGE_SIZE`: 每页显示数量（默认：20）
- `SERIES_PAGE_SIZE`: 丛书列表每页显示数量（默认：20）
- `THUMBNAIL_CLEAN_INTERVAL`: 缩略图清理间隔天数（默认：60）
- `THUMBNAIL_CLEAN_TIME`: 缩略图清理时间，格式HH:MM（默认：04:00）

## 技术规格

- **基础镜像**: node:22-alpine
- **端口**: 4545
- **大小**: ~184MB
- **架构**: linux/amd64

## 相关链接

- [GitHub仓库](https://github.com/raindrop213/bibi-library)
- [完整文档](https://github.com/raindrop213/bibi-library/blob/main/README.md)

## 许可证

MIT License
