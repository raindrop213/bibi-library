// 默认配置文件
// 简化配置，固定基本参数

module.exports = {
  // Calibre书库路径 - 固定为 ./books
  calibreLibPath: './books',
  
  // 服务器端口 - 固定为 4545
  port: 4545,

  // 启用CORS
  enableCors: true,
  
  // 标签过滤设置
  tagFilter: {
    // 需要过滤的标签列表
    excludedTags: ['ECHI'],
    
    // 访问密码
    accessPassword: 'nsfw'
  },
  
  // 缩略图清理设置
  thumbnails: {
    // 清理间隔（天）
    cleanInterval: 60,
    
    // 清理时间（24小时制，格式：小时:分钟）
    cleanTime: '04:00'
  },

  // 分页设置
  pagination: {
    // 每页显示数量
    pageSize: 20,
    
    // 丛书列表每页显示数量
    seriesPageSize: 20
  }
}; 