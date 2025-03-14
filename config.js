// 配置文件
module.exports = {
  // 服务器端口
  port: 4545,
  
  // Calibre数据库路径
  // 可以是相对路径或绝对路径
  // 相对路径是相对于项目根目录
  // 例如：'C:/Users/用户名/AppData/Roaming/calibre/metadata.db'（Windows）
  // 或 '/home/用户名/calibre/metadata.db'（Linux/Mac）
  // calibreDbPath: 'F:/OneDrive/CalibreLib/metadata.db',
  calibreDbPath: './Calibre/metadata.db',
  
  // 是否启用CORS
  enableCors: true
};