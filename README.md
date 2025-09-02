# Calibre书库 + bibi阅读器

这是一个基于Node.js的web书库。
1. 推送[Calibre](https://github.com/kovidgoyal/calibre)数据库中的书籍。
2. [bibi](https://github.com/satorumurmur/bibi)作为阅读器。

因为支持Calibre书籍库的[Calibre-web](https://github.com/janeczku/calibre-web)无法处理复杂的epub排版，而且在移动端是灾难级的表现。所以制作了这个简单的书架项目。

## 优势
- bibi阅读器有对竖版日语书做专门优化
- Calibre是最好用的书籍管理工具！
- 支持Docker部署，便于容器化管理

## 安装和使用

### 前提条件
- Node.js 或 Docker
- Calibre书籍库

### 方式一：直接运行

1. 克隆或下载本仓库
   ```bash
   git clone https://github.com/raindrop213/bibi-library.git
   cd bibi-library
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置书库路径：
   - 可以复制或者软链接Calibre书库到 `./books` 目录，

4. 启动服务器：
   ```bash
   node server.js
   ```

### 方式二：Docker部署（推荐）

1. 准备书库目录：

2. 启动服务：
   ```bash
   # 使用 docker-compose（推荐）
   docker-compose up -d
   
   # 或使用 npm 脚本
   npm run docker:build
   npm run docker:run
   ```

3. 访问应用：http://localhost:4545


## 功能特性

- 📚 支持Calibre书库管理
- 📖 集成bibi阅读器
- 🏷️ 标签过滤和分类
- 📱 移动端友好
- 🐳 Docker容器化支持
