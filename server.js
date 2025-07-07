const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const sharp = require('sharp');
const schedule = require('node-schedule');
const app = express();

const config = require('./config');
const PORT = config.port || 4545;

// 从配置中获取标签过滤设置
const EXCLUDED_TAGS = config.tagFilter?.excludedTags || ['ECHI'];
const ACCESS_PASSWORD = config.tagFilter?.accessPassword || 'rd2b';

// 构建标签过滤条件
function buildTagFilterCondition(hasAccess) {
  if (hasAccess) return ''; // 如果有权限，不进行过滤
  
  // 如果只有一个排除标签
  if (EXCLUDED_TAGS.length === 1) {
    return `
      AND NOT EXISTS (
        SELECT 1 FROM books_tags_link btl 
        JOIN tags t ON btl.tag = t.id 
        WHERE btl.book = books.id 
        AND t.name = '${EXCLUDED_TAGS[0]}'
      )
    `;
  }
  
  // 如果有多个排除标签
  return `
    AND NOT EXISTS (
      SELECT 1 FROM books_tags_link btl 
      JOIN tags t ON btl.tag = t.id 
      WHERE btl.book = books.id 
      AND t.name IN (${EXCLUDED_TAGS.map(tag => `'${tag}'`).join(',')})
    )
  `;
}

// 验证密码中间件
function validatePassword(req, res, next) {
  const password = req.headers['x-access-password'];
  const hasAccess = password === ACCESS_PASSWORD;
  req.hasAccess = hasAccess;
  next();
}

// 在所有API路由之前添加密码验证中间件
app.use('/api', validatePassword);

// 更新bibi配置函数
function updateBibiConfig() {
  const bibiConfigPath = path.join(__dirname, 'bibi', 'presets', 'default.js');
  
  // 读取bibi配置文件
  fs.readFile(bibiConfigPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`无法读取bibi配置文件: ${err}`);
      return;
    }
    
    // 获取相对路径（从bibi/presets到书库目录）
    let calibreLibPath = config.calibreLibPath;
    if (calibreLibPath.startsWith('./')) {
      calibreLibPath = calibreLibPath.substring(2); // 移除开头的'./'
    }
    const relativePath = `../../${calibreLibPath}`;
    
    // 使用正则表达式替换bookshelf配置
    const updatedData = data.replace(
      /(["']bookshelf["']\s*:\s*["'])([^"']+)(["'])/,
      `$1${relativePath}$3`
    );
    
    // 写入更新后的配置
    fs.writeFile(bibiConfigPath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error(`无法更新bibi配置文件: ${err}`);
        return;
      }
      console.log(`已更新bibi阅读器配置:"bookshelf" : "${relativePath}" `);
    });
  });
}

// 执行bibi配置更新
updateBibiConfig();

// 确保缩略图目录存在
const thumbDir = path.join(__dirname, '.thumb');
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
  console.log(`创建缩略图目录: ${thumbDir}`);
}

// 启用CORS
if (config.enableCors) {
  app.use(cors());
}

// 提供静态文件
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/bibi', express.static(path.join(__dirname, 'bibi')));
app.use('/.thumb', express.static(path.join(__dirname, '.thumb')));

// 使用config中的书库路径提供静态文件
const calibreLibPathForStatic = config.calibreLibPath.replace(/^\.\//, '');
app.use(`/${calibreLibPathForStatic}`, express.static(path.join(__dirname, config.calibreLibPath)));

// 从config中获取Calibre库路径
let calibreLibPath = config.calibreLibPath;

// 如果是相对路径，转换为绝对路径
if (!path.isAbsolute(calibreLibPath)) {
  calibreLibPath = path.join(__dirname, calibreLibPath);
}

// 构建数据库路径（Calibre的metadata.db总是在库根目录下）
const dbPath = path.join(calibreLibPath, 'metadata.db');

console.log(`Calibre库路径: ${calibreLibPath}`);
console.log(`尝试连接到数据库: ${dbPath}`);

// 检查数据库文件是否存在
let dbExists = false;
try {
  dbExists = fs.existsSync(dbPath);
} catch (err) {
  console.error('检查数据库文件时出错:', err.message);
}

if (!dbExists) {
  console.error(`数据库文件不存在: ${dbPath}`);
  console.error('请在config.js中设置正确的calibreLibPath');
}

// 全局变量存储数据库连接状态
let dbConnectionError = null;

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接到数据库时出错:', err.message);
    dbConnectionError = err.message;
  } else {
    console.log('成功连接到Calibre数据库');
  }
});

