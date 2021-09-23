const http = require("http");
const querystring = require("querystring");

let data = 456;

// csrf 攻击 跨站请求伪造
// cross site request forgecy
http.createServer((req, res) => {
    console.log("-----------------------------");
    console.log(new Date().toISOString(), "receive a req:", req.url);
    console.log("headers:", req.headers);
    // 现在同域下登录，种下cookie，再在其他域名下请求该接口，cookie会自动带上
    if (req.url === "/login") {
        res.writeHead(200, {
            // 跨域时 set cookie 不会生效
            "Set-Cookie": "login=123",
            "Access-Control-Allow-Origin": "http://127.0.0.1:8080",
        });
        res.end("login success");
    }
    const { login } = querystring.parse(req.headers.cookie) || {};
    console.log("request data with login info:", login);
    // 获取数据
    if (req.url === "/data") {
        if (login === "123") {
            // 已登录
            res.writeHead(200, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ msg: "success", data }));
        } else {
            // 未登录
            res.writeHead(401, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ msg: "please login first" }));
        }
    } else if (req.url === "/update") {
        // 通过referer防止xsrf攻击
        if (req.headers.referer !== "http://127.0.0.1:8081") {
            console.log("xscf attack from " + req.headers.referer);
            res.writeHead(403, {});
            res.end("not allowed");
        }
        // 修改数据
        if (req.method !== "POST") {
            res.writeHead(400, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ msg: "request method is not post" }));
        }
        if (login === "123") {
            var body = "";
            req.on("data", function (chunk) {
                body += chunk;
            });
            req.on("end", function () {
                data = body;
                // 已登录
                res.writeHead(200, {
                    "Content-Type": "application/json",
                });
                res.end(JSON.stringify({ msg: "success", data }));
            });
        } else {
            // 未登录
            res.writeHead(401, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ msg: "please login first" }));
        }
    }
}).listen(8081);
