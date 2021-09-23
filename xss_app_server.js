const fs = require("fs");
const path = require("path");
const http = require("http");
const querystring = require("querystring");

var username = "",
    email = "";

// 用chrome测试时发现用"<script>alert('123')</script>"作为username，会被设置成"<\script>alert('123')<\/script>"
// 所以让script直接执行这招行不通
// 用`<div onclick='xxx'>点我领取红包</div>`作为username,可以触发攻击，但前提时用户要被引诱点击

// xss cross site scripting 跨站脚本攻击
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
                ({ username, email } = querystring.parse(body));
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