// 处理所有路由的中间件
app.use((req, res, next) => {
  // 如果数据库连接失败，返回错误
  if (dbConnectionError) {
    return res.status(500).json({
      error: `数据库连接失败: ${dbConnectionError}`,
      dbPath: dbPath,
      dbExists: dbExists
    });
  }
  next();
});

// 获取配置状态
app.get('/api/config', (req, res) => {
  res.json({
    dbPath: dbPath,
    dbExists: dbExists,
    dbConnectionStatus: dbConnectionError ? 'error' : 'connected',
    error: dbConnectionError
  });
});

// 获取书籍列表API
app.get('/api/books', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || config.pagination.pageSize;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const sort = req.query.sort || 'date-desc';
  const section = req.query.section || 'books';
  
  // 构建排序条件
  let orderBy = '';
  switch (sort) {
    case 'date-asc':
      orderBy = 'books.timestamp ASC';
      break;
    case 'date-desc':
      orderBy = 'books.timestamp DESC';
      break;
    case 'title-asc':
      orderBy = 'books.sort COLLATE NOCASE ASC';
      break;
    case 'title-desc':
      orderBy = 'books.sort COLLATE NOCASE DESC';
      break;
    case 'author-asc':
      orderBy = 'books.author_sort COLLATE NOCASE ASC';
      break;
    case 'author-desc':
      orderBy = 'books.author_sort COLLATE NOCASE DESC';
      break;
    case 'pubdate-asc':
      orderBy = 'books.pubdate ASC';
      break;
    case 'pubdate-desc':
      orderBy = 'books.pubdate DESC';
      break;
    case 'random':
      orderBy = 'RANDOM()';
      break;
    default:
      orderBy = 'books.timestamp DESC';
  }
  
  // 修改whereClause，添加标签过滤
  let whereClause = '';
  let queryParams = [];
  let joins = [];
  
  if (search) {
    whereClause = `WHERE (books.title LIKE ? OR books.author_sort LIKE ?)`;
    queryParams = [search, search].map(param => `%${param}%`);
  }
  
  // 添加标签过滤条件
  whereClause = whereClause ? `${whereClause} ${buildTagFilterCondition(req.hasAccess)}` : `WHERE 1=1 ${buildTagFilterCondition(req.hasAccess)}`;
  
  // 添加分类过滤
  if (req.query.publishers) {
    joins.push('JOIN books_publishers_link ON books.id = books_publishers_link.book');
    whereClause = whereClause ? `${whereClause} AND books_publishers_link.publisher = ?` : 'WHERE books_publishers_link.publisher = ?';
    queryParams.push(req.query.publishers);
  }
  
  if (req.query.authors) {
    joins.push('JOIN books_authors_link ON books.id = books_authors_link.book');
    whereClause = whereClause ? `${whereClause} AND books_authors_link.author = ?` : 'WHERE books_authors_link.author = ?';
    queryParams.push(req.query.authors);
  }
  
  if (req.query.categories) {
    joins.push('JOIN books_tags_link ON books.id = books_tags_link.book');
    whereClause = whereClause ? `${whereClause} AND books_tags_link.tag = ?` : 'WHERE books_tags_link.tag = ?';
    queryParams.push(req.query.categories);
  }
  
  if (req.query.series) {
    joins.push('JOIN books_series_link ON books.id = books_series_link.book');
    whereClause = whereClause ? `${whereClause} AND books_series_link.series = ?` : 'WHERE books_series_link.series = ?';
    queryParams.push(req.query.series);
    orderBy = 'CAST(books.series_index AS REAL) DESC';
  }
  
  if (req.query.languages) {
    joins.push('JOIN books_languages_link ON books.id = books_languages_link.book');
    whereClause = whereClause ? `${whereClause} AND books_languages_link.lang_code = ?` : 'WHERE books_languages_link.lang_code = ?';
    queryParams.push(req.query.languages);
  }
  
  // 获取总数
  const countQuery = `
    SELECT COUNT(DISTINCT books.id) as total 
    FROM books 
    ${joins.join(' ')} 
    ${whereClause}
  `;
  
  // 获取书籍列表
  const booksQuery = `
    SELECT DISTINCT
      books.id, 
      books.title, 
      books.pubdate, 
      books.timestamp, 
      books.path,
      books.has_cover,
      books.series_index
    FROM books 
    ${joins.join(' ')}
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  // 执行查询
  db.get(countQuery, queryParams, (err, countRow) => {
    if (err) {
      console.error('获取书籍总数时出错:', err.message);
      return res.status(500).json({ error: '获取书籍总数失败' });
    }
    
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);
    
    // 添加分页参数
    const finalQueryParams = [...queryParams, limit, offset];
    
    db.all(booksQuery, finalQueryParams, (err, rows) => {
      if (err) {
        console.error('获取书籍列表时出错:', err.message);
        return res.status(500).json({ error: '获取书籍列表失败' });
      }
      
      if (rows.length === 0) {
        // 如果没有书籍，直接返回空数组
        return res.json({
          books: [],
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        });
      }
      
      // 优化：一次性获取所有书籍的作者，减少数据库查询次数
      const bookIds = rows.map(book => book.id);
      const allAuthorsQuery = `
        SELECT 
          books_authors_link.book as book_id,
          authors.name as author_name
        FROM books_authors_link
        JOIN authors ON books_authors_link.author = authors.id
        WHERE books_authors_link.book IN (${bookIds.map(() => '?').join(',')})
      `;
      
      db.all(allAuthorsQuery, bookIds, (err, authorResults) => {
        if (err) {
          console.error('获取作者信息时出错:', err.message);
          // 如果获取作者失败，仍然返回书籍信息，但没有作者
          const processedBooks = rows.map(book => ({
            id: book.id,
            title: book.title,
            author: null,
            pubdate: book.pubdate,
            timestamp: book.timestamp,
            path: book.path,
            cover_url: book.has_cover ? `/api/books/${book.id}/cover` : null,
            series_index: book.series_index
          }));
          
          return res.json({
            books: processedBooks,
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages
          });
        }
        
        // 将作者按书籍ID分组
        const authorsMap = {};
        authorResults.forEach(result => {
          if (!authorsMap[result.book_id]) {
            authorsMap[result.book_id] = [];
          }
          authorsMap[result.book_id].push(result.author_name);
        });
        
        // 处理书籍列表
        const processedBooks = rows.map(book => ({
          id: book.id,
          title: book.title,
          author: authorsMap[book.id] || null,
          pubdate: book.pubdate,
          timestamp: book.timestamp,
          path: book.path,
          cover_url: book.has_cover ? `/api/books/${book.id}/cover` : null,
          series_index: book.series_index
        }));
        
        // 返回结果
        res.json({
          books: processedBooks,
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        });
      });
    });
  });
});

// 获取单本书籍详情
app.get('/api/books/:id', (req, res) => {
  const bookId = req.params.id;
  
  // 获取书籍基本信息
  const bookQuery = `
    SELECT 
      books.id, 
      books.title, 
      books.pubdate, 
      books.timestamp, 
      books.path,
      books.series_index,
      books.has_cover,
      comments.text as comment
    FROM books 
    LEFT JOIN comments ON books.id = comments.book
    WHERE books.id = ?
  `;
  
  console.log('执行查询:', bookQuery);
  console.log('查询参数:', bookId);
  
  db.get(bookQuery, [bookId], (err, book) => {
    if (err) {
      console.error('获取书籍详情时出错:', err.message);
      console.error('错误详情:', err);
      return res.status(500).json({ error: '获取书籍详情失败' });
    }
    
    if (!book) {
      console.log('未找到书籍:', bookId);
      return res.status(404).json({ error: '未找到书籍' });
    }
    
    console.log('获取到的书籍基本信息:', book);
    
    // 获取书籍标签
    const tagsQuery = `
      SELECT tags.name 
      FROM books_tags_link 
      JOIN tags ON books_tags_link.tag = tags.id 
      WHERE books_tags_link.book = ?
    `;
    
    // 获取出版商信息
    const publisherQuery = `
      SELECT publishers.name as publisher_name
      FROM books_publishers_link
      JOIN publishers ON books_publishers_link.publisher = publishers.id
      WHERE books_publishers_link.book = ?
    `;
    
    // 获取作者信息
    const authorQuery = `
      SELECT authors.name as author_name
      FROM books_authors_link
      JOIN authors ON books_authors_link.author = authors.id
      WHERE books_authors_link.book = ?
    `;
    
    // 获取系列信息
    const seriesQuery = `
      SELECT series.name as series_name
      FROM books_series_link
      JOIN series ON books_series_link.series = series.id
      WHERE books_series_link.book = ?
    `;
    
    // 获取所有标识符
    const identifiersQuery = `
      SELECT type, val
      FROM identifiers
      WHERE book = ?
    `;
    
    
    // 并行执行查询
    Promise.all([
      new Promise((resolve, reject) => {
        db.all(tagsQuery, [bookId], (err, tags) => {
          if (err) {
            console.error('获取标签时出错:', err);
            reject(err);
          } else {
            console.log('获取到的标签:', tags);
            resolve(tags);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.get(publisherQuery, [bookId], (err, publisher) => {
          if (err) {
            console.error('获取出版商时出错:', err);
            reject(err);
          } else {
            console.log('获取到的出版商:', publisher);
            resolve(publisher);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.all(authorQuery, [bookId], (err, authors) => {
          if (err) {
            console.error('获取作者时出错:', err);
            reject(err);
          } else {
            console.log('获取到的作者:', authors);
            resolve(authors);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.get(seriesQuery, [bookId], (err, series) => {
          if (err) {
            console.error('获取系列时出错:', err);
            reject(err);
          } else {
            console.log('获取到的系列:', series);
            resolve(series);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.all(identifiersQuery, [bookId], (err, identifiers) => {
          if (err) {
            console.error('获取标识符时出错:', err);
            reject(err);
          } else {
            console.log('获取到的标识符:', identifiers);
            resolve(identifiers);
          }
        });
      })
    ])
    .then(([tags, publisher, authors, series, identifiers]) => {
      // 构建封面URL
      let cover_url = null;
      if (book.has_cover) {
        cover_url = `/api/books/${book.id}/cover`;
      }
      
      // 将标识符转换为对象格式
      const identifiersObj = {};
      if (identifiers && identifiers.length > 0) {
        identifiers.forEach(item => {
          identifiersObj[item.type] = item.val;
        });
      }
      
      // 获取书籍目录中的所有文件
      const bookDir = path.join(calibreLibPath, book.path);
      
      fs.readdir(bookDir, (err, files) => {
        if (err) {
          console.error('读取书籍目录时出错:', err.message);
          return res.status(500).json({ error: '读取书籍目录失败' });
        }
        
        // 查找epub文件
        const epubFile = files.find(file => file.endsWith('.epub'));
        
        // 构建完整的书籍信息
        const bookInfo = {
          id: book.id,
          title: book.title,
          authors: authors.map(a => a.author_name),
          publisher: publisher ? publisher.publisher_name : null,
          pubdate: book.pubdate,
          timestamp: book.timestamp,
          path: book.path,
          series_index: book.series_index,
          comment: book.comment,
          cover_url: cover_url,
          tags: tags.map(tag => tag.name),
          series: series ? series.series_name : null,
          identifiers: identifiersObj,
          epub_url: `/api/books/${book.id}/epub`,
          epub_file: epubFile || null
        };
        
        res.json(bookInfo);
      });
    })
    .catch(err => {
      console.error('获取书籍相关信息时出错:', err.message);
      return res.status(500).json({ error: '获取书籍相关信息失败' });
    });
  });
});

// 获取书籍封面
app.get('/api/books/:id/cover', (req, res) => {
  const bookId = req.params.id;
  const size = req.query.size || 'full'; // 可选参数：thumb（缩略图）或full（原图）
  
  // 查询书籍路径
  db.get('SELECT path, has_cover FROM books WHERE id = ?', [bookId], (err, book) => {
    if (err) {
      console.error('查询书籍路径时出错:', err.message);
      return res.status(500).json({ error: '查询书籍路径失败' });
    }
    
    if (!book || !book.has_cover) {
      return res.status(404).json({ error: '未找到书籍封面' });
    }
    
    // 构建封面文件路径
    const coverPath = path.join(calibreLibPath, book.path, 'cover.jpg');
    
    // 检查文件是否存在
    fs.access(coverPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('封面文件不存在:', coverPath);
        return res.status(404).json({ error: '封面文件不存在' });
      }
      
      // 如果请求的是原图，直接发送
      if (size === 'full') {
        return res.sendFile(coverPath);
      }
      
      // 缩略图处理
      // 为每本书创建唯一的缩略图文件名
      const thumbFilename = `${bookId}.jpg`;
      const thumbPath = path.join(thumbDir, thumbFilename);
      
      // 检查缩略图是否已存在
      fs.access(thumbPath, fs.constants.F_OK, (err) => {
        if (!err) {
          // 缩略图已存在，直接发送
          return res.sendFile(thumbPath);
        }
        
        // 缩略图不存在，生成缩略图
        sharp(coverPath)
          .resize(210, 296) // 按照书籍封面比例 105:148 的两倍大小
          .jpeg({ quality: 80 }) // 设置JPEG质量为80%
          .toFile(thumbPath)
          .then(() => {
            // 发送生成的缩略图
            res.sendFile(thumbPath);
          })
          .catch(err => {
            console.error('生成缩略图时出错:', err);
            // 如果生成缩略图失败，回退到发送原图
            res.sendFile(coverPath);
          });
      });
    });
  });
});

// 获取书籍EPUB文件
app.get('/api/books/:id/epub', (req, res) => {
  const bookId = req.params.id;
  
  // 查询书籍路径和标题
  db.get('SELECT books.path, books.title FROM books WHERE books.id = ?', [bookId], (err, book) => {
    if (err) {
      console.error('查询书籍路径时出错:', err.message);
      return res.status(500).json({ error: '查询书籍路径失败' });
    }
    
    if (!book) {
      return res.status(404).json({ error: '未找到书籍' });
    }
    
    // 获取作者信息
    const authorQuery = `
      SELECT authors.name as author_name
      FROM books_authors_link
      JOIN authors ON books_authors_link.author = authors.id
      WHERE books_authors_link.book = ?
    `;
    
    db.all(authorQuery, [bookId], (err, authors) => {
      if (err) {
        console.error('获取作者信息时出错:', err.message);
        // 继续处理，但不使用作者信息
        processBookDownload(book, []);
      } else {
        processBookDownload(book, authors);
      }
    });
    
    function processBookDownload(book, authors) {
      // 获取书籍目录中的所有文件
      const bookDir = path.join(calibreLibPath, book.path);
      
      fs.readdir(bookDir, (err, files) => {
        if (err) {
          console.error('读取书籍目录时出错:', err.message);
          return res.status(500).json({ error: '读取书籍目录失败' });
        }
        
        // 查找epub文件
        const epubFile = files.find(file => file.endsWith('.epub'));
        
        if (!epubFile) {
          return res.status(404).json({ error: '未找到EPUB文件' });
        }
        
        const epubPath = path.join(bookDir, epubFile);
        
        // 创建自定义文件名 [作者] 标题.epub
        let customFilename = '';
        if (authors && authors.length > 0) {
          // 使用×连接多个作者
          const authorNames = authors.map(a => a.author_name);
          customFilename = `[${authorNames.join('×')}] ${book.title}.epub`;
        } else {
          customFilename = `${book.title}.epub`;
        }
        
        // 替换文件名中的非法字符
        customFilename = customFilename
          .replace(/[\/\\:*?"<>|]/g, '_') // 替换Windows和Unix系统中的非法字符
          .replace(/\s+/g, ' '); // 将多个空格替换为单个空格
        
        // 设置文件名
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(customFilename)}"`);
        res.setHeader('Content-Type', 'application/epub+zip');
        
        // 发送文件
        res.sendFile(epubPath);
      });
    }
  });
});

