# Calibre书库 + bibi阅读器

这是一个基于Node.js的web书库。
1. 推送[Calibre](https://github.com/kovidgoyal/calibre)数据库中的书籍。
2. [bibi](https://github.com/satorumurmur/bibi)作为阅读器。

因为支持Calibre书籍库的[Calibre-web](https://github.com/janeczku/calibre-web)无法处理复杂的epub排版，而且在移动端是灾难级的表现。所以制作了这个简单的书架项目。

## 优势
- bibi阅读器有对竖版日语书做专门优化，应对各种图片排版也能基本正确处理
- Calibre是最好用的书籍管理工具！
- 支持Docker部署，便于容器化管理

## 安装和使用

### 前提条件
- Node.js 22+ 或 Docker
- Calibre书籍库

### 方式一：直接运行

1. 克隆或下载本仓库
   ```bash
   git clone https://github.com/raindrop213/bibi-library.git
   cd bibi-library
   ```

2. 更新依赖（推荐）：
   ```bash
   # Linux/macOS
   chmod +x update-deps.sh
   ./update-deps.sh
   
   # Windows
   update-deps.bat
   ```

   或者手动安装：
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. 配置书库路径（可选）：
   - 默认使用 `./CalibreLib` 目录
   - 可通过环境变量 `CALIBRE_LIB_PATH` 指定其他路径
   - 或创建 `config.js` 文件进行自定义配置

4. 启动服务器：
   ```bash
   node server.js
   ```

### 方式二：Docker部署（推荐）

1. 准备书库目录：
   ```bash
   # 将你的Calibre书库文件夹重命名为 books，放在项目根目录
   mv /path/to/your/calibre/library ./books
   ```

2. 启动服务：
   ```bash
   # 使用 docker-compose（推荐）
   docker-compose up -d
   
   # 或使用 npm 脚本
   npm run docker:build
   npm run docker:run
   ```

3. 访问应用：http://localhost:4545

详细说明请查看 [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)

## 快速启动

### 使用启动脚本（推荐）

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

### 手动启动

1. 将你的Calibre书库文件夹重命名为 `books`，放在项目根目录
2. 运行 `docker-compose up -d`
3. 访问 http://localhost:4545

## 配置说明

项目已简化配置，主要参数固定：

- **书库路径**: `./books`（项目根目录下的books文件夹）
- **端口**: `4545`
- **访问密码**: `nsfw`（用于访问限制内容）

如需修改配置，可以编辑 `config/default.js` 文件。

## 访问地址

默认情况下，服务器将在 `http://127.0.0.1:4545/` 上运行。

## 功能特性

- 📚 支持Calibre书库管理
- 📖 集成bibi阅读器
- 🏷️ 标签过滤和分类
- 🔍 搜索和排序功能
- 📱 移动端友好
- 🐳 Docker容器化支持
- 🔧 灵活的配置管理
- 🖼️ 自动缩略图生成和清理
