# Usage

<!--introduced_in=v0.10.0-->
<!--type=misc-->

`node [options] [v8 options] [script.js | -e "script" | - ] [arguments]`

可查看[命令行选项]文档，了解更多使用 Node.js 运行脚本的选项与方法。


## Example

例子，一个使用 Node.js 编写的 [web服务器]，响应返回 `'Hello World'`：

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`服务器运行在 http://${hostname}:${port}/`);
});
```

要运行这个服务器，需将代码保存到一个名为 `example.js` 的文件，并使用 Node.js 执行：

```txt
$ node example.js
服务器运行在 http://127.0.0.1:3000/
```

文档中所有例子都可以用类似的方法运行。

[Command Line Options]: cli.html#cli_command_line_options
[web server]: http.html

[命令行选项]: cli.html#cli_command_line_options
[web服务器]: http.html