// 获取书籍EPUB文件路径（用于bibi阅读器）
app.get('/api/books/:id/epub-path', (req, res) => {
  const bookId = req.params.id;
  
  // 查询书籍路径
  db.get('SELECT path FROM books WHERE id = ?', [bookId], (err, book) => {
    if (err) {
      console.error('查询书籍路径时出错:', err.message);
      return res.status(500).json({ error: '查询书籍路径失败' });
    }
    
    if (!book) {
      return res.status(404).json({ error: '未找到书籍' });
    }
    
    // 获取书籍目录中的所有文件
    const bookDir = path.join(calibreLibPath, book.path);
    
    fs.readdir(bookDir, (err, files) => {
      if (err) {
        console.error('读取书籍目录时出错:', err.message);
        return res.status(500).json({ error: '读取书籍目录失败' });
      }
      
      // 查找epub文件
      const epubFile = files.find(file => file.endsWith('.epub'));
      
      if (!epubFile) {
        return res.status(404).json({ error: '未找到EPUB文件' });
      }
      
      // 构建完整的相对路径
      const fullPath = path.join(book.path, epubFile);
      
      res.json({ 
        path: book.path,
        epub_file: epubFile,
        full_path: fullPath
      });
    });
  });
});

// 获取书籍的所有标识符
app.get('/api/books/:id/identifiers', (req, res) => {
  const bookId = req.params.id;
  
  // 获取所有标识符信息
  const identifiersQuery = `
    SELECT type, val
    FROM identifiers
    WHERE book = ?
  `;
  
  db.all(identifiersQuery, [bookId], (err, results) => {
    if (err) {
      console.error('获取标识符时出错:', err.message);
      return res.status(500).json({ error: '获取标识符失败' });
    }
    
    if (!results || results.length === 0) {
      return res.status(404).json({ 
        error: '未找到标识符',
        book_id: bookId,
        identifiers: {}
      });
    }
    
    // 将结果转换为对象格式，使标识符类型作为键
    const identifiersObj = {};
    results.forEach(item => {
      identifiersObj[item.type] = item.val;
    });
    
    // 返回标识符信息
    res.json({
      book_id: bookId,
      identifiers: identifiersObj
    });
  });
});

