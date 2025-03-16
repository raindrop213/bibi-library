// 配置文件
module.exports = {

  // Calibre书库路径（相对于项目根目录）
  calibreLibPath: './CalibreLib2',
  
  // 服务器端口
  port: 4545,

  // 是否启用CORS
  enableCors: true,
  
  // 缩略图清理设置
  thumbnails: {
    // 清理间隔（天）
    cleanInterval: 7,
    // 清理时间（24小时制，格式：小时:分钟）
    cleanTime: '03:00'
  }
};