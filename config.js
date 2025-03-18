// 配置文件
module.exports = {

  // Calibre书库路径（相对于项目根目录）
  calibreLibPath: './CalibreLib2',
  
  // 服务器端口
  port: 4545,

  // 是否启用CORS
  enableCors: true,
  
  // 标签过滤设置
  tagFilter: {
    // 需要过滤的标签列表
    excludedTags: ['ECHI'],
    // 访问密码（设置为null表示不需要密码）
    accessPassword: 'nsfw'
  },
  
  // 缩略图清理设置
  thumbnails: {
    // 清理间隔（天）
    cleanInterval: 7,
    // 清理时间（24小时制，格式：小时:分钟）
    cleanTime: '03:00'
  },

  // 分页设置
  pagination: {
    // 每页显示数量
    pageSize: 20,
    // 丛书列表每页显示数量
    seriesPageSize: 20
  }
};