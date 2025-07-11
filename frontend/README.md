# Bibi Library Frontend

这是 Bibi Library 的 Svelte 前端项目。

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── BookCard.svelte     # 书籍卡片
│   │   ├── BookGrid.svelte     # 书籍网格
│   │   ├── BookDetail.svelte   # 书籍详情弹窗
│   │   ├── CategoryList.svelte # 分类列表
│   │   ├── Header.svelte       # 头部
│   │   ├── Sidebar.svelte      # 侧边栏
│   │   ├── AboutModal.svelte   # 关于弹窗
│   │   └── FullscreenCover.svelte # 全屏封面
│   ├── routes/              # 路由页面
│   │   ├── Books.svelte        # 书籍列表页
│   │   ├── Categories.svelte   # 分类页
│   │   ├── Authors.svelte      # 作者页
│   │   ├── Publishers.svelte   # 出版社页
│   │   ├── Series.svelte       # 丛书页
│   │   ├── Languages.svelte    # 语言页
│   │   ├── Favorites.svelte    # 收藏页
│   │   └── CategoryBooks.svelte # 分类书籍页
│   ├── stores/              # 状态管理
│   │   ├── router.js           # 路由状态
│   │   ├── auth.js             # 认证状态
│   │   ├── favorites.js        # 收藏状态
│   │   └── ui.js               # UI状态
│   ├── services/            # API服务
│   │   └── api.js              # API调用封装
│   ├── styles/              # 样式文件
│   │   └── global.css          # 全局样式
│   ├── App.svelte           # 根组件
│   └── main.js              # 入口文件
├── index.html               # HTML模板
├── vite.config.js           # Vite配置
├── svelte.config.js         # Svelte配置
└── package.json             # 项目配置
```

## 开发

### 安装依赖

```bash
cd frontend
npm install
```

### 开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

生成的文件将在 `../dist` 目录中。

## 特性

- 🎨 **现代化设计**: 基于 Svelte 的响应式设计
- 📱 **移动端优化**: 完美适配移动设备
- 🔍 **智能搜索**: 支持书籍、作者、标签搜索
- 📚 **分类浏览**: 按作者、出版社、丛书、语言等分类
- ⭐ **收藏功能**: 本地存储收藏书籍
- 🌙 **暗色主题**: 护眼的暗色界面
- 🚀 **高性能**: 虚拟滚动、懒加载等优化

## 技术栈

- **Svelte**: 现代前端框架
- **Vite**: 快速的构建工具
- **CSS Variables**: 主题系统
- **Fetch API**: HTTP请求
- **localStorage**: 本地数据存储
- **Hash Router**: 前端路由

## API 集成

前端通过 `/api/*` 路径与后端 Express 服务器通信，支持：

- 书籍列表和详情
- 分类数据（作者、出版社、丛书等）
- 搜索和过滤
- 封面图片和文件下载
- 访问控制和权限管理

## 部署

项目支持两种部署方式：

1. **开发模式**: 使用 Vite 开发服务器
2. **生产模式**: 构建后由 Express 服务器提供静态文件

在生产环境中，运行 `npm run build` 后，Express 服务器会自动检测并提供构建后的文件。