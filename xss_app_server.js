const fs = require("fs");
const path = require("path");
const http = require("http");
const querystring = require("querystring");

// xss cross site scripting 跨站脚本攻击

var username = "",
    email = "";

// 用chrome测试时发现用"<script>alert('123')</script>"作为username，会被设置成"<\script>alert('123')<\/script>"
// 所以让script直接执行这招行不通
// 用`<div onclick='xxx'>点我领取红包</div>`作为username,可以触发攻击，但前提时用户要被引诱点击
// 用`<img src="http://127.0.0.1:8081/xxx.jpg" onerror="alert('xss')">` 可以直接触发，不用点击了

function filterXss(str){
    var s = "";
    if(str.length == 0) return "";
    s = str.replace(/&/g,"&amp;");
    s = s.replace(/</g,"&lt;");
    s = s.replace(/>/g,"&gt;");
    s = s.replace(/ /g,"&nbsp;");
    s = s.replace(/\'/g,"&#39;");
    s = s.replace(/\"/g,"&quot;");
    return s; 
}

http.createServer((req, res) => {
    console.log("receive req ", req.url);
    const checkLogin = function (req) {
        const { login } = querystring.parse(req.headers.cookie) || {};
        return login === "123";
    };
    if (req.url.includes("/xss")) {
        const html = fs.readFileSync(path.resolve(__dirname, "xss.html"));
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write(html);
        res.end();
        return;
    }
    if (req.url === "/login") {
        res.writeHead(200, { "Set-Cookie": "login=123" });
        // 设置httpOnly 让xss攻击无法读取cookie
        // res.writeHead(200, { "Set-Cookie": "login=123; HttpOnly" });
        res.end("login success");
        return;
    }
    if (req.url === "/userinfo") {
        if (checkLogin(req)) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({ msg: "success", data: { username, email } })
            );
        } else {
            res.writeHead(401);
            res.end("please login first");
        }
    }
    if (req.url === "/update") {
        if (checkLogin(req)) {
            var body = "";
            req.on("data", function (chunk) {
                body += chunk;
            });
            req.on("end", function () {
                var data = querystring.parse(body);
                ({ username, email } = data);
                // 对用户输入做编码防止xss攻击
                username = filterXss(data.username);
                email = filterXss(data.email);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        msg: "success",
                        data: { username, email },
                    })
                );
            });
        } else {
            res.writeHead(401);
            res.end("please login first");
        }
    }
}).listen(8082);
