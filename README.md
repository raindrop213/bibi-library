# Calibre书库 + bibi阅读器

这是一个基于Node.js的web书库。
1. 推送[Calibre](https://github.com/kovidgoyal/calibre)数据库中的书籍。
2. [bibi](https://github.com/satorumurmur/bibi)作为阅读器。

## 开端
支持Calibre书籍库的[Calibre-web](https://github.com/janeczku/calibre-web)无法处理复杂的epub排版，而且在移动端是灾难级的表现。

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
   - 编辑`config.js`文件
   - 设置`calibreDbPath`为你的Calibre数据库文件(metadata.db)的路径
   - 可以使用相对路径或绝对路径

4. 启动服务器：
   ```
   node server.js
   ```

默认情况下，服务器将在http://localhost:4545上运行。你可以在`config.js`中修改端口号。

## 配置选项

在`config.js`文件中可以配置以下选项：

- `port`: 服务器端口号（默认：4545）
- `calibreDbPath`: Calibre数据库文件路径
- `enableCors`: 是否启用CORS（默认：true）
