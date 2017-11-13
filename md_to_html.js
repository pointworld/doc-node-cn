const fs = require('fs')
const path = require('path')
const marked = require('marked')

// 1. 获取 /src/md 文件夹下的 md 文件的文件名
// 2. 将 md 文件的文件名添加到一个空数组中
// 3. 遍历数组的每一个元素，实现将每一个 md 文件转换为 html 文件，并输出到指定的目录

function md_to_html(e) {
    let fileArr = ['_toc', 'assert', 'async_hooks', 'buffer', 'addons', 'child_process', 'cli', 'cluster', 'console', 'crypto', 'debugger', 'deprecations', 'dgram', 'dns', 'documentation', 'errors', 'events', 'fs', 'globals', 'http', 'http2', 'https', 'inspector', 'intl', 'modules', 'n-api', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'synopsis', 'timers', 'tls', 'tracing', 'tty', 'url', 'util', 'v8', 'vm', 'web', 'zlib']
    let target_md, target_html

    for (let i = 0, len = fileArr.length; i < len; i++) {

        target_md = path.join(__dirname, './src/md/' + fileArr[i] + '.md')// 接收需要转换的文件路径
        target_html = path.join(__dirname, './src/html', fileArr[i] + '.html')

        if (e && e.path !== target_md) continue

        console.log(target_md)

        let template = `
<!DOCTYPE html>
<html id="maincontent">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" type="text/css" href="css/api.css">
</head>
<body class="alt apidoc" id="api-section-${fileArr[i]}">
    <div id="content" class="clearfix">
        {{{index}}}
        <div id="column1" class='vs interior' data-id="${fileArr[i]}">
            <div id="apicontent">
                {{{content}}}
            </div>
        </div>
    </div>    
</body>
<script src="js/all.js"></script>
</html>
`

        let content = fs.readFileSync(target_md, 'utf8')
        let html = marked(content)
        let index = fs.readFileSync(path.join('./src/html/__toc.html'), 'utf8')
        html = template
            .replace('{{{content}}}', html)
            .replace('{{{index}}}', index)

        fs.writeFileSync(target_html, html, 'utf8')
    }
}

module.exports = md_to_html
