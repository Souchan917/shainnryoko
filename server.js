const http = require('http');
const fs = require('fs');
const path = require('path');

// CORSヘッダーを設定する簡易サーバー
const server = http.createServer((req, res) => {
  // リクエストのURLからファイルパスを取得
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // ファイルの拡張子を取得
  const extname = String(path.extname(filePath)).toLowerCase();
  
  // MIMEタイプのマッピング
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  // MIMEタイプを取得
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // ファイルを読み込む
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // ファイルが見つからない場合
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
      } else {
        // サーバーエラーの場合
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // ファイルが見つかった場合
      // CORSヘッダーを設定
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      });
      res.end(content, 'utf-8');
    }
  });
});

// ポート8080でサーバーを起動
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 