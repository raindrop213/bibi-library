// 配置入口文件
const path = require('path');
const fs = require('fs');
const defaultConfig = require('./default');

// 加载配置
function loadConfig() {
  let config = { ...defaultConfig };
  
  
  // 从环境变量覆盖配置（除了端口号和书库路径）
  const envMappings = {
    'ACCESS_PASSWORD': 'tagFilter.accessPassword',
    'EXCLUDED_TAGS': 'tagFilter.excludedTags',
    'PAGE_SIZE': 'pagination.pageSize',
    'SERIES_PAGE_SIZE': 'pagination.seriesPageSize',
    'THUMBNAIL_CLEAN_INTERVAL': 'thumbnails.cleanInterval',
    'THUMBNAIL_CLEAN_TIME': 'thumbnails.cleanTime',
    'GOOGLE_ANALYTICS_ID': 'googleAnalytics.trackingId'
  };
  
  Object.entries(envMappings).forEach(([envKey, configPath]) => {
    if (process.env[envKey]) {
      const value = process.env[envKey];
      const keys = configPath.split('.');
      let target = config;
      
      // 导航到目标对象
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      
      // 设置值，处理特殊类型
      const finalKey = keys[keys.length - 1];
      if (envKey === 'EXCLUDED_TAGS') {
        target[finalKey] = value.split(',').map(tag => tag.trim());
      } else if (['PAGE_SIZE', 'SERIES_PAGE_SIZE', 'THUMBNAIL_CLEAN_INTERVAL'].includes(envKey)) {
        target[finalKey] = parseInt(value);
      } else {
        target[finalKey] = value;
      }
    }
  });
  
  // 验证配置
  validateConfig(config);
  
  return config;
}

// 验证配置
function validateConfig(config) {
  const errors = [];
  
  // 验证书库路径
  if (!config.calibreLibPath) {
    errors.push('calibreLibPath 不能为空');
  }
  
  // 验证端口
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    errors.push('port 必须是 1-65535 之间的整数');
  }
  
  // 验证标签过滤
  if (!Array.isArray(config.tagFilter?.excludedTags)) {
    errors.push('tagFilter.excludedTags 必须是数组');
  }
  
  // 验证分页设置
  if (!Number.isInteger(config.pagination?.pageSize) || config.pagination.pageSize < 1) {
    errors.push('pagination.pageSize 必须是正整数');
  }
  
  if (!Number.isInteger(config.pagination?.seriesPageSize) || config.pagination.seriesPageSize < 1) {
    errors.push('pagination.seriesPageSize 必须是正整数');
  }
  
  // 验证缩略图清理设置
  if (!Number.isInteger(config.thumbnails?.cleanInterval) || config.thumbnails.cleanInterval < 1) {
    errors.push('thumbnails.cleanInterval 必须是正整数');
  }
  
  if (!/^\d{1,2}:\d{2}$/.test(config.thumbnails?.cleanTime)) {
    errors.push('thumbnails.cleanTime 格式错误，应为 HH:MM');
  }
  
  if (errors.length > 0) {
    console.error('配置验证失败:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// 打印配置信息
function printConfig(config) {
  console.log('=== 配置信息 ===');
  console.log(`书库路径: ${config.calibreLibPath}`);
  console.log(`服务器端口: ${config.port}`);
  console.log(`启用CORS: ${config.enableCors}`);
  console.log(`排除标签: ${config.tagFilter.excludedTags.join(', ')}`);
  console.log(`访问密码: ${config.tagFilter.accessPassword || '无'}`);
  console.log(`缩略图清理: 每${config.thumbnails.cleanInterval}天 ${config.thumbnails.cleanTime}`);
  console.log(`分页大小: ${config.pagination.pageSize}`);
  console.log(`丛书分页大小: ${config.pagination.seriesPageSize}`);
  console.log(`Google Analytics: ${config.googleAnalytics.trackingId || '未配置'}`);
  console.log('================');
}

module.exports = {
  loadConfig,
  validateConfig,
  printConfig
}; 