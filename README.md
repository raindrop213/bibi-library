# bibi-library

基于Node.js的Calibre书库Web应用，集成bibi阅读器，支持EPUB电子书在线阅读。

## 特性
- 📚 支持Calibre书库管理
- 📖 集成bibi阅读器（专为竖版日语书优化）
- 🏷️ 标签过滤和分类
- 📱 移动端友好
- 🐳 Docker容器化支持
- 📊 可配置Google Analytics

## 快速开始

### Docker部署（推荐）

1. 准备Calibre书库目录

2. 启动服务 [- Docker Hub -](https://hub.docker.com/repository/docker/rd213/bibi-library/general)：


   - 使用 [docker-compose](./docker-compose.yml) 部署
      ```bash
      docker-compose up -d
      ```

   - 或者直接使用Docker命令部署（例如：/path/to/CalibreLib/metadata.db）
      ```bash
      docker run -d \
      --name bibi-library \
      -p 4545:4545 \
      -v /path/to/CalibreLib:/app/books:ro \
      rd213/bibi-library:latest
      ```


### 本地运行

1. 克隆仓库并安装依赖：
   ```bash
   git clone https://github.com/raindrop213/bibi-library.git
   cd bibi-library
   npm install
   ```

2. 将Calibre书库复制到 `./books` 目录，使 metadata.db 在 `./books` 目录下

3. 启动服务器：
   ```bash
   node server.js
   ```

## 许可证
MIT License