// 获取作者列表
app.get('/api/authors', (req, res) => {
  const query = `
    SELECT 
      authors.id, 
      authors.name, 
      authors.sort, 
      COUNT(books_authors_link.book) as book_count
    FROM authors
    LEFT JOIN books_authors_link ON authors.id = books_authors_link.author
    LEFT JOIN books ON books_authors_link.book = books.id
    ${buildTagFilterCondition(req.hasAccess)}
    GROUP BY authors.id
    ORDER BY authors.sort COLLATE NOCASE
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取作者列表时出错:', err.message);
      return res.status(500).json({ error: '获取作者列表失败' });
    }
    
    res.json({ authors: rows });
  });
});

// 获取出版社列表
app.get('/api/publishers', (req, res) => {
  const query = `
    SELECT 
      publishers.id, 
      publishers.name, 
      COUNT(books_publishers_link.book) as book_count
    FROM publishers
    LEFT JOIN books_publishers_link ON publishers.id = books_publishers_link.publisher
    LEFT JOIN books ON books_publishers_link.book = books.id
    ${buildTagFilterCondition(req.hasAccess)}
    GROUP BY publishers.id
    ORDER BY publishers.name COLLATE NOCASE
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取出版社列表时出错:', err.message);
      return res.status(500).json({ error: '获取出版社列表失败' });
    }
    
    res.json({ publishers: rows });
  });
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  const query = `
    SELECT 
      tags.id, 
      tags.name, 
      COUNT(books_tags_link.book) as book_count
    FROM tags
    LEFT JOIN books_tags_link ON tags.id = books_tags_link.tag
    ${req.hasAccess ? '' : `WHERE tags.name NOT IN (${EXCLUDED_TAGS.map(tag => `'${tag}'`).join(',')})`}
    GROUP BY tags.id
    ORDER BY tags.name COLLATE NOCASE
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取分类列表时出错:', err.message);
      return res.status(500).json({ error: '获取分类列表失败' });
    }
    
    res.json({ categories: rows });
  });
});

// 获取丛书列表
app.get('/api/series', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = config.pagination.seriesPageSize;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const seriesName = req.query.name || '';
  
  // 构建通用的WITH子句
  const withClause = `
    WITH SeriesFirstBook AS (
      SELECT 
        series.id as series_id,
        MIN(books.id) as first_book_id,
        MAX(books.timestamp) as last_added_timestamp,
        MIN(CAST(books.series_index AS REAL)) as min_series_index
      FROM series
      JOIN books_series_link ON series.id = books_series_link.series
      JOIN books ON books_series_link.book = books.id
      ${buildTagFilterCondition(req.hasAccess)}
      GROUP BY series.id
    ),
    SeriesBookCount AS (
      SELECT
        series.id as series_id,
        COUNT(DISTINCT books_series_link.book) as book_count
      FROM series
      LEFT JOIN books_series_link ON series.id = books_series_link.series
      LEFT JOIN books ON books_series_link.book = books.id
      ${buildTagFilterCondition(req.hasAccess)}
      GROUP BY series.id
    )
  `;
  
  // 构建查询条件
  let whereClause = '';
  let queryParams = [];
  let needsPagination = true;
  
  if (seriesName) {
    // 精确查找特定名称的系列
    whereClause = 'WHERE LOWER(series.name) = LOWER(?)';
    queryParams.push(seriesName);
    needsPagination = false; // 精确查询不需要分页
  } else if (search) {
    // 模糊搜索系列名称
    whereClause = 'WHERE series.name LIKE ?';
    queryParams.push(`%${search}%`);
  }
  
  // 构建查询
  const selectClause = `
    SELECT 
      series.id, 
      series.name,
      SeriesBookCount.book_count,
      books.has_cover,
      books.path,
      books.id as cover_book_id,
      SeriesFirstBook.last_added_timestamp as timestamp,
      SeriesFirstBook.min_series_index
    FROM series
    LEFT JOIN SeriesBookCount ON series.id = SeriesBookCount.series_id
    LEFT JOIN SeriesFirstBook ON series.id = SeriesFirstBook.series_id
    LEFT JOIN books ON SeriesFirstBook.first_book_id = books.id
    ${whereClause}
  `;
  
  // 排序和分页（仅在不是精确查询时应用）
  const orderAndLimit = needsPagination ? 
    'ORDER BY SeriesFirstBook.last_added_timestamp DESC LIMIT ? OFFSET ?' : '';
  
  // 完整的查询
  const query = `
    ${withClause}
    ${selectClause}
    ${orderAndLimit}
  `;
  
  // 获取总数（仅在需要分页时执行）
  const getResults = () => {
    if (needsPagination) {
      const finalParams = [...queryParams, limit, offset];
      
      // 并行获取总数和结果
      Promise.all([
        new Promise((resolve, reject) => {
          const countQuery = `
            SELECT COUNT(*) as total 
            FROM series 
            ${whereClause}
          `;
          db.get(countQuery, queryParams, (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.total : 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.all(query, finalParams, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        })
      ])
      .then(([total, rows]) => {
        processResults(rows, total, true);
      })
      .catch(handleError);
    } else {
      // 精确查询，直接执行不需要计算总数
      db.all(query, queryParams, (err, rows) => {
        if (err) handleError(err);
        else processResults(rows, rows.length, false);
      });
    }
  };
  
  // 处理查询结果
  const processResults = (rows, total, isPaginated) => {
    // 处理结果，添加封面URL
    const seriesItems = rows.map(row => {
      let cover_url = null;
      if (row.has_cover) {
        cover_url = `/api/books/${row.cover_book_id}/cover`;
      }
      
      return {
        id: row.id,
        name: row.name,
        book_count: row.book_count || 0,
        min_series_index: row.min_series_index,
        cover_url: cover_url
      };
    });
    
    // 精确的name查询只返回一个结果
    if (seriesName && seriesItems.length > 0) {
      res.json(seriesItems[0]);
    } else if (isPaginated) {
      // 分页列表结果
      res.json({ 
        series: seriesItems,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      });
    } else if (seriesItems.length === 0) {
      // 未找到结果
      res.status(404).json({ error: '未找到系列' });
    } else {
      // 其他情况（单个非name查询结果）
      res.json({ series: seriesItems });
    }
  };
  
  // 错误处理
  const handleError = (err) => {
    console.error('查询系列时出错:', err.message);
    return res.status(500).json({ error: '查询系列失败' });
  };
  
  // 执行查询
  getResults();
});

// 获取语言列表
app.get('/api/languages', (req, res) => {
  const query = `
    SELECT 
      languages.id, 
      languages.lang_code, 
      COUNT(books_languages_link.book) as book_count
    FROM languages
    LEFT JOIN books_languages_link ON languages.id = books_languages_link.lang_code
    LEFT JOIN books ON books_languages_link.book = books.id
    ${buildTagFilterCondition(req.hasAccess)}
    GROUP BY languages.id
    ORDER BY languages.lang_code
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取语言列表时出错:', err.message);
      return res.status(500).json({ error: '获取语言列表失败' });
    }
    
    // 语言代码到中文名称的映射
    const languageMap = {
      'eng': '英语',
      'jpn': '日语',
      'zho': '中文',
      'chi': '中文',
      'kor': '韩语',
      'fra': '法语',
      'deu': '德语',
      'spa': '西班牙语',
      'ita': '意大利语',
      'rus': '俄语',
      'por': '葡萄牙语',
      'ara': '阿拉伯语',
      'hin': '印地语',
      'ben': '孟加拉语',
      'vie': '越南语',
      'tha': '泰语',
      'ind': '印度尼西亚语',
      'nld': '荷兰语',
      'swe': '瑞典语',
      'pol': '波兰语',
      'tur': '土耳其语',
      'ukr': '乌克兰语',
      'heb': '希伯来语',
      'dan': '丹麦语',
      'fin': '芬兰语',
      'nor': '挪威语',
      'hun': '匈牙利语',
      'ces': '捷克语',
      'ron': '罗马尼亚语',
      'ell': '希腊语'
    };
    
    // 添加中文名称
    const languagesWithNames = rows.map(lang => ({
      id: lang.id,
      lang_code: lang.lang_code,
      name: languageMap[lang.lang_code] || lang.lang_code, // 如果没有映射，使用原始代码
      book_count: lang.book_count
    }));
    
    res.json({ languages: languagesWithNames });
  });
});

