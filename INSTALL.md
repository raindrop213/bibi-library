# 安装说明

## 快速安装

### 1. 确保Node.js版本
```bash
node -v  # 需要 v22.0.0 或更高版本
```

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 准备书库
将你的Calibre书库文件夹重命名为 `books`，放在项目根目录下。

### 4. 启动应用
```bash
# 本地运行
npm start

# 或使用Docker
docker-compose up -d
```

## 依赖说明

项目使用以下核心依赖：

- **express**: Web服务器框架
- **sqlite3**: SQLite数据库驱动
- **cors**: 跨域资源共享
- **sharp**: 图像处理（缩略图生成）
- **node-schedule**: 定时任务

## 版本策略

- 使用 `^` 版本范围，允许补丁和次要版本更新
- 不锁定具体版本，保持灵活性
- 建议使用Node.js 22+ LTS版本

## 故障排除

如果遇到依赖问题：

1. 清理并重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. 检查Node.js版本：
   ```bash
   node -v
   ```

3. 使用Docker部署（推荐）：
   ```bash
   docker-compose up -d
   ``` 