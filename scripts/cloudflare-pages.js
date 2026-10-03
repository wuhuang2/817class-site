/* global hexo */

'use strict';

/**
 * 把 Cloudflare Pages 的配置文件复制到输出目录。
 *
 * 背景：Hexo 会忽略 source/ 下划线开头的文件（视为特殊文件而非静态资源），
 * 所以 source/_headers 不会自动复制到 public/。这里用 after_generate
 * 钩子手动复制。
 *
 * 参考: https://developers.cloudflare.com/pages/configuration/headers/
 */

const fs = require('fs');
const path = require('path');

const FILES = ['_headers', '_redirects'];

hexo.extend.filter.register('after_generate', function () {
  const src = hexo.source_dir;
  const dest = hexo.public_dir;

  FILES.forEach(function (name) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (!fs.existsSync(from)) return;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    hexo.log.info('Copied: %s', name);
  });
});
