# Calibre书库 + bibi阅读器

这是一个基于Node.js的web书库。
1. 推送[Calibre](https://github.com/kovidgoyal/calibre)数据库中的书籍。
2. [bibi](https://github.com/satorumurmur/bibi)作为阅读器。

因为支持Calibre书籍库的[Calibre-web](https://github.com/janeczku/calibre-web)无法处理复杂的epub排版，而且在移动端是灾难级的表现。所以制作了这个简单的书架项目。

## 优势
- bibi阅读器有对竖版日语书做专门优化，应对各种图片排版也能基本正确处理
- Calibre是最好用的书籍管理工具！

## 安装和使用


### 前提条件
- Node.js
- Calibre书籍库

### 安装步骤

1. 克隆或下载本仓库
   ```
   git clone https://github.com/raindrop213/bibi-library.git
   cd bibi-library
   ```

2. 安装依赖：
   ```
   npm install express sqlite3 cors sharp node-schedule
   ```

3. 配置Calibre数据库路径：
   - Calibre书库放置在根目录
   - 编辑 `config.js` 文件，编辑Calibre书库路径

4. 启动服务器：
   ```
   node server.js
   ```

默认情况下，服务器将在 `http://127.0.0.1:4545/`上 运行。
