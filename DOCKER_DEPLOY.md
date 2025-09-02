# Docker 部署说明

## 快速开始

### 1. 准备书库目录
将你的Calibre书库文件夹重命名为 `books`，放在项目根目录下：

```
bibi-library/
├── books/          # 你的Calibre书库目录
├── docker-compose.yml
├── Dockerfile
└── ...
```

### 2. 启动应用

#### 方式一：使用 docker-compose（推荐）
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

#### 方式二：使用 npm 脚本
```bash
# 构建镜像
npm run docker:build

# 启动容器
npm run docker:run
```

### 3. 访问应用
打开浏览器访问：http://localhost:4545

## 配置说明

- **端口**: 固定为 4545
- **书库路径**: 固定为 `/books`（容器内）
- **挂载**: 本地 `./books` 目录挂载到容器 `/books`

## 注意事项

1. 确保 `books` 目录包含完整的Calibre书库文件（metadata.db, cover.jpg等）
2. 书库目录为只读挂载，不会修改原始文件
3. 应用会自动生成缩略图缓存

## 故障排除

如果遇到问题，可以查看容器日志：
```bash
docker-compose logs -f
```

或者直接进入容器：
```bash
docker exec -it bibi-library sh
``` 