// 清理缩略图函数
function clearThumbnails() {
  console.log('开始执行定时清理缩略图任务...');
  try {
    // 读取缩略图目录中的所有文件
    const files = fs.readdirSync(thumbDir);
    let deletedCount = 0;

    // 删除每个文件
    files.forEach(file => {
      if (file.endsWith('.jpg')) {
        fs.unlinkSync(path.join(thumbDir, file));
        deletedCount++;
      }
    });

    console.log(`定时任务：成功清理 ${deletedCount} 个缩略图文件`);
    return deletedCount;
  } catch (err) {
    console.error('定时清理缩略图时出错:', err);
    return 0;
  }
}

// 从配置中获取缩略图清理设置
const thumbnailCleanInterval = config.thumbnails?.cleanInterval || 7; // 默认7天
const thumbnailCleanTime = config.thumbnails?.cleanTime || '03:00'; // 默认凌晨3点
const [cleanHour, cleanMinute] = thumbnailCleanTime.split(':').map(Number);

// 设置定时任务 - 根据配置的时间和间隔执行
const cleanScheduleRule = new schedule.RecurrenceRule();
cleanScheduleRule.hour = cleanHour;
cleanScheduleRule.minute = cleanMinute;
cleanScheduleRule.dayOfWeek = new schedule.Range(0, 6, thumbnailCleanInterval);

const thumbnailCleanJob = schedule.scheduleJob(cleanScheduleRule, function() {
  const deletedCount = clearThumbnails();
  console.log(`定时任务完成，清理了 ${deletedCount} 个缩略图文件`);
});

console.log(`已设置每${thumbnailCleanInterval}天${cleanHour}:${cleanMinute.toString().padStart(2, '0')}自动清理缩略图的定时任务`);

// 处理SPA路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`或者打开 http://127.0.0.1:${PORT}`);
});

// 当应用关闭时关闭数据库连接和取消定时任务
process.on('SIGINT', () => {
  if (thumbnailCleanJob) {
    thumbnailCleanJob.cancel();
    console.log('已取消定时任务');
  }
  
  db.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});