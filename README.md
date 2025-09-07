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

2. 启动服务：
   ```bash
   # 使用 docker-compose
   docker-compose up -d
   
   # 或直接使用Docker命令
   docker run -d \
     --name bibi-library \
     -p 4545:4545 \
     -v /path/to/books:/app/books:ro \
     rd213/bibi-library:latest
   ```

3. 访问应用：http://localhost:4545

### 本地运行

1. 克隆仓库并安装依赖：
   ```bash
   git clone https://github.com/raindrop213/bibi-library.git
   cd bibi-library
   npm install
   ```

2. 将Calibre书库复制到 `./books` 目录

3. 启动服务器：
   ```bash
   node server.js
   ```


## 配置

### 环境变量
- `ACCESS_PASSWORD`: 访问密码（默认：password）
- `EXCLUDED_TAGS`: 排除的标签，逗号分隔（默认：ECHI,ADULT）
- `GOOGLE_ANALYTICS_ID`: Google Analytics跟踪ID（可选）


## 许可证
MIT License
