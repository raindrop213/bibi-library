const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const config = require('./config');
const fs = require('fs');

const app = express();
const PORT = config.port || 3000;

// 启用CORS
if (config.enableCors) {
  app.use(cors());
}

// 提供静态文件
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));

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
    default:
      orderBy = section === 'discover' ? 'RANDOM()' : 'books.timestamp DESC';
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
        epub_url: `/api/books/${book.id}/epub`
      };
      
      res.json(bookInfo);
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
      
      // 发送文件
      res.sendFile(coverPath);
    });
  });
});

// 获取书籍EPUB文件
app.get('/api/books/:id/epub', (req, res) => {
  const bookId = req.params.id;
  
  // 查询书籍路径和标题
  db.get('SELECT path, title FROM books WHERE id = ?', [bookId], (err, book) => {
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
      
      const epubPath = path.join(bookDir, epubFile);
      
      // 设置文件名
      const filename = encodeURIComponent(epubFile);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/epub+zip');
      
      // 发送文件
      res.sendFile(epubPath);
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
    
    res.json({ languages: rows });
  });
});

// 处理SPA路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 当应用关闭时关闭数据库连接
process.on('SIGINT', () => {
  db.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});