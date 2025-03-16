const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const config = require('./config');
const fs = require('fs');
const sharp = require('sharp');
const schedule = require('node-schedule');

const app = express();
const PORT = config.port || 3000;

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
app.use('/CalibreLib', express.static(path.join(__dirname, 'CalibreLib')));
app.use('/.thumb', express.static(path.join(__dirname, '.thumb')));

// 连接到Calibre的metadata.db
let dbPath = config.calibreDbPath;

// 如果是相对路径，转换为绝对路径
if (!path.isAbsolute(dbPath)) {
  dbPath = path.join(__dirname, dbPath);
}

// 获取Calibre库的根目录路径（metadata.db所在的目录）
const calibreLibraryPath = path.dirname(dbPath);

console.log(`尝试连接到数据库: ${dbPath}`);
console.log(`Calibre库根目录: ${calibreLibraryPath}`);

// 检查数据库文件是否存在
let dbExists = false;
try {
  dbExists = fs.existsSync(dbPath);
} catch (err) {
  console.error('检查数据库文件时出错:', err.message);
}

if (!dbExists) {
  console.error(`数据库文件不存在: ${dbPath}`);
  console.error('请在config.js中设置正确的calibreDbPath');
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
  const limit = parseInt(req.query.limit) || 20;
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
  
  // 构建查询条件
  let whereClause = '';
  let queryParams = [];
  let joins = [];
  
  if (search) {
    whereClause = `WHERE (books.title LIKE ? OR books.author_sort LIKE ?)`;
    queryParams = [search, search].map(param => `%${param}%`);
  }
  
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
      books.author_sort as author, 
      books.pubdate, 
      books.timestamp, 
      books.path,
      books.has_cover
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
      
      // 处理结果
      const books = rows.map(book => {
        // 构建封面URL
        let cover_url = null;
        if (book.has_cover) {
          cover_url = `/api/books/${book.id}/cover`;
        }
        
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          pubdate: book.pubdate,
          timestamp: book.timestamp,
          path: book.path,
          cover_url: cover_url
        };
      });
      
      res.json({
        books,
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
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
      books.author_sort as author, 
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
    
    console.log('执行标签查询:', tagsQuery);
    console.log('执行出版商查询:', publisherQuery);
    console.log('执行作者查询:', authorQuery);
    
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
      })
    ])
    .then(([tags, publisher, authors]) => {
      // 构建封面URL
      let cover_url = null;
      if (book.has_cover) {
        cover_url = `/api/books/${book.id}/cover`;
      }
      
      // 获取书籍目录中的所有文件
      const bookDir = path.join(calibreLibraryPath, book.path);
      
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
          author: book.author,
          authors: authors.map(a => a.author_name),
          publisher: publisher ? publisher.publisher_name : null,
          pubdate: book.pubdate,
          timestamp: book.timestamp,
          path: book.path,
          series_index: book.series_index,
          comment: book.comment,
          cover_url: cover_url,
          tags: tags.map(tag => tag.name),
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
    const coverPath = path.join(calibreLibraryPath, book.path, 'cover.jpg');
    
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
  db.get('SELECT books.path, books.title, books.author_sort as author FROM books WHERE books.id = ?', [bookId], (err, book) => {
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
        // 继续使用book.author作为备选
        processBookDownload(book, null);
      } else {
        processBookDownload(book, authors);
      }
    });
    
    function processBookDownload(book, authors) {
      // 获取书籍目录中的所有文件
      const bookDir = path.join(calibreLibraryPath, book.path);
      
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
        } else if (book.author) {
          customFilename = `[${book.author}] ${book.title}.epub`;
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
    const bookDir = path.join(calibreLibraryPath, book.path);
    
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
  const query = `
    WITH SeriesFirstBook AS (
      SELECT 
        series.id as series_id,
        MIN(books.id) as first_book_id
      FROM series
      JOIN books_series_link ON series.id = books_series_link.series
      JOIN books ON books_series_link.book = books.id
      GROUP BY series.id
    )
    SELECT 
      series.id, 
      series.name, 
      COUNT(books_series_link.book) as book_count,
      books.has_cover,
      books.path,
      books.id as cover_book_id
    FROM series
    LEFT JOIN books_series_link ON series.id = books_series_link.series
    LEFT JOIN SeriesFirstBook ON series.id = SeriesFirstBook.series_id
    LEFT JOIN books ON SeriesFirstBook.first_book_id = books.id
    GROUP BY series.id
    ORDER BY series.name COLLATE NOCASE
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取丛书列表时出错:', err.message);
      return res.status(500).json({ error: '获取丛书列表失败' });
    }
    
    // 处理结果，添加封面URL
    const series = rows.map(row => {
      let cover_url = null;
      if (row.has_cover) {
        cover_url = `/api/books/${row.cover_book_id}/cover`;
      }
      
      return {
        id: row.id,
        name: row.name,
        book_count: row.book_count,
        cover_url: cover_url
      };
    });
    
    res.json({ series });
  });
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

// 设置定时任务 - 每天凌晨3点执行
const dailyJob = schedule.scheduleJob('0 3 * * *', function() {
  const deletedCount = clearThumbnails();
  console.log(`定时任务完成，清理了 ${deletedCount} 个缩略图文件`);
});

console.log('已设置每天凌晨3点自动清理缩略图的定时任务');

// 清理缩略图缓存
app.get('/api/admin/clear-thumbnails', (req, res) => {
  // 简单的安全检查 - 仅允许本地请求
  const clientIp = req.ip || req.connection.remoteAddress;
  if (clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== '::ffff:127.0.0.1') {
    return res.status(403).json({ error: '仅允许本地请求' });
  }

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

    res.json({ 
      success: true, 
      message: `成功清理 ${deletedCount} 个缩略图文件`,
      thumbDir: thumbDir
    });
  } catch (err) {
    console.error('清理缩略图时出错:', err);
    res.status(500).json({ error: '清理缩略图失败', details: err.message });
  }
});

// 管理页面
app.get('/admin', (req, res) => {
  // 简单的安全检查 - 仅允许本地请求
  const clientIp = req.ip || req.connection.remoteAddress;
  if (clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== '::ffff:127.0.0.1') {
    return res.status(403).send('仅允许本地访问管理页面');
  }

  // 获取缩略图统计信息
  let thumbnailStats = { count: 0, size: 0 };
  try {
    const files = fs.readdirSync(thumbDir);
    thumbnailStats.count = files.filter(file => file.endsWith('.jpg')).length;
    
    // 计算总大小
    files.forEach(file => {
      if (file.endsWith('.jpg')) {
        const stats = fs.statSync(path.join(thumbDir, file));
        thumbnailStats.size += stats.size;
      }
    });
    
    // 转换为MB
    thumbnailStats.sizeMB = (thumbnailStats.size / (1024 * 1024)).toFixed(2);
  } catch (err) {
    console.error('获取缩略图统计信息时出错:', err);
  }

  // 发送简单的HTML页面
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RAINDROP213 - 管理</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { padding: 20px; }
        .card { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="mb-4">RAINDROP213 管理</h1>
        
        <div class="card">
          <div class="card-header">缩略图管理</div>
          <div class="card-body">
            <p>缩略图目录: ${thumbDir}</p>
            <p>缩略图数量: ${thumbnailStats.count}</p>
            <p>缩略图总大小: ${thumbnailStats.sizeMB} MB</p>
            
            <button id="clearThumbnails" class="btn btn-warning">清理所有缩略图</button>
            <div id="result" class="mt-3"></div>
          </div>
        </div>
        
        <a href="/" class="btn btn-primary">返回首页</a>
      </div>
      
      <script>
        document.getElementById('clearThumbnails').addEventListener('click', function() {
          if (confirm('确定要清理所有缩略图吗？这将删除所有缩略图文件，它们会在需要时重新生成。')) {
            fetch('/api/admin/clear-thumbnails')
              .then(response => response.json())
              .then(data => {
                document.getElementById('result').innerHTML = 
                  '<div class="alert alert-success">' + data.message + '</div>';
                // 2秒后刷新页面
                setTimeout(() => location.reload(), 2000);
              })
              .catch(error => {
                document.getElementById('result').innerHTML = 
                  '<div class="alert alert-danger">清理失败: ' + error.message + '</div>';
              });
          }
        });
      </script>
    </body>
    </html>
  `);
});

// 处理SPA路由
app.get('*', (req, res) => {
  // 如果是根路径，重定向到/books
  // if (req.path === '/') {
  //   return res.redirect('/books');
  // }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 当应用关闭时关闭数据库连接和取消定时任务
process.on('SIGINT', () => {
  if (dailyJob) {
    dailyJob.cancel();
    console.log('已取消定时任务');
  }
  
  db.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});