/**
 * 本地静态预览服务器 —— 模拟 Cloudflare Pages / Nginx 的生产行为
 *
 * 与 hexo-server 的关键区别：
 *   - 未知路径返回 404 状态码，并**渲染 404.html 的内容**
 *     （hexo-server 只回纯文本 "Cannot GET /xxx"，无法验证 404 页面）
 *   - 目录自动补 index.html，与生产环境一致
 *
 * 用法:  node serve-404.js [端口]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = parseInt(process.argv[2], 10) || 4400;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** 把 URL 路径安全地映射到 ROOT 下的真实文件，阻止 ../ 越界 */
function resolveSafe(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.join(ROOT, path.normalize(decoded));
  if (!target.startsWith(ROOT)) return null;   // 越界
  return target;
}

const server = http.createServer((req, res) => {
  let target = resolveSafe(req.url);
  if (!target) return send(res, 403, '<h1>403 Forbidden</h1>');

  // 目录 -> index.html
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  // 无扩展名且存在同名目录 -> 目录下的 index.html
  if (!fs.existsSync(target) && fs.existsSync(target + '.html')) {
    target += '.html';
  }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    const ext = path.extname(target).toLowerCase();
    const body = fs.readFileSync(target);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': body.length,
    });
    return res.end(body);
  }

  // ---- 未找到：渲染 404.html，返回 404 状态码（生产环境行为）----
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) {
    const body = fs.readFileSync(notFound);
    res.writeHead(404, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': body.length,
    });
    return res.end(body);
  }
  send(res, 404, '<h1>404 Not Found</h1>');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  静态预览服务器已启动（模拟生产环境 404 行为）');
  console.log('  ------------------------------------------------');
  console.log(`  首页      http://localhost:${PORT}/`);
  console.log(`  404 测试  http://localhost:${PORT}/does-not-exist`);
  console.log('');
  console.log('  按 Ctrl+C 停止');
  console.log('');
});
