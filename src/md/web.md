# web framework
## Express
### 简介
Express 是第一代最流行的 web 框架，它对 Node.js 的http进行了封装。

使用：
```js
let express = require('express');
let app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
```

虽然 Express 的 API 很简单，但是它是基于 ES5 的语法，要实现异步代码，只有一个方法：回调。如果异步嵌套层次过多，代码写起来就非常难看：

```js
app.get('/test', function (req, res) {
    fs.readFile('/file1', function (err, data) {
        if (err) {
            res.status(500).send('read file1 error');
        }
        fs.readFile('/file2', function (err, data) {
            if (err) {
                res.status(500).send('read file2 error');
            }
            res.type('text/plain');
            res.send(data);
        });
    });
});
```
虽然可以用 async 这样的库来组织异步代码，但是用回调写异步实在是太痛苦了！


## koa1
和 Express 相比，koa 1.0 使用 generator 实现异步，代码看起来像同步的：
```js
let koa = require('koa');
let app = koa();

app.use('/test', function *() {
    yield doReadFile1();
    let data = yield doReadFile2();
    this.body = data;
});

app.listen(3000);
```

用 generator 实现异步比回调简单了不少，但是 generator 的本意并不是异步。Promise 才是为异步设计的，但是 Promise 的写法……想想就复杂。为了简化异步代码，ES7（目前是草案，还没有发布）引入了新的关键字 `async` 和 `await`，可以轻松地把一个 function 变为异步模式：

```js
async function() {
    let data = await fs.read('/file1');
}
```

这是JavaScript未来标准的异步代码，非常简洁，并且易于使用。


## koa2

koa2 完全使用 Promise 并配合 `async` 来实现异步。

koa2 的代码看上去像这样：
```js
app.use(async (ctx, next) => {
    await next();
    let data = await doReadFile();
    ctx.response.type = 'text/plain';
    ctx.response.body = data;
});
```

出于兼容性考虑，目前 koa 2 仍支持 generator 的写法，但下一个版本将会去掉。

### 创建 koa2 工程
- 首先，创建一个目录 hello-koa 并作为工程目录
- 创建 `app.js`，输入以下代码：
```js
// 在koa2中，导入的是一个 class，因此用大写的 Koa 表示
const Koa = require('koa');

// 创建一个 Koa 对象表示 web app 本身
const app = new Koa();

// 参数 ctx 是一个对象，由 koa 传入，封装了 request 和 response
// 参数 next 是 koa 传入的将要处理的下一个异步函数
// 由 async 标记的函数称为异步函数，在异步函数中，可以用 await 调用另一个异步函数
app.use(async (ctx, next) => {
    await next();

    ctx.response.type = 'text/html';
    ctx.response.body = '<h1>Hello, koa2!</h1>';
});

app.listen(3000);
console.log('app started at port 3000...');
```

- koa的执行逻辑
每收到一个 `http` 请求，koa就会调用通过 `app.use()` 注册的 `async` 函数，并传入 `ctx` 和 `next` 参数。

我们可以对 `ctx` 操作，并设置返回内容。但是为什么要调用 `await next()`？

原因是 koa 把很多 `async` 函数组成一个处理链，每个 `async` 函数都可以做一些自己的事情，然后用 `await next()` 来调用下一个 `async` 函数。我们把每个 `async` 函数称为 `middleware`，这些 `middleware` 可以组合起来，完成很多有用的功能。

 例如，可以用以下3个 `middleware` 组成处理链，依次打印日志，记录处理时间，输出 HTML：
 ```js
 // 打印 URL
 app.use(async (ctx, next) => {
 console.log(`${ctx.request.method} ${ctx.request.url}`); 
 await next(); // 调用下一个 middleware
 });

 // 打印耗费时间
 app.use(async (ctx, next) => {
 const start = new Date().getTime(); // 当前时间
 await next(); // 调用下一个 middleware
 const ms = new Date().getTime() - start; // 耗费时间
 console.log(`Time: ${ms}ms`); 
 });

 // 输出HTML
 app.use(async (ctx, next) => {
 await next();
 ctx.response.type = 'text/html';
 ctx.response.body = '<h1>Hello, koa2!</h1>';
 });
```
 
 `middleware` 的顺序很重要，也就是调用 `app.use()` 的顺序决定了 `middleware` 的顺序。

 此外，如果一个 `middleware` 没有调用 `await next()`，会怎么办？答案是后续的 `middleware` 将不再执行了。这种情况也很常见，例如，一个检测用户权限的 `middleware` 可以决定是否继续处理请求，还是直接返回 `403错误`：
```js
 app.use(async (ctx, next) => {
 if (await checkUserPermission(ctx)) {
 await next();
 } else {
 ctx.response.status = 403;
 }
 });
```
 
 理解了 `middleware`，我们就已经会用koa了！
 最后注意 `ctx` 对象有一些简写的方法，例如 `ctx.url` 相当于 `ctx.request.url`，`ctx.type` 相当于`ctx.response.type`。

- 在hello-koa这个目录下创建一个 package.json，这个文件描述了我们的hello-koa工程会用到哪些包。

完整的文件内容如下：
```json
{
  "name": "hello-koa2",
  "version": "1.0.0",
  "description": "Hello Koa 2 example with async",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "keywords": [
    "koa",
    "async"
  ],
  "author": "Point",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": ""
  },
  "dependencies": {
    "koa": "2.0.0"
  }
}

```

### 处理 URL
在 hello-koa 工程中，我们处理 http 请求一律返回相同的 HTML，这样虽然非常简单，但是用浏览器一测，随便输入任何 URL 都会返回相同的网页。

正常情况下，我们应该对不同的 URL 调用不同的处理函数，这样才能返回不同的结果。例如像这样写：
```js
app.use(async (ctx, next) => {
    if (ctx.request.path === '/') {
        ctx.response.body = 'index page';
    } else {
        await next();
    }
});

app.use(async (ctx, next) => {
    if (ctx.request.path === '/test') {
        ctx.response.body = 'TEST page';
    } else {
        await next();
    }
});

app.use(async (ctx, next) => {
    if (ctx.request.path === '/error') {
        ctx.response.body = 'ERROR page';
    } else {
        await next();
    }
});
```
这么写是可以运行的，但是好像有点sha。

应该有一个能集中处理 URL 的 middleware，它根据不同的 URL 调用不同的处理函数，这样，我们才能专心为每个 URL 编写处理函数。

#### koa-router

为了处理 URL，我们需要引入 koa-router 这个 middleware，让它负责处理 URL 映射。

我们把上一节的 hello-koa 工程复制一份，重命名为 url-koa。

先在package.json中添加依赖项：`"koa-router": "7.0.0"`，然后用 `npm install` 安装。

接下来，修改 `app.js`，使用 `koa-router` 来处理 `URL`

##### 处理 GET 请求
```js
const Koa = require('koa');

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

const app = new Koa();

// log request URL:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// add url-route:
router.get('/hello/:name', async (ctx, next) => {
    let name = ctx.params.name;
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
});

router.get('/', async (ctx, next) => {
    ctx.response.body = '<h1>Index</h1>';
});

// add router middleware:
app.use(router.routes());

app.listen(3000);
console.log('app started at port 3000...');
```

注意导入 koa-router 的语句最后的 `()` 是函数调用：
```js
const router = require('koa-router')();
```
相当于：
```js
const fn_router = require('koa-router');
const router = fn_router();
```

然后，我们使用 `router.get('/path', async fn)` 来注册一个 `GET` 请求。可以在请求路径中使用带变量的 `/hello/:name`，变量可以通过 `ctx.params.name` 访问。

再运行` app.js`，我们就可以测试不同的 URL：

- 输入首页：`http://localhost:3000/`
- 输入：`http://localhost:3000/hello/koa`

##### 处理 POST 请求
用 `router.get('/path', async fn)` 处理的是 `get` 请求。如果要处理 `post` 请求，可以用 `router.post('/path', async fn)`。

用 `post` 请求处理 `URL` 时，我们会遇到一个问题：`post` 请求通常会发送一个表单，或者 `JSON`，它作为 `request` 的 `body` 发送，但无论是 `Node.js` 提供的原始 `request` 对象，还是 koa 提供的 `request` 对象，都不提供解析 `request` 的 `body` 的功能！

所以，我们又需要引入另一个 `middleware` 来解析原始 `request` 请求，然后，把解析后的参数，绑定到 `ctx.request.body` 中。

`koa-bodyparser` 就是用来干这个活的。

我们在 `package.json` 中添加依赖项：`"koa-bodyparser": "3.2.0"`

然后使用 `npm install`安装。

下面，修改 `app.js`，引入 `koa-bodyparser`：
```js
const bodyParser = require('koa-bodyparser');
```
在合适的位置加上：
```js
app.use(bodyParser());
```
由于 `middleware` 的顺序很重要，这个 `koa-bodyparser` 必须在 `router` 之前被注册到 `app` 对象上。

现在我们就可以处理 `post` 请求了。写一个简单的登录表单：
```js
router.get('/', async (ctx, next) => {
    ctx.response.body = `<h1>Index</h1>
        <form action="/signin" method="post">
            <p>Name: <input name="name" value="koa"></p>
            <p>Password: <input name="password" type="password"></p>
            <p><input type="submit" value="Submit"></p>
        </form>`;
});

router.post('/signin', async (ctx, next) => {
    let
        name = ctx.request.body.name || '',
        password = ctx.request.body.password || '';
    console.log(`signin with name: ${name}, password: ${password}`);
    if (name === 'koa' && password === '12345') {
        ctx.response.body = `<h1>Welcome, ${name}!</h1>`;
    } else {
        ctx.response.body = `<h1>Login failed!</h1>
        <p><a href="/">Try again</a></p>`;
    }
});
```

注意到我们用 `let name = ctx.request.body.name || ''` 拿到表单的 `name` 字段，如果该字段不存在，默认值设置为''。

类似的，`put`、`delete`、`head` 请求也可以由 `router` 处理。

### 重构
##### 处理URL
所有的URL处理函数都放到app.js里显得很乱，而且，每加一个 `URL`，就需要修改 `app.js`。随着`URL`越来越多，`app.js` 就会越来越长。

如果能把 `URL` 处理函数集中到某个 `js` 文件，或者某几个 `js` 文件中就好了，然后让 `app.js` 自动导入所有处理 `URL` 的函数。这样，代码一分离，逻辑就显得清楚了。最好是这样：
```text
url2-koa/
|
+- controllers/
|  |
|  +- login.js <-- 处理login相关URL
|  |
|  +- users.js <-- 处理用户管理相关URL
|
+- app.js <-- 使用koa的js
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

于是我们把 `url-koa` 复制一份，重命名为 `url2-koa`，准备重构这个项目。

我们先在 `controllers` 目录下编写`index.js`：
```js
let fn_index = async (ctx, next) => {
    ctx.response.body = `<h1>Index</h1>
        <form action="/signin" method="post">
            <p>Name: <input name="name" value="koa"></p>
            <p>Password: <input name="password" type="password"></p>
            <p><input type="submit" value="Submit"></p>
        </form>`;
};

let fn_signin = async (ctx, next) => {
    let
        name = ctx.request.body.name || '',
        password = ctx.request.body.password || '';
    console.log(`signin with name: ${name}, password: ${password}`);
    if (name === 'koa' && password === '12345') {
        ctx.response.body = `<h1>Welcome, ${name}!</h1>`;
    } else {
        ctx.response.body = `<h1>Login failed!</h1>
        <p><a href="/">Try again</a></p>`;
    }
};

module.exports = {
    'GET /': fn_index,
    'POST /signin': fn_signin
};
```

这个 `index.js` 通过 `module.exports` 把两个 `URL` 处理函数暴露出来。

类似的，`hello.js` 把一个`URL`处理函数暴露出来：
```js
let fn_hello = async (ctx, next) => {
    let name = ctx.params.name;
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
};

module.exports = {
    'GET /hello/:name': fn_hello
};
```

现在，我们修改 `app.js`，让它自动扫描 `controllers` 目录，找到所有 `js` 文件，导入，然后注册每个 `URL`：
```js
// 先导入fs模块，然后用readdirSync列出文件
// 这里可以用sync是因为启动时只运行一次，不存在性能问题:
let files = fs.readdirSync(__dirname + '/controllers');

// 过滤出.js文件:
let js_files = files.filter((f)=>{
    return f.endsWith('.js');
});

// 处理每个js文件:
for (let f of js_files) {
    console.log(`process controller: ${f}...`);
    // 导入js文件:
    let mapping = require(__dirname + '/controllers/' + f);
    for (let url in mapping) {
        if (url.startsWith('GET ')) {
            // 如果url类似"GET xxx":
            let path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            // 如果url类似"POST xxx":
            let path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else {
            // 无效的URL:
            console.log(`invalid URL: ${url}`);
        }
    }
}
```

如果上面的大段代码看起来还是有点费劲，那就把它拆成更小单元的函数：
```js
function addMapping(router, mapping) {
    for (let url in mapping) {
        if (url.startsWith('GET ')) {
            let path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            let path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else {
            console.log(`invalid URL: ${url}`);
        }
    }
}

function addControllers(router) {
    let files = fs.readdirSync(__dirname + '/controllers');
    let js_files = files.filter((f) => {
        return f.endsWith('.js');
    });

    for (let f of js_files) {
        console.log(`process controller: ${f}...`);
        let mapping = require(__dirname + '/controllers/' + f);
        addMapping(router, mapping);
    }
}

addControllers(router);
```

确保每个函数功能非常简单，一眼能看明白，是代码可维护的关键。

#### Controller Middleware
最后，我们把扫描 `controllers` 目录和创建 `router` 的代码从 `app.js` 中提取出来，作为一个简单的 `middleware` 使用，命名为`controller.js`：
```js
const fs = require('fs');

function addMapping(router, mapping) {
    // ...
}

function addControllers(router, dir) {
    // ...
}

module.exports = function (dir) {
    let
        controllers_dir = dir || 'controllers', // 如果不传参数，扫描目录默认为'controllers'
        router = require('koa-router')();
    addControllers(router, controllers_dir);
    return router.routes();
};
```

这样一来，我们在app.js的代码又简化了：
```js
// ...

// 导入controller middleware:
const controller = require('./controller');

// ...

// 使用middleware:
app.use(controller());

// ...
```

经过重新整理后的工程url2-koa目前具备非常好的模块化，所有处理URL的函数按功能组存放在controllers目录，今后我们也只需要不断往这个目录下加东西就可以了，app.js保持不变。

##

##

# template engine
## 简介
### 定义
> 模板引擎就是基于模板配合数据构造出字符串输出的一个组件。

比如下面的函数就是一个模板引擎：
```js
function examResult (data) {
    return `${data.name}同学一年级期末考试语文${data.chinese}分，数学${data.math}分，位于年级第${data.ranking}名。`
}
```
如果我们输入数据如下：
```js
examResult({
    name: '小明',
    chinese: 78,
    math: 87,
    ranking: 999
});
```

该模板引擎把模板字符串里面对应的变量替换以后，就可以得到以下输出：

`小明同学一年级期末考试语文78分，数学87分，位于年级第999名。`

### 作用
模板引擎最常见的输出就是输出网页，也就是 HTML 文本。当然，也可以输出任意格式的文本，比如 Text，XML，Markdown 等等。

有同学要问了：既然 JavaScript 的模板字符串可以实现模板功能，那为什么我们还需要另外的模板引擎？

因为 JavaScript 的模板字符串必须写在 JavaScript 代码中，要想写出新浪首页这样复杂的页面，是非常困难的。

### 输出 HTML 有几个特别重要的问题需要考虑

#### 转义

对特殊字符要转义，避免受到 *XSS* 攻击。比如，如果变量 `name` 的值不是小明，而是小明 `<script>...</script>`，模板引擎输出的 HTML 到了浏览器，就会自动执行恶意 JavaScript 代码。

#### 格式化

对不同类型的变量要格式化，比如，货币需要变成 `12,345.00` 这样的格式，日期需要变成 `2016-01-01` 这样的格式。

#### 简单逻辑

模板还需要能执行一些简单逻辑，比如，要按条件输出内容，需要 `if` 实现如下输出：
```text
{{ name }}同学，
{% if score >= 90 %}
    成绩优秀，应该奖励
{% elif score >=60 %}
    成绩良好，继续努力
{% else %}
    不及格，建议回家打屁股
{% endif %}
```

所以，我们需要一个功能强大的模板引擎，来完成页面输出的功能。

## Nunjucks
### 简介
Nunjucks 是 Mozilla 开发的一个纯 JavaScript 编写的模板引擎，既可以用在 Node 环境下，又可以运行在浏览器端。但是，主要还是运行在 Node 环境下，因为浏览器端有更好的模板解决方案，例如 *MVVM* 框架。

如果你使用过 Python 的模板引擎 *jinja2*，那么使用 *Nunjucks* 就非常简单，两者的语法几乎是一模一样的，因为 *Nunjucks* 就是用 JavaScript 重新实现了 *jinjia2*。

从上面的例子我们可以看到，虽然模板引擎内部可能非常复杂，但是使用一个模板引擎是非常简单的，因为本质上我们只需要构造这样一个函数：
```js
function render(view, model) {
    // TODO:...
}
```

其中，`view` 是模板的名称（又称为视图），因为可能存在多个模板，需要选择其中一个。`model` 就是数据，在 JavaScript 中，它就是一个简单的 `Object`。`render` 函数返回一个字符串，就是模板的输出。

### 使用
下面我们来使用 `Nunjucks` 这个模板引擎来编写几个 HTML 模板，并且用实际数据来渲染模板并获得最终的 HTML 输出。

我们创建一个 *use-nunjucks* 工程结构如下：
```text
use-nunjucks/
|
+- views/
|  |
|  +- hello.html <-- HTML模板文件
|
+- app.js <-- 入口js
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

其中，模板文件存放在 *views* 目录中。

我们先在 `package.json` 中添加 `nunjucks` 的依赖：`"nunjucks": "2.4.2"`

用 `npm install` 安装所有依赖包。

> 注意，模板引擎是可以独立使用的，并不需要依赖 `koa`。

紧接着，我们要编写使用 `Nunjucks` 的函数`render`。怎么写？方法是查看 `Nunjucks` 的官方文档，仔细阅读后，在 `app.js` 中编写代码如下：
```js
const nunjucks = require('nunjucks');
function createEnv(path, opts) {
    let
        autoescape = opts.autoescape === undefined ? true : opts.autoescape,
        noCache = opts.noCache || false,
        watch = opts.watch || false,
        throwOnUndefined = opts.throwOnUndefined || false,
        env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader('views', {
                noCache: noCache,
                watch: watch,
            }), {
                autoescape: autoescape,
                throwOnUndefined: throwOnUndefined
            });
    if (opts.filters) {
        for (let f in opts.filters) {
            env.addFilter(f, opts.filters[f]);
        }
    }
    return env;
}

let env = createEnv('views', {
    watch: true,
    filters: {
        hex: function (n) {
            return '0x' + n.toString(16);
        }
    }
});
```

变量`env`就表示`Nunjucks`模板引擎对象，它有一个`render(view, model)`方法，正好传入`view`和`model`两个参数，并返回字符串。

创建`env`需要的参数可以查看文档获知。我们用`autoescape = opts.autoescape && true`这样的代码给每个参数加上默认值，最后使用`new nunjucks.FileSystemLoader('views')`创建一个文件系统加载器，从`views`目录读取模板。

我们编写一个`hello.html`模板文件，放到`views`目录下，内容如下：
```html
<h1>Hello {{ name }}</h1>
```
然后，我们就可以用下面的代码来渲染这个模板：
```js
let s = env.render('hello.html', { name: '小明' });
console.log(s);
```

获得输出如下：
```html
<h1>Hello 小明</h1>
```

咋一看，这和使用JavaScript模板字符串没啥区别嘛。不过，试试：
```js
let s = env.render('hello.html', { name: '<script>alert("小明")</script>' });
console.log(s);
```

获得输出如下：
```html
<h1>Hello &lt;script&gt;alert("小明")&lt;/script&gt;</h1>
```

这样就避免了输出恶意脚本。

此外，可以使用`Nunjucks`提供的功能强大的`tag`，编写条件判断、循环等功能，例如：
```html
<!-- 循环输出名字 -->
<body>
    <h3>Fruits List</h3>
    {% for f in fruits %}
    <p>{{ f }}</p>
    {% endfor %}
</body>
```

*Nunjucks* 模板引擎最强大的功能在于模板的继承。仔细观察各种网站可以发现，网站的结构实际上是类似的，头部、尾部都是固定格式，只有中间页面部分内容不同。如果每个模板都重复头尾，一旦要修改头部或尾部，那就需要改动所有模板。

更好的方式是使用继承。先定义一个基本的网页框架base.html：
```html
<html><body>
{% block header %} <h3>Unnamed</h3> {% endblock %}
{% block body %} <div>No body</div> {% endblock %}
{% block footer %} <div>copyright</div> {% endblock %}
</body>
```

`base.html` 定义了三个可编辑的块，分别命名为`header`、`body`和`footer`。子模板可以有选择地对块进行重新定义：
```html
{% extends 'base.html' %}

{% block header %}<h1>{{ header }}</h1>{% endblock %}

{% block body %}<p>{{ body }}</p>{% endblock %}
```

然后，我们对子模板进行渲染：
```js
console.log(env.render('extend.html', {
    header: 'Hello',
    body: 'bla bla bla...'
}));
```

输出HTML如下：
```html
<html><body>
<h1>Hello</h1>
<p>bla bla bla...</p>
<div>copyright</div> <!-- footer没有重定义，所以仍使用父模板的内容 -->
</body>
```

### 性能

最后我们要考虑一下*Nunjucks*的性能。

对于模板渲染本身来说，速度是非常非常快的，因为就是拼字符串嘛，纯*CPU*操作。

性能问题主要出现在从文件读取模板内容这一步。这是一个*IO*操作，在*Node.js*环境中，我们知道，单线程的JavaScript最不能忍受的就是*同步IO*，但*Nunjucks*默认就使用*同步IO*读取模板文件。

好消息是`Nunjucks`会缓存已读取的文件内容，也就是说，模板文件最多读取一次，就会放在内存中，后面的请求是不会再次读取文件的，只要我们指定了`noCache: false`这个参数。

在开发环境下，可以关闭*cache*，这样每次重新加载模板，便于实时修改模板。在生产环境下，一定要打开*cache*，这样就不会有性能问题。

*Nunjucks*也提供了异步读取的方式，但是这样写起来很麻烦，有简单的写法我们就不会考虑复杂的写法。保持代码简单是可维护性的关键。

## Jade(Pug)
[官方文档](https://pugjs.org/zh-cn/api/getting-started.html)
[慕课网](http://www.imooc.com/learn/259)

### Jade 特点
1. 超强的可读性
2. 灵活易用的缩进
3. 块扩展
4. 代码默认经过编码处理，以增强安全性
5. 编译及运行时的上下文错误报告
6. 命令行编译支持
7. HTML5 模式
8. 可选的内存缓存
9. 联合动态的静态标记类
10. 利用过滤器解析树的处理

### Jade 解决的问题
HTML 的巢状嵌套



## EJS

## Swig

# MVC
## 简介
我们已经可以用koa处理不同的URL，还可以用Nunjucks渲染模板。现在，是时候把这两者结合起来了！

当用户通过浏览器请求一个URL时，koa将调用某个异步函数处理该URL。在这个异步函数内部，我们用一行代码：
```js
ctx.render('home.html', { name: 'Michael' });
```
通过Nunjucks把数据用指定的模板渲染成HTML，然后输出给浏览器，用户就可以看到渲染后的页面了。

这就是传说中的 *MVC：Model-View-Controller*，中文名 *模型-视图-控制器*。

- *异步函数是C：Controller*，Controller负责业务逻辑，比如检查用户名是否存在，取出用户信息等等；

- *包含变量`{{ name }}`的模板就是V：View*，View负责显示逻辑，通过简单地替换一些变量，View最终输出的就是用户看到的HTML。

- *上面的例子中，Model就是一个JavaScript对象*：`{ name: 'Michael' }`
Model是用来传给View的，这样View在替换变量的时候，就可以从Model中取出相应的数据。

## 使用
下面，我们根据原来的url2-koa创建工程view-koa，把koa2、Nunjucks整合起来，然后，把原来直接输出字符串的方式，改为`ctx.render(view, model)`的方式。

1. 工程结构
```text
view-koa/
|
+- controllers/ <-- Controller
|
+- views/ <-- html模板文件
|
+- static/ <-- 静态资源文件
|
+- controller.js <-- 扫描注册Controller
|
+- app.js <-- 使用koa的js
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

2. package.json中将要用到的依赖包:
```json
{
    "koa": "2.0.0",
    "koa-bodyparser": "3.2.0",
    "koa-router": "7.0.0",
    "nunjucks": "2.4.2",
    "mime": "1.3.4",
    "mz": "2.4.0"
}
```

先用`npm install`安装依赖包。

3. 准备编写以下两个Controller：

> 处理首页 GET /

我们定义一个async函数处理首页`URL/`：
```j-s
async (ctx, next) => {
    ctx.render('index.html', {
        title: 'Welcome'
    });
}
```

注意到koa并没有在`ctx`对象上提供`render`方法，这里我们假设应该这么使用，这样，我们在编写Controller的时候，最后一步调用`ctx.render(view, model)`就完成了页面输出。

> 处理登录请求 POST /signin

我们再定义一个async函数处理登录请求`/signin`：
```j-s
async (ctx, next) => {
    let
        email = ctx.request.body.email || '',
        password = ctx.request.body.password || '';
    if (email === 'admin@example.com' && password === '123456') {
        // 登录成功:
        ctx.render('signin-ok.html', {
            title: 'Sign In OK',
            name: 'Mr Node'
        });
    } else {
        // 登录失败:
        ctx.render('signin-failed.html', {
            title: 'Sign In Failed'
        });
    }
}
```
由于登录请求是一个POST，我们就用`ctx.request.body.<name>`拿到POST请求的数据，并给一个默认值。

登录成功时我们用`signin-ok.html` 渲染，登录失败时我们用`signin-failed.html` 渲染，所以，我们一共需要以下3个View：
- index.html
- signin-ok.html
- signin-failed.html

4. 编写View

在编写View的时候，我们实际上是在编写HTML页。为了让页面看起来美观大方，使用一个现成的CSS框架是非常有必要的。我们用 [Bootstrap](http://getbootstrap.com/) 这个CSS框架。从首页下载zip包后解压，我们把所有静态资源文件放到`/static`目录下：
```text
view-koa/
|
+- static/
   |
   +- css/ <- 存放bootstrap.css等
   |
   +- fonts/ <- 存放字体文件
   |
   +- js/ <- 存放bootstrap.js等
```

这样我们在编写HTML的时候，可以直接用Bootstrap的CSS，像这样：
```html
<link rel="stylesheet" href="/static/css/bootstrap.css">
```

现在，在使用MVC之前，第一个问题来了，如何处理静态文件？

我们把所有静态资源文件全部放入`/static`目录，目的就是能统一处理静态文件。在koa中，我们需要编写一个middleware，处理以`/static/`开头的URL。

5. 编写middleware

我们来编写一个处理静态文件的middleware。编写middleware实际上一点也不复杂。我们先创建一个`static-files.js`的文件，编写一个能处理静态文件的middleware：
```js
const path = require('path');
const mime = require('mime');
const fs = require('mz/fs');

// url: 类似 '/static/'
// dir: 类似 __dirname + '/static'
function staticFiles(url, dir) {
    return async (ctx, next) => {
        let rpath = ctx.request.path;
        // 判断是否以指定的url开头:
        if (rpath.startsWith(url)) {
            // 获取文件完整路径:
            let fp = path.join(dir, rpath.substring(url.length));
            // 判断文件是否存在:
            if (await fs.exists(fp)) {
                // 查找文件的mime:
                ctx.response.type = mime.lookup(rpath);
                // 读取文件内容并赋值给response.body:
                ctx.response.body = await fs.readFile(fp);
            } else {
                // 文件不存在:
                ctx.response.status = 404;
            }
        } else {
            // 不是指定前缀的URL，继续处理下一个middleware:
            await next();
        }
    };
}

module.exports = staticFiles;

```
`staticFiles`是一个普通函数，它接收两个参数：URL前缀和一个目录，然后返回一个`async`函数。这个`async`函数会判断当前的URL是否以指定前缀开头，如果是，就把URL的路径视为文件，并发送文件内容。如果不是，这个`async`函数就不做任何事情，而是简单地调用`await next()`让下一个middleware去处理请求。

我们使用了一个`mz`的包，并通过`require('mz/fs');`导入。`mz`提供的API和Node.js的`fs`模块完全相同，但fs模块使用回调，而`mz`封装了`fs`对应的函数，并改为Promise。这样，我们就可以非常简单的用`await`调用`mz`的函数，而不需要任何回调。

最后，这个middleware使用起来也很简单，在`app.js`里加一行代码：
```js
let staticFiles = require('./static-files');
app.use(staticFiles('/static/', __dirname + '/static'));
```

6. 集成Nunjucks

集成Nunjucks实际上也是编写一个middleware，这个middleware的作用是给`ctx`对象绑定一个`render(view, model)`的方法，这样，后面的Controller就可以调用这个方法来渲染模板了。

我们创建一个`templating.js`来实现这个middleware：
```js
const nunjucks = require('nunjucks');

function createEnv(path, opts) {
    let
        autoescape = opts.autoescape === undefined ? true : opts.autoescape,
        noCache = opts.noCache || false,
        watch = opts.watch || false,
        throwOnUndefined = opts.throwOnUndefined || false,
        env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(path || 'views', {
                noCache: noCache,
                watch: watch,
            }), {
                autoescape: autoescape,
                throwOnUndefined: throwOnUndefined
            });
    if (opts.filters) {
        for (let f in opts.filters) {
            env.addFilter(f, opts.filters[f]);
        }
    }
    return env;
}

function templating(path, opts) {
    // 创建Nunjucks的env对象:
    let env = createEnv(path, opts);
    return async (ctx, next) => {
        // 给ctx绑定render函数:
        ctx.render = function (view, model) {
            // 把render后的内容赋值给response.body:
            ctx.response.body = env.render(view, Object.assign({}, ctx.state || {}, model || {}));
            // 设置Content-Type:
            ctx.response.type = 'text/html';
        };
        // 继续处理请求:
        await next();
    };
}

module.exports = templating;
```

注意到`createEnv()`函数和前面使用Nunjucks时编写的函数是一模一样的。我们主要关心`tempating()`函数，它会返回一个middleware，在这个middleware中，我们只给`ctx`“安装”了一个`render()`函数，其他什么事情也没干，就继续调用下一个middleware。

使用的时候，我们在`app.js`添加如下代码：
```js
const isProduction = process.env.NODE_ENV === 'production';

app.use(templating('view', {
    noCache: !isProduction,
    watch: !isProduction
}));
```

这里我们定义了一个常量`isProduction`，它判断当前环境是否是production环境。如果是，就使用缓存，如果不是，就关闭缓存。在开发环境下，关闭缓存后，我们修改`View`，可以直接刷新浏览器看到效果，否则，每次修改都必须重启Node程序，会极大地降低开发效率。

Node.js在全局变量process中定义了一个环境变量`env.NODE_ENV`，为什么要使用该环境变量？因为我们在开发的时候，环境变量应该设置为`'development'`，而部署到服务器时，环境变量应该设置为`'production'`。在编写代码的时候，要根据当前环境作不同的判断。

注意：生产环境上必须配置环境变量`NODE_ENV = 'production'`，而开发环境不需要配置，实际上`NODE_ENV`可能是`undefined`，所以判断的时候，不要用`NODE_ENV === 'development'`。

类似的，我们在使用上面编写的处理静态文件的middleware时，也可以根据环境变量判断：
```js
if (! isProduction) {
    let staticFiles = require('./static-files');
    app.use(staticFiles('/static/', __dirname + '/static'));
}
```

这是因为在生产环境下，静态文件是由部署在最前面的反向代理服务器（如Nginx）处理的，Node程序不需要处理静态文件。而在开发环境下，我们希望koa能顺带处理静态文件，否则，就必须手动配置一个反向代理服务器，这样会导致开发环境非常复杂。

7. 编写View

在编写View的时候，非常有必要先编写一个`base.html`作为骨架，其他模板都继承自`base.html`，这样，才能大大减少重复工作。

编写HTML不在本教程的讨论范围之内。这里我们参考Bootstrap的官网简单编写了`base.html`。

8. 运行

一切顺利的话，这个view-koa工程应该可以顺利运行。运行前，我们再检查一下`app.js`里的middleware的顺序：

第一个middleware是记录URL以及页面执行时间：
```js
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    let
        start = new Date().getTime(),
        execTime;
    await next();
    execTime = new Date().getTime() - start;
    ctx.response.set('X-Response-Time', `${execTime}ms`);
});
```

第二个middleware处理静态文件：
```js
if (! isProduction) {
    let staticFiles = require('./static-files');
    app.use(staticFiles('/static/', __dirname + '/static'));
}
```

第三个middleware解析POST请求：
```js
app.use(bodyParser());
```

第四个middleware负责给ctx加上render()来使用Nunjucks：
```js
app.use(templating('view', {
    noCache: !isProduction,
    watch: !isProduction
}));
```

最后一个middleware处理URL路由：
```js
app.use(controller());
```

现在，运行代码，不出意外的话，
- 在浏览器输入`localhost:3000/`，可以看到首页内容
- 直接在首页登录，如果输入正确的Email和Password，进入登录成功的页面
- 如果输入的Email和Password不正确，进入登录失败的页面

怎么判断正确的Email和Password？目前我们在`signin.js`中是这么判断的：
```js
if (email === 'admin@example.com' && password === '123456') {
    //...
}
```

当然，真实的网站会根据用户输入的Email和Password去数据库查询并判断登录是否成功，不过这需要涉及到Node.js环境如何操作数据库，我们后面再讨论。

9. 扩展

注意到`ctx.render`内部渲染模板时，Model对象并不是传入的model变量，而是：
```js
Object.assign({}, ctx.state || {}, model || {})
```

这个小技巧是为了扩展。

首先，`model || {}`确保了即使传入`undefined`，model也会变为默认值`{}`。`Object.assign()`会把除第一个参数外的其他参数的所有属性复制到第一个参数中。第二个参数是`ctx.state || {}`，这个目的是为了能把一些公共的变量放入`ctx.state`并传给View。

例如，某个middleware负责检查用户权限，它可以把当前用户放入`ctx.state`中：
```js
app.use(async (ctx, next) => {
    let user = tryGetUserFromCookie(ctx.request);
    if (user) {
        ctx.state.user = user;
        await next();
    } else {
        ctx.response.status = 403;
    }
});
```

这样就没有必要在每个Controller的`async`函数中都把`user`变量放入model中。


# 数据库
## 简介
程序运行的时候，数据都是在内存中的。当程序终止的时候，通常都需要将数据保存到磁盘上，无论是保存到本地磁盘，还是通过网络保存到服务器上，最终都会将数据写入磁盘文件。

### 定义数据存储格式
而如何定义数据的存储格式就是一个大问题。如果我们自己来定义存储格式，比如保存一个班级所有学生的成绩单：
1. 表格形式

| name    | grade |
| :---:   | :---: |
| Michael | 99    |
| Bob     | 85    |
| Bart    | 59    |
| Lisa    | 87    |

2. 文本格式
```text
Michael,99
Bob,85
Bart,59
Lisa,87
```
3. JSON 格式
```json
[
    {"name":"Michael","score":99},
    {"name":"Bob","score":85},
    {"name":"Bart","score":59},
    {"name":"Lisa","score":87}
]
```

4. 还可以定义各种保存格式

### 存在问题

存储和读取需要自己实现，JSON还是标准，自己定义的格式就各式各样了；

不能做快速查询，只有把数据全部读到内存中才能自己遍历，但有时候数据的大小远远超过了内存（比如蓝光电影，40GB的数据），根本无法全部读入内存。

### 数据库（Database）
为了便于程序保存和读取数据，而且，能直接通过条件快速查询到指定的数据，就出现了数据库（Database）这种专门用于集中存储和查询的软件。

数据库软件诞生的历史非常久远，早在1950年数据库就诞生了。经历了网状数据库，层次数据库，我们现在广泛使用的关系数据库是20世纪70年代基于关系模型的基础上诞生的。

关系模型有一套复杂的数学理论，但是从概念上是十分容易理解的。

在关系数据库中，基于表（Table）的一对多的关系就是关系数据库的基础。

#### 数据库类别
既然我们要使用关系数据库，就必须选择一个关系数据库。目前广泛使用的关系数据库也就这么几种：

1. 付费的闭源商用数据库：
    1. Oracle，典型的高富帅；
    2. SQL Server，微软自家产品，Windows定制专款；
    3. DB2，IBM的产品，听起来挺高端；
    4. Sybase，曾经跟微软是好基友，后来关系破裂，现在家境惨淡。


2. 免费的开源数据库：
    1. MySQL，大家都在用，一般错不了；
    2. PostgreSQL，学术气息有点重，其实挺不错，但知名度没有MySQL高；
    3. sqlite，嵌入式数据库，适合桌面和移动应用。

作为一个JavaScript全栈工程师，选择哪个免费数据库呢？当然是MySQL。因为MySQL普及率最高，出了错，可以很容易找到解决方法。而且，围绕MySQL有一大堆监控和运维的工具，安装和使用很方便。




## MySQL
### MySQL 的使用
#### 安装 MySQL
#### 访问 MySQL
访问MySQL数据库只有一种方法，就是通过网络发送SQL命令，然后，MySQL服务器执行后返回结果。

我们可以在命令行窗口输入`mysql -u root -p`，然后输入root口令后，就连接到了MySQL服务器。因为没有指定`--host`参数，所以我们连接到的是`localhost`，也就是本机的MySQL服务器。

#### 操作 MySQL



## MongoDB
Mongodb，分布式文档存储数据库，由C++语言编写，旨在为WEB应用提供可扩展的高性能数据存储解决方案。MongoDB是一个高性能，开源，无模式的文档型数据库，是当前NoSql数据库中比较热门的一种。它在许多场景下可用于替代传统的关系型数据库或键/值存储方式。Mongo使用C++开发。


# ORM 框架
ORM：Object-Relational Mapping
## 简介
如果直接使用mysql包提供的接口，我们编写的代码就比较底层，例如，查询代码：
```js
connection.query('SELECT * FROM users WHERE id = ?', ['123'], function(err, rows) {
    if (err) {
        // error
    } else {
        for (let row in rows) {
            processRow(row);
        }
    }
});
```

考虑到数据库表是一个二维表，包含多行多列，例如一个pets的表：
```text
mysql> select * from pets;
+----+--------+------------+
| id | name   | birth      |
+----+--------+------------+
|  1 | Gaffey | 2007-07-07 |
|  2 | Odie   | 2008-08-08 |
+----+--------+------------+
2 rows in set (0.00 sec)
```

每一行可以用一个JavaScript对象表示，例如第一行：
```json
{
    "id": 1,
    "name": "Gaffey",
    "birth": "2007-07-07"
}
```

这就是传说中的*ORM技术：Object-Relational Mapping*，把关系数据库的表结构映射到对象上。是不是很简单？

但是由谁来做这个转换呢？所以ORM框架应运而生。

## Sequelize
### 访问 MySQL
当我们安装好MySQL后，Node.js程序如何访问MySQL数据库呢？

对于Node.js程序，访问MySQL也是通过网络发送SQL命令给MySQL服务器。这个访问MySQL服务器的软件包通常称为MySQL驱动程序。不同的编程语言需要实现自己的驱动，MySQL官方提供了Java、.Net、Python、Node.js、C++和C的驱动程序，官方的Node.js驱动目前仅支持5.7以上版本，而我们上面使用的命令行程序实际上用的就是C驱动。

目前使用最广泛的MySQL Node.js驱动程序是开源的`mysql`，可以直接使用npm安装。
我们选择Node的ORM框架Sequelize来操作数据库。这样，我们读写的都是JavaScript对象，Sequelize帮我们把对象变成数据库中的行。

用Sequelize查询`pets`表，代码像这样：
```js
Pet.findAll()
   .then(function (pets) {
       for (let pet in pets) {
           console.log(`${pet.id}: ${pet.name}`);
       }
   }).catch(function (err) {
       // error
   });
```

因为Sequelize返回的对象是Promise，所以我们可以用`then()`和`catch()`分别异步响应成功和失败。

但是用`then()`和`catch()`仍然比较麻烦。有没有更简单的方法呢？

可以用ES7的`await`来调用任何一个Promise对象，这样我们写出来的代码就变成了：
```js
let pets = await Pet.findAll();
```

真的就是这么简单！

`await`只有一个限制，就是必须在`async`函数中调用。上面的代码直接运行还差一点，我们可以改成：
```js
(async () => {
    let pets = await Pet.findAll();
})();
```

考虑到koa的处理函数都是`async`函数，所以我们实际上将来在koa的`async`函数中直接写`await`访问数据库就可以了！

这也是为什么我们选择Sequelize的原因：只要API返回Promise，就可以用`await`调用，写代码就非常简单！

### 实战
在使用Sequlize操作数据库之前，我们先在MySQL中创建一个表来测试。我们可以在test数据库中创建一个pets表。test数据库是MySQL安装后自动创建的用于测试的数据库。在MySQL命令行执行下列命令：
```MySQL
grant all privileges on test.* to 'www'@'%' identified by 'www';

use test;

create table pets (
    id letchar(50) not null,
    name letchar(100) not null,
    gender bool not null,
    birth letchar(10) not null,
    createdAt bigint not null,
    updatedAt bigint not null,
    version bigint not null,
    primary key (id)
) engine=innodb;
```

- 第一条`grant`命令是创建MySQL的用户名和口令，均为`www`，并赋予操作`test`数据库的所有权限。
- 第二条`use`命令把当前数据库切换为`test`。
- 第三条命令创建了`pets`表。

然后，我们根据前面的工程结构创建hello-sequelize工程，结构如下：
```text
hello-sequelize/
|
+- init.txt <-- 初始化SQL命令
|
+- config.js <-- MySQL配置文件
|
+- app.js <-- 使用koa的js
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

然后，添加如下依赖包：
```json
{
    "sequelize": "3.24.1",
    "mysql": "2.11.1"
}
```

注意mysql是驱动，我们不直接使用，但是sequelize会用。

用`npm install`安装。

`config.js`实际上是一个简单的配置文件：
```js
let config = {
    database: 'test', // 使用哪个数据库
    username: 'www', // 用户名
    password: 'www', // 口令
    host: 'localhost', // 主机名
    port: 3306 // 端口号，MySQL默认3306
};

module.exports = config;
```

下面，我们就可以在`app.js`中操作数据库了。使用Sequelize操作MySQL需要先做两件准备工作：

第一步，创建一个sequelize对象实例：
```js
const Sequelize = require('sequelize');
const config = require('./config');

let sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    }
});
```

第二步，定义模型Pet，告诉Sequelize如何映射数据库表：
```js
let Pet = sequelize.define('pet', {
    id: {
        type: Sequelize.STRING(50),
        primaryKey: true
    },
    name: Sequelize.STRING(100),
    gender: Sequelize.BOOLEAN,
    birth: Sequelize.STRING(10),
    createdAt: Sequelize.BIGINT,
    updatedAt: Sequelize.BIGINT,
    version: Sequelize.BIGINT
}, {
        timestamps: false
    });
```

用`sequelize.define()`定义Model时，传入名称`pet`，默认的表名就是`pets`。第二个参数指定列名和数据类型，如果是主键，需要更详细地指定。第三个参数是额外的配置，我们传入`{ timestamps: false }`是为了关闭Sequelize的自动添加timestamp的功能。所有的ORM框架都有一种很不好的风气，总是自作聪明地加上所谓“自动化”的功能，但是会让人感到完全摸不着头脑。

接下来，我们就可以往数据库中塞一些数据了。我们可以用Promise的方式写：
```js
let now = Date.now();

Pet.create({
    id: 'g-' + now,
    name: 'Gaffey',
    gender: false,
    birth: '2007-07-07',
    createdAt: now,
    updatedAt: now,
    version: 0
}).then(function (p) {
    console.log('created.' + JSON.stringify(p));
}).catch(function (err) {
    console.log('failed: ' + err);
});
```

也可以用`await`写：
```js
(async () => {
    let dog = await Pet.create({
        id: 'd-' + now,
        name: 'Odie',
        gender: false,
        birth: '2008-08-08',
        createdAt: now,
        updatedAt: now,
        version: 0
    });
    console.log('created: ' + JSON.stringify(dog));
})();
```

显然`await`代码更胜一筹。

查询数据时，用`await`写法如下：
```js
(async () => {
    let pets = await Pet.findAll({
        where: {
            name: 'Gaffey'
        }
    });
    console.log(`find ${pets.length} pets:`);
    for (let p of pets) {
        console.log(JSON.stringify(p));
    }
})();
```

如果要更新数据，可以对查询到的实例调用`save()`方法：
```js
(async () => {
    let p = await queryFromSomewhere();
    p.gender = true;
    p.updatedAt = Date.now();
    p.version ++;
    await p.save();
})();
```

如果要删除数据，可以对查询到的实例调用destroy()方法：
```js
(async () => {
    let p = await queryFromSomewhere();
    await p.destroy();
})();
```

运行代码，可以看到Sequelize打印出的每一个SQL语句，便于我们查看：
```text
Executing (default): INSERT INTO `pets` (`id`,`name`,`gender`,`birth`,`createdAt`,`updatedAt`,`version`) VALUES ('g-1471961204219','Gaffey',false,'2007-07-07',1471961204219,1471961204219,0);
```

### Model

我们把通过`sequelize.define()`返回的`Pet`称为*Model*，它表示一个*数据模型*。

我们把通过`Pet.findAll()`返回的一个或一组对象称为*Model实例*，每个实例都可以直接通过`JSON.stringify`序列化为JSON字符串。但是它们和普通JSON对象相比，多了一些由Sequelize添加的方法，比如`save()`和`destroy()`。调用这些方法我们可以执行更新或者删除操作。

### 使用Sequelize操作数据库的一般步骤
- 首先，通过某个Model对象的`findAll()`方法获取实例；
- 如果要更新实例，先对实例属性赋新值，再调用`save()`方法；
- 如果要删除实例，直接调用`destroy()`方法。

注意`findAll()`方法可以接收`where`、`order`这些参数，这和将要生成的SQL语句是对应的。


## 建立Model
直接使用Sequelize虽然可以，但是存在一些问题。
### 直接使用 Sequelize 的问题
团队开发时，有人喜欢自己加timestamp：
```js
var Pet = sequelize.define('pet', {
    id: {
        type: Sequelize.STRING(50),
        primaryKey: true
    },
    name: Sequelize.STRING(100),
    createdAt: Sequelize.BIGINT,
    updatedAt: Sequelize.BIGINT
}, {
        timestamps: false
    });
```

有人又喜欢自增主键，并且自定义表名：
```js
var Pet = sequelize.define('pet', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: Sequelize.STRING(100)
}, {
        tableName: 't_pet'
    });
```

一个大型Web App通常都有几十个映射表，一个映射表就是一个Model。如果按照各自喜好，那业务代码就不好写。Model不统一，很多代码也无法复用。

所以我们需要一个统一的模型，强迫所有Model都遵守同一个规范，这样不但实现简单，而且容易统一风格。

### Model

1. 我们首先要定义的就是Model存放的文件夹必须在models内，并且以Model名字命名，例如：`Pet.js`，`User.js`等等。

2. 其次，每个Model必须遵守一套规范：

统一主键，名称必须是`id`，类型必须是`STRING(50)`；
主键可以自己指定，也可以由框架自动生成（如果为`null`或`undefined`）；
所有字段默认为`NOT NULL`，除非显式指定；
统一timestamp机制，每个Model必须有`createdAt`、`updatedAt`和`version`，分别记录创建时间、修改时间和版本号。其中，`createdAt`和`updatedAt`以`BIGINT`存储时间戳，最大的好处是无需处理时区，排序方便。`version`每次修改时自增。
所以，我们不要直接使用Sequelize的API，而是通过db.js间接地定义Model。例如，`User.js`应该定义如下：
```js
const db = require('../db');

module.exports = db.defineModel('users', {
    email: {
        type: db.STRING(100),
        unique: true
    },
    passwd: db.STRING(100),
    name: db.STRING(100),
    gender: db.BOOLEAN
});
```

这样，User就具有`email`、`passwd`、`name`和`gender`这4个业务字段。`id`、`createdAt`、`updatedAt`和`version`应该自动加上，而不是每个Model都去重复定义。

所以，`db.js`的作用就是统一Model的定义：
```js
const Sequelize = require('sequelize');

console.log('init sequelize...');

var sequelize = new Sequelize('dbname', 'username', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

const ID_TYPE = Sequelize.STRING(50);

function defineModel(name, attributes) {
    var attrs = {};
    for (let key in attributes) {
        let value = attributes[key];
        if (typeof value === 'object' && value['type']) {
            value.allowNull = value.allowNull || false;
            attrs[key] = value;
        } else {
            attrs[key] = {
                type: value,
                allowNull: false
            };
        }
    }
    attrs.id = {
        type: ID_TYPE,
        primaryKey: true
    };
    attrs.createdAt = {
        type: Sequelize.BIGINT,
        allowNull: false
    };
    attrs.updatedAt = {
        type: Sequelize.BIGINT,
        allowNull: false
    };
    attrs.version = {
        type: Sequelize.BIGINT,
        allowNull: false
    };
    return sequelize.define(name, attrs, {
        tableName: name,
        timestamps: false,
        hooks: {
            beforeValidate: function (obj) {
                let now = Date.now();
                if (obj.isNewRecord) {
                    if (!obj.id) {
                        obj.id = generateId();
                    }
                    obj.createdAt = now;
                    obj.updatedAt = now;
                    obj.version = 0;
                } else {
                    obj.updatedAt = Date.now();
                    obj.version++;
                }
            }
        }
    });
}
```

我们定义的`defineModel`就是为了强制实现上述规则。

Sequelize在创建、修改Entity时会调用我们指定的函数，这些函数通过`hooks`在定义Model时设定。我们在`beforeValidate`这个事件中根据是否是`isNewRecord`设置主键（如果主键为`null`或`undefined`）、设置时间戳和版本号。

这么一来，Model定义的时候就可以大大简化。

3. 数据库配置

接下来，我们把简单的`config.js`拆成3个配置文件：

config-default.js：存储默认的配置；
config-override.js：存储特定的配置；
config-test.js：存储用于测试的配置。

例如，默认的config-default.js可以配置如下：
```js
var config = {
    dialect: 'mysql',
    database: 'nodejs',
    username: 'www',
    password: 'www',
    host: 'localhost',
    port: 3306
};

module.exports = config;
```

而config-override.js可应用实际配置：
```js
var config = {
    database: 'production',
    username: 'www',
    password: 'secret-password',
    host: '192.168.1.199'
};

module.exports = config;
```

config-test.js可应用测试环境的配置：
```js
var config = {
    database: 'test'
};

module.exports = config;
```

读取配置的时候，我们用config.js实现不同环境读取不同的配置文件：
```js
const defaultConfig = './config-default.js';
// 可设定为绝对路径，如 /opt/product/config-override.js
const overrideConfig = './config-override.js';
const testConfig = './config-test.js';

const fs = require('fs');

var config = null;

if (process.env.NODE_ENV === 'test') {
    console.log(`Load ${testConfig}...`);
    config = require(testConfig);
} else {
    console.log(`Load ${defaultConfig}...`);
    config = require(defaultConfig);
    try {
        if (fs.statSync(overrideConfig).isFile()) {
            console.log(`Load ${overrideConfig}...`);
            config = Object.assign(config, require(overrideConfig));
        }
    } catch (err) {
        console.log(`Cannot load ${overrideConfig}.`);
    }
}

module.exports = config;
```

具体的规则是：

先读取`config-default.js`；
如果不是测试环境，就读取`config-override.js`，如果文件不存在，就忽略。
如果是测试环境，就读取`config-test.js`。
这样做的好处是，开发环境下，团队统一使用默认的配置，并且无需`config-override.js`。部署到服务器时，由运维团队配置好`config-override.js`，以覆盖`config-override.js`的默认设置。测试环境下，本地和CI服务器统一使用`config-test.js`，测试数据库可以反复清空，不会影响开发。

配置文件表面上写起来很容易，但是，既要保证开发效率，又要避免服务器配置文件泄漏，还要能方便地执行测试，就需要一开始搭建出好的结构，才能提升工程能力。

4. 使用Model

要使用Model，就需要引入对应的Model文件，例如：`User.js`。一旦Model多了起来，如何引用也是一件麻烦事。

自动化永远比手工做效率高，而且更可靠。我们写一个`model.js`，自动扫描并导入所有Model：
```js
const fs = require('fs');
const db = require('./db');

let files = fs.readdirSync(__dirname + '/models');

let js_files = files.filter((f)=>{
    return f.endsWith('.js');
}, files);

module.exports = {};

for (let f of js_files) {
    console.log(`import model from file ${f}...`);
    let name = f.substring(0, f.length - 3);
    module.exports[name] = require(__dirname + '/models/' + f);
}

module.exports.sync = () => {
    db.sync();
};
```

这样，需要用的时候，写起来就像这样：
```js
const model = require('./model');

let
    Pet = model.Pet,
    User = model.User;

var pet = await Pet.create({ ... });
```

工程结构

最终，我们创建的工程model-sequelize结构如下：
```text
model-sequelize/
|
+- models/ <-- 存放所有Model
|  |
|  +- Pet.js <-- Pet
|  |
|  +- User.js <-- User
|
+- config.js <-- 配置文件入口
|
+- config-default.js <-- 默认配置文件
|
+- config-test.js <-- 测试配置文件
|
+- db.js <-- 如何定义Model
|
+- model.js <-- 如何导入Model
|
+- init-db.js <-- 初始化数据库
|
+- app.js <-- 业务代码
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

注意到我们其实不需要创建表的SQL，因为Sequelize提供了一个`sync()`方法，可以自动创建数据库。这个功能在开发和生产环境中没有什么用，但是在测试环境中非常有用。测试时，我们可以用`sync()`方法自动创建出表结构，而不是自己维护SQL脚本。这样，可以随时修改Model的定义，并立刻运行测试。开发环境下，首次使用`sync()`也可以自动创建出表结构，避免了手动运行SQL的问题。

`init-db.js`的代码非常简单：
```js
const model = require('./model.js');
model.sync();

console.log('init db ok.');
process.exit(0);
```

它最大的好处是避免了手动维护一个SQL脚本。

# test framework
如果你听说过“测试驱动开发”（TDD：Test-Driven Development），单元测试就不陌生。

单元测试是用来对一个模块、一个函数或者一个类来进行正确性检验的测试工作。

比如对函数abs()，我们可以编写出以下几个测试用例：

输入正数，比如1、1.2、0.99，期待返回值与输入相同；

输入负数，比如-1、-1.2、-0.99，期待返回值与输入相反；

输入0，期待返回0；

输入非数值类型，比如null、[]、{}，期待抛出Error。

把上面的测试用例放到一个测试模块里，就是一个完整的单元测试。

如果单元测试通过，说明我们测试的这个函数能够正常工作。如果单元测试不通过，要么函数有bug，要么测试条件输入不正确，总之，需要修复使单元测试能够通过。

单元测试通过后有什么意义呢？如果我们对abs()函数代码做了修改，只需要再跑一遍单元测试，如果通过，说明我们的修改不会对abs()函数原有的行为造成影响，如果测试不通过，说明我们的修改与原有行为不一致，要么修改代码，要么修改测试。

这种以测试为驱动的开发模式最大的好处就是确保一个程序模块的行为符合我们设计的测试用例。在将来修改的时候，可以极大程度地保证该模块行为仍然是正确的。



## mocha
mocha是JavaScript的一种单元测试框架，既可以在浏览器环境下运行，也可以在Node.js环境下运行。

使用mocha，我们就只需要专注于编写单元测试本身，然后，让mocha去自动运行所有的测试，并给出测试结果。

mocha的特点主要有：

既可以测试简单的JavaScript函数，又可以测试异步代码，因为异步是JavaScript的特性之一；

可以自动运行所有测试，也可以只运行特定的测试；

可以支持before、after、beforeEach和afterEach来编写初始化代码。

我们会详细讲解如何使用mocha编写自动化测试，以及如何测试异步代码。

### 编写测试
假设我们编写了一个`hello.js`，并且输出一个简单的求和函数：
```js
// hello.js

module.exports = function (...rest) {
    var sum = 0;
    for (let n of rest) {
        sum += n;
    }
    return sum;
};
```

这个函数非常简单，就是对输入的任意参数求和并返回结果。

如果我们想对这个函数进行测试，可以写一个`test.js`，然后使用Node.js提供的`assert`模块进行断言：
```js
// test.js

const assert = require('assert');
const sum = require('./hello');

assert.strictEqual(sum(), 0);
assert.strictEqual(sum(1), 1);
assert.strictEqual(sum(1, 2), 3);
assert.strictEqual(sum(1, 2, 3), 6);
```

assert模块非常简单，它断言一个表达式为`true`。如果断言失败，就抛出`Error`。可以在Node.js文档中查看assert模块的所有API。

单独写一个`test.js`的缺点是没法自动运行测试，而且，如果第一个`assert`报错，后面的测试也执行不了了。

如果有很多测试需要运行，就必须把这些测试全部组织起来，然后统一执行，并且得到执行结果。这就是我们为什么要用mocha来编写并运行测试。

### mocha test

我们创建hello-test工程来编写`hello.js`以及相关测试。工程结构如下：
```text
hello-test/
|
+- hello.js <-- 待测试js文件
|
+- test/ <-- 存放所有test
｜ ｜
|  +- hello-test.js <-- 测试文件
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

我们首先在`package.json`中添加mocha的依赖包。和其他依赖包不同，这次我们并没有把依赖包添加到 `"dependencies"`中，而是`"devDependencies"`：
```json
{
  ...

  "dependencies": {},
  "devDependencies": {
    "mocha": "3.0.2"
  }
}
```

如果一个模块在运行的时候并不需要，仅仅在开发时才需要，就可以放到`devDependencies`中。这样，正式打包发布时，`devDependencies`的包不会被包含进来。

然后使用`npm install`安装。

注意，很多文章会让你用命令`npm install -g mocha`把`mocha`安装到全局module中。这是不需要的。尽量不要安装全局模块，因为全局模块会影响到所有Node.js的工程。

紧接着，我们在test目录下创建`hello-test.js`来编写测试。

mocha默认会执行test目录下的所有测试，不要去改变默认目录。

`hello-test.js`内容如下：
```js
const assert = require('assert');

const sum = require('../hello');

describe('#hello.js', () => {

    describe('#sum()', () => {
        it('sum() should return 0', () => {
            assert.strictEqual(sum(), 0);
        });

        it('sum(1) should return 1', () => {
            assert.strictEqual(sum(1), 1);
        });

        it('sum(1, 2) should return 3', () => {
            assert.strictEqual(sum(1, 2), 3);
        });

        it('sum(1, 2, 3) should return 6', () => {
            assert.strictEqual(sum(1, 2, 3), 6);
        });
    });
});
```

这里我们使用mocha默认的BDD-style的测试。describe可以任意嵌套，以便把相关测试看成一组测试。

每个`it("name", function() {...})`就代表一个测试。例如，为了测试`sum(1, 2)`，我们这样写：
```js
it('sum(1, 2) should return 3', () => {
    assert.strictEqual(sum(1, 2), 3);
});
```

编写测试的原则是，一次只测一种情况，且测试代码要非常简单。我们编写多个测试来分别测试不同的输入，并使用assert判断输出是否是我们所期望的。

运行测试

下一步，我们就可以用mocha运行测试了。

如何运行？有三种方法。

方法一，可以打开命令提示符，切换到hello-test目录，然后执行命令：

    C:\...\hello-test> node_modules\mocha\bin\mocha
mocha就会自动执行所有测试，然后输出如下：
```text
  #hello.js
    #sum()
      ✓ sum() should return 0
      ✓ sum(1) should return 1
      ✓ sum(1, 2) should return 3
      ✓ sum(1, 2, 3) should return 6
  4 passing (7ms)
```

这说明我们编写的4个测试全部通过。如果没有通过，要么修改测试代码，要么修改`hello.js`，直到测试全部通过为止。

方法二，我们在`package.json`中添加npm命令：
```json
{
  // ...

  "scripts": {
    "test": "mocha"
  }

  // ...
}
```

然后在hello-test目录下执行命令：

    C:\...\hello-test> npm test
可以得到和上面一样的输出。这种方式通过npm执行命令，输入的命令比较简单。

方法三，我们在VS Code中创建配置文件.vscode/launch.json，然后编写两个配置选项：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/hello.js",
            "stopOnEntry": false,
            "args": [],
            "cwd": "${workspaceRoot}",
            "preLaunchTask": null,
            "runtimeExecutable": null,
            "runtimeArgs": [
                "--nolazy"
            ],
            "env": {
                "NODE_ENV": "development"
            },
            "externalConsole": false,
            "sourceMaps": false,
            "outDir": null
        },
        {
            "name": "Test",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/node_modules/mocha/bin/mocha",
            "stopOnEntry": false,
            "args": [],
            "cwd": "${workspaceRoot}",
            "preLaunchTask": null,
            "runtimeExecutable": null,
            "runtimeArgs": [
                "--nolazy"
            ],
            "env": {
                "NODE_ENV": "test"
            },
            "externalConsole": false,
            "sourceMaps": false,
            "outDir": null
        }
    ]
}
```

注意第一个配置选项Run是正常执行一个.js文件，第二个配置选项Test我们填入`"program": "${workspaceRoot}/node_modules/mocha/bin/mocha"`，并设置`env`为`"NODE_ENV": "test"`，这样，就可以在VS Code中打开Debug面板，选择Test，运行，即可在Console面板中看到测试结果：

    run-hello-test

before和after

在测试前初始化资源，测试后释放资源是非常常见的。mocha提供了`before`、`after`、`beforeEach`和`afterEach`来实现这些功能。

我们把`hello-test.js`改为：
```js
const assert = require('assert');
const sum = require('../hello');

describe('#hello.js', () => {
    describe('#sum()', () => {
        before(function () {
            console.log('before:');
        });

        after(function () {
            console.log('after.');
        });

        beforeEach(function () {
            console.log('  beforeEach:');
        });

        afterEach(function () {
            console.log('  afterEach.');
        });

        it('sum() should return 0', () => {
            assert.strictEqual(sum(), 0);
        });

        it('sum(1) should return 1', () => {
            assert.strictEqual(sum(1), 1);
        });

        it('sum(1, 2) should return 3', () => {
            assert.strictEqual(sum(1, 2), 3);
        });

        it('sum(1, 2, 3) should return 6', () => {
            assert.strictEqual(sum(1, 2, 3), 6);
        });
    });
});
```

再次运行，可以看到每个test执行前后会分别执行beforeEach()和afterEach()，以及一组test执行前后会分别执行before()和after()：
```text
  #hello.js
    #sum()
before:
  beforeEach:
      ✓ sum() should return 0
  afterEach.
  beforeEach:
      ✓ sum(1) should return 1
  afterEach.
  beforeEach:
      ✓ sum(1, 2) should return 3
  afterEach.
  beforeEach:
      ✓ sum(1, 2, 3) should return 6
  afterEach.
after.
  4 passing (8ms)

```
### 异步测试
用mocha测试一个函数是非常简单的，但是，在JavaScript的世界中，更多的时候，我们编写的是异步代码，所以，我们需要用mocha测试异步函数。

我们把上一节的hello-test工程复制一份，重命名为async-test，然后，把hello.js改造为异步函数：
```js
const fs = require('mz/fs');

// a simple async function:
module.exports = async () => {
    let expression = await fs.readFile('./data.txt', 'utf-8');
    let fn = new Function('return ' + expression);
    let r = fn();
    console.log(`Calculate: ${expression} = ${r}`);
    return r;
};
```

这个async函数通过读取data.txt的内容获取表达式，这样它就变成了异步。我们编写一个data.txt文件，内容如下：

    1 + (2 + 4) * (9 - 2) / 3
别忘了在package.json中添加依赖包：
```json
"dependencies": {
    "mz": "2.4.0"
}
```

紧接着，我们在test目录中添加一个await-test.js，测试hello.js的async函数。

我们先看看mocha如何实现异步测试。

如果要测试同步函数，我们传入无参数函数即可：
```js
it('test sync function', function () {
    // TODO:
    assert(true);
});
```

如果要测试异步函数，我们要传入的函数需要带一个参数，通常命名为done：
```js
it('test async function', function (done) {
    fs.readFile('filepath', function (err, data) {
        if (err) {
            done(err);
        } else {
            done();
        }
    });
});

```
测试异步函数需要在函数内部手动调用done()表示测试成功，done(err)表示测试出错。

对于用ES7的async编写的函数，我们可以这么写：
```js
it('#async with done', (done) => {
    (async function () {
        try {
            let r = await hello();
            assert.strictEqual(r, 15);
            done();
        } catch (err) {
            done(err);
        }
    })();
});

```
但是用try...catch太麻烦。还有一种更简单的写法，就是直接把async函数当成同步函数来测试：
```js
it('#async function', async () => {
    let r = await hello();
    assert.strictEqual(r, 15);
});
```

这么写异步测试，太简单了有木有！

我们把上一个hello-test工程复制为async-test，结构如下：
```text
async-test/
|
+- hello.js <-- 待测试js文件
|
+- data.txt <-- 数据文件
|
+- test/ <-- 存放所有test
｜ ｜
|  +- await-test.js <-- 异步测试
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包

```
现在，在命令行窗口运行命令node_modules\mocha\bin\mocha，测试就可以正常执行：
```text
   #asyncCalculate()
Calculate: 1 + (2 + 4) * (9 - 2) / 3 = 15
      ✓ #async function
  1 passing (11ms)
```
  #async hello
 
第二种方法是在package.json中把script改为：
```json
"scripts": {
    "test": "mocha"
}
```

这样就可以在命令行窗口通过npm test执行测试。

第三种方法是在VS Code配置文件中把program改为：

    "program": "${workspaceRoot}/node_modules/mocha/bin/mocha"
这样就可以在VS Code中直接运行测试。

编写异步代码时，我们要坚持使用async和await关键字，这样，编写测试也同样简单。

### Http测试
用mocha测试一个async函数是非常方便的。现在，当我们有了一个koa的Web应用程序时，我们怎么用mocha来自动化测试Web应用程序呢？

一个简单的想法就是在测试前启动koa的app，然后运行async测试，在测试代码中发送http请求，收到响应后检查结果，这样，一个基于http接口的测试就可以自动运行。

我们先创建一个最简单的koa应用，结构如下：
```text
koa-test/
|
+- app.js <-- koa app文件
|
+- start.js <-- app启动入口
|
+- test/ <-- 存放所有test
｜ ｜
|  +- app-test.js <-- 异步测试
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
```

这个koa应用和前面的koa应用稍有不同的是，app.js只负责创建app实例，并不监听端口：
```js
// app.js

const Koa = require('koa');

const app = new Koa();

app.use(async (ctx, next) => {
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    console.log(`${ctx.request.method} ${ctx.request.url}: ${ms}ms`);
    ctx.response.set('X-Response-Time', `${ms}ms`);
});

app.use(async (ctx, next) => {
    var name = ctx.request.query.name || 'world';
    ctx.response.type = 'text/html';
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
});

module.exports = app;
而start.js负责真正启动应用：

// start.js

const app = require('./app');

app.listen(3000);
console.log('app started at port 3000...');
```

这样做的目的是便于后面的测试。

紧接着，我们在test目录下创建app-test.js，来测试这个koa应用。

在测试前，我们在package.json中添加devDependencies，除了mocha外，我们还需要一个简单而强大的测试模块supertest：
```json
{
    ...
    "devDependencies": {
        "mocha": "3.0.2",
        "supertest": "3.0.0"
    }
}
```

运行npm install后，我们开始编写测试：
```js
// app-test.js

const
    request = require('supertest'),
    app = require('../app');

describe('#test koa app', () => {

    let server = app.listen(9900);

    describe('#test server', () => {

        it('#test GET /', async () => {
            let res = await request(server)
                .get('/')
                .expect('Content-Type', /text\/html/)
                .expect(200, '<h1>Hello, world!</h1>');
        });

        it('#test GET /path?name=Bob', async () => {
            let res = await request(server)
                .get('/path?name=Bob')
                .expect('Content-Type', /text\/html/)
                .expect(200, '<h1>Hello, Bob!</h1>');
        });
    });
});
```

在测试中，我们首先导入supertest模块，然后导入app模块，注意我们已经在app.js中移除了app.listen(3000);语句，所以，这里我们用：
```js
let server = app.listen(9900);
```

让app实例监听在9900端口上，并且获得返回的server实例。

在测试代码中，我们使用：
```js
let res = await request(server).get('/');
```

就可以构造一个GET请求，发送给koa的应用，然后获得响应。

可以手动检查响应对象，例如，res.body，还可以利用supertest提供的expect()更方便地断言响应的HTTP代码、返回内容和HTTP头。断言HTTP头时可用使用正则表达式。例如，下面的断言：

    .expect('Content-Type', /text\/html/)
可用成功匹配到Content-Type为text/html、text/html; charset=utf-8等值。

当所有测试运行结束后，app实例会自动关闭，无需清理。

利用mocha的异步测试，配合supertest，我们可以用简单的代码编写端到端的HTTP自动化测试。

# WebSocket
## 简介
WebSocket是HTML5新增的协议，它的目的是在浏览器和服务器之间建立一个不受限的双向通信的通道，比如说，服务器可以在任意时刻发送消息给浏览器。

为什么传统的HTTP协议不能做到WebSocket实现的功能？这是因为HTTP协议是一个请求－响应协议，请求必须先由浏览器发给服务器，服务器才能响应这个请求，再把数据发送给浏览器。换句话说，浏览器不主动请求，服务器是没法主动发数据给浏览器的。

这样一来，要在浏览器中搞一个实时聊天，在线炒股（不鼓励），或者在线多人游戏的话就没法实现了，只能借助Flash这些插件。

也有人说，HTTP协议其实也能实现啊，比如用轮询或者Comet。轮询是指浏览器通过JavaScript启动一个定时器，然后以固定的间隔给服务器发请求，询问服务器有没有新消息。这个机制的缺点一是实时性不够，二是频繁的请求会给服务器带来极大的压力。

Comet本质上也是轮询，但是在没有消息的情况下，服务器先拖一段时间，等到有消息了再回复。这个机制暂时地解决了实时性问题，但是它带来了新的问题：以多线程模式运行的服务器会让大部分线程大部分时间都处于挂起状态，极大地浪费服务器资源。另外，一个HTTP连接在长时间没有数据传输的情况下，链路上的任何一个网关都可能关闭这个连接，而网关是我们不可控的，这就要求Comet连接必须定期发一些ping数据表示连接“正常工作”。

以上两种机制都治标不治本，所以，HTML5推出了WebSocket标准，让浏览器和服务器之间可以建立无限制的全双工通信，任何一方都可以主动发消息给对方。

WebSocket协议

WebSocket并不是全新的协议，而是利用了HTTP协议来建立连接。我们来看看WebSocket连接是如何创建的。

首先，WebSocket连接必须由浏览器发起，因为请求协议是一个标准的HTTP请求，格式如下：
```text
GET ws://localhost:3000/ws/chat HTTP/1.1
Host: localhost
Upgrade: websocket
Connection: Upgrade
Origin: http://localhost:3000
Sec-WebSocket-Key: client-random-string
Sec-WebSocket-Version: 13
```

该请求和普通的HTTP请求有几点不同：

GET请求的地址不是类似/path/，而是以ws://开头的地址；
请求头Upgrade: websocket和Connection: Upgrade表示这个连接将要被转换为WebSocket连接；
Sec-WebSocket-Key是用于标识这个连接，并非用于加密数据；
Sec-WebSocket-Version指定了WebSocket的协议版本。
随后，服务器如果接受该请求，就会返回如下响应：
```text
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: server-random-string
```

该响应代码101表示本次连接的HTTP协议即将被更改，更改后的协议就是Upgrade: websocket指定的WebSocket协议。

版本号和子协议规定了双方能理解的数据格式，以及是否支持压缩等等。如果仅使用WebSocket的API，就不需要关心这些。

现在，一个WebSocket连接就建立成功，浏览器和服务器就可以随时主动发送消息给对方。消息有两种，一种是文本，一种是二进制数据。通常，我们可以发送JSON格式的文本，这样，在浏览器处理起来就十分容易。

为什么WebSocket连接可以实现全双工通信而HTTP连接不行呢？实际上HTTP协议是建立在TCP协议之上的，TCP协议本身就实现了全双工通信，但是HTTP协议的请求－应答机制限制了全双工通信。WebSocket连接建立以后，其实只是简单规定了一下：接下来，咱们通信就不使用HTTP协议了，直接互相发数据吧。

安全的WebSocket连接机制和HTTPS类似。首先，浏览器用wss://xxx创建WebSocket连接时，会先通过HTTPS创建安全的连接，然后，该HTTPS连接升级为WebSocket连接，底层通信走的仍然是安全的SSL/TLS协议。

浏览器

很显然，要支持WebSocket通信，浏览器得支持这个协议，这样才能发出ws://xxx的请求。目前，支持WebSocket的主流浏览器如下：

Chrome
Firefox
IE >= 10
Sarafi >= 6
Android >= 4.4
iOS >= 8
服务器

由于WebSocket是一个协议，服务器具体怎么实现，取决于所用编程语言和框架本身。Node.js本身支持的协议包括TCP协议和HTTP协议，要支持WebSocket协议，需要对Node.js提供的HTTPServer做额外的开发。已经有若干基于Node.js的稳定可靠的WebSocket实现，我们直接用npm安装使用即可。


## 使用ws
要使用WebSocket，关键在于服务器端支持，这样，我们才有可能用支持WebSocket的浏览器使用WebSocket。

ws模块

在Node.js中，使用最广泛的WebSocket模块是ws，我们创建一个hello-ws的VS Code工程，然后在package.json中添加ws的依赖：

"dependencies": {
    "ws": "1.1.1"
}
整个工程结构如下：

hello-ws/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- app.js <-- 启动js文件
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
运行npm install后，我们就可以在app.js中编写WebSocket的服务器端代码。

创建一个WebSocket的服务器实例非常容易：

// 导入WebSocket模块:
const WebSocket = require('ws');

// 引用Server类:
const WebSocketServer = WebSocket.Server;

// 实例化:
const wss = new WebSocketServer({
    port: 3000
});
这样，我们就在3000端口上打开了一个WebSocket Server，该实例由变量wss引用。

接下来，如果有WebSocket请求接入，wss对象可以响应connection事件来处理这个WebSocket：

wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            }
        });
    })
});
在connection事件中，回调函数会传入一个WebSocket的实例，表示这个WebSocket连接。对于每个WebSocket连接，我们都要对它绑定某些事件方法来处理不同的事件。这里，我们通过响应message事件，在收到消息后再返回一个ECHO: xxx的消息给客户端。

创建WebSocket连接

现在，这个简单的服务器端WebSocket程序就编写好了。如何真正创建WebSocket并且给服务器发消息呢？方法是在浏览器中写JavaScript代码。

先在VS Code中执行app.js，或者在命令行用npm start执行。然后，在当前页面下，直接打开可以执行JavaScript代码的浏览器Console，依次输入代码：

// 打开一个WebSocket:
var ws = new WebSocket('ws://localhost:3000/test');
// 响应onmessage事件:
ws.onmessage = function(msg) { console.log(msg); };
// 给服务器发送一个字符串:
ws.send('Hello!');
一切正常的话，可以看到Console的输出如下：

MessageEvent {isTrusted: true, data: "ECHO: Hello!", origin: "ws://localhost:3000", lastEventId: "", source: null…}
这样，我们就在浏览器中成功地收到了服务器发送的消息！

如果嫌在浏览器中输入JavaScript代码比较麻烦，我们还可以直接用ws模块提供的WebSocket来充当客户端。换句话说，ws模块既包含了服务器端，又包含了客户端。

ws的WebSocket就表示客户端，它其实就是WebSocketServer响应connection事件时回调函数传入的变量ws的类型。

客户端的写法如下：

let ws = new WebSocket('ws://localhost:3000/test');

// 打开WebSocket连接后立刻发送一条消息:
ws.on('open', function () {
    console.log(`[CLIENT] open()`);
    ws.send('Hello!');
});

// 响应收到的消息:
ws.on('message', function (message) {
    console.log(`[CLIENT] Received: ${message}`);
}
在Node环境下，ws模块的客户端可以用于测试服务器端代码，否则，每次都必须在浏览器执行JavaScript代码。

同源策略

从上面的测试可以看出，WebSocket协议本身不要求同源策略（Same-origin Policy），也就是某个地址为http://a.com的网页可以通过WebSocket连接到ws://b.com。但是，浏览器会发送Origin的HTTP头给服务器，服务器可以根据Origin拒绝这个WebSocket请求。所以，是否要求同源要看服务器端如何检查。

路由

还需要注意到服务器在响应connection事件时并未检查请求的路径，因此，在客户端打开ws://localhost:3000/any/path可以写任意的路径。

实际应用中还需要根据不同的路径实现不同的功能。

## 编写聊天室
上一节我们用ws模块创建了一个WebSocket应用。但是它只能简单地响应ECHO: xxx消息，还属于Hello, world级别的应用。

要创建真正的WebSocket应用，首先，得有一个基于MVC的Web应用，也就是我们在前面用koa2和Nunjucks创建的Web，在此基础上，把WebSocket添加进来，才算完整。

因此，本节的目标是基于WebSocket创建一个在线聊天室。

首先，我们把前面编写的MVC工程复制一份，先创建一个完整的MVC的Web应用，结构如下：

ws-with-koa/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- controllers/ <-- Controller
|
+- views/ <-- html模板文件
|
+- static/ <-- 静态资源文件
|
+- app.js <-- 使用koa的js
|
+- controller.js <-- 扫描注册Controller
|
+- static-files.js <-- 处理静态文件
|
+- templating.js <-- 模版引擎入口
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
然后，把我们需要的依赖包添加到package.json：

"dependencies": {
    "ws": "1.1.1",
    "koa": "2.0.0",
    "koa-bodyparser": "3.2.0",
    "koa-router": "7.0.0",
    "nunjucks": "2.4.2",
    "mime": "1.3.4",
    "mz": "2.4.0"
}
使用npm install安装后，我们首先得到了一个标准的基于MVC的koa2应用。该应用的核心是一个代表koa应用的app变量：

const app = new Koa();

// TODO: app.use(...);

app.listen(3000);
现在第一个问题来了：koa通过3000端口响应HTTP，我们要新加的WebSocketServer还能否使用3000端口？

答案是肯定的。虽然WebSocketServer可以使用别的端口，但是，统一端口有个最大的好处：

实际应用中，HTTP和WebSocket都使用标准的80和443端口，不需要暴露新的端口，也不需要修改防火墙规则。

在3000端口被koa占用后，WebSocketServer如何使用该端口？

实际上，3000端口并非由koa监听，而是koa调用Node标准的http模块创建的http.Server监听的。koa只是把响应函数注册到该http.Server中了。类似的，WebSocketServer也可以把自己的响应函数注册到http.Server中，这样，同一个端口，根据协议，可以分别由koa和ws处理：

http-ws-koa

把WebSocketServer绑定到同一个端口的关键代码是先获取koa创建的http.Server的引用，再根据http.Server创建WebSocketServer：

// koa app的listen()方法返回http.Server:
let server = app.listen(3000);

// 创建WebSocketServer:
let wss = new WebSocketServer({
    server: server
});
要始终注意，浏览器创建WebSocket时发送的仍然是标准的HTTP请求。无论是WebSocket请求，还是普通HTTP请求，都会被http.Server处理。具体的处理方式则是由koa和WebSocketServer注入的回调函数实现的。WebSocketServer会首先判断请求是不是WS请求，如果是，它将处理该请求，如果不是，该请求仍由koa处理。

所以，WS请求会直接由WebSocketServer处理，它根本不会经过koa，koa的任何middleware都没有机会处理该请求。

现在第二个问题来了：在koa应用中，可以很容易地认证用户，例如，通过session或者cookie，但是，在响应WebSocket请求时，如何识别用户身份？

一个简单可行的方案是把用户登录后的身份写入Cookie，在koa中，可以使用middleware解析Cookie，把用户绑定到ctx.state.user上。

WS请求也是标准的HTTP请求，所以，服务器也会把Cookie发送过来，这样，我们在用WebSocketServer处理WS请求时，就可以根据Cookie识别用户身份。

先把识别用户身份的逻辑提取为一个单独的函数：

function parseUser(obj) {
    if (!obj) {
        return;
    }
    console.log('try parse: ' + obj);
    let s = '';
    if (typeof obj === 'string') {
        s = obj;
    } else if (obj.headers) {
        let cookies = new Cookies(obj, null);
        s = cookies.get('name');
    }
    if (s) {
        try {
            let user = JSON.parse(Buffer.from(s, 'base64').toString());
            console.log(`User: ${user.name}, ID: ${user.id}`);
            return user;
        } catch (e) {
            // ignore
        }
    }
}
注意：出于演示目的，该Cookie并没有作Hash处理，实际上它就是一个JSON字符串。

在koa的middleware中，我们很容易识别用户：

app.use(async (ctx, next) => {
    ctx.state.user = parseUser(ctx.cookies.get('name') || '');
    await next();
});
在WebSocketServer中，就需要响应connection事件，然后识别用户：

wss.on('connection', function (ws) {
    // ws.upgradeReq是一个request对象:
    let user = parseUser(ws.upgradeReq);
    if (!user) {
        // Cookie不存在或无效，直接关闭WebSocket:
        ws.close(4001, 'Invalid user');
    }
    // 识别成功，把user绑定到该WebSocket对象:
    ws.user = user;
    // 绑定WebSocketServer对象:
    ws.wss = wss;
});
紧接着，我们要对每个创建成功的WebSocket绑定message、close、error等事件处理函数。对于聊天应用来说，每收到一条消息，就需要把该消息广播到所有WebSocket连接上。

先为wss对象添加一个broadcase()方法：

wss.broadcast = function (data) {
    wss.clients.forEach(function (client) {
        client.send(data);
    });
};
在某个WebSocket收到消息后，就可以调用wss.broadcast()进行广播了：

ws.on('message', function (message) {
    console.log(message);
    if (message && message.trim()) {
        let msg = createMessage('chat', this.user, message.trim());
        this.wss.broadcast(msg);
    }
});
消息有很多类型，不一定是聊天的消息，还可以有获取用户列表、用户加入、用户退出等多种消息。所以我们用createMessage()创建一个JSON格式的字符串，发送给浏览器，浏览器端的JavaScript就可以直接使用：

// 消息ID:
var messageIndex = 0;

function createMessage(type, user, data) {
    messageIndex ++;
    return JSON.stringify({
        id: messageIndex,
        type: type,
        user: user,
        data: data
    });
}
编写页面

相比服务器端的代码，页面的JavaScript代码会更复杂。

聊天室页面可以划分为左侧会话列表和右侧用户列表两部分：

chat

这里的DOM需要动态更新，因此，状态管理是页面逻辑的核心。

为了简化状态管理，我们用Vue控制左右两个列表：

var vmMessageList = new Vue({
    el: '#message-list',
    data: {
        messages: []
    }
});

var vmUserList = new Vue({
    el: '#user-list',
    data: {
        users: []
    }
});
会话列表和用户列表初始化为空数组。

紧接着，创建WebSocket连接，响应服务器消息，并且更新会话列表和用户列表：

var ws = new WebSocket('ws://localhost:3000/ws/chat');

ws.onmessage = function(event) {
    var data = event.data;
    console.log(data);
    var msg = JSON.parse(data);
    if (msg.type === 'list') {
        vmUserList.users = msg.data;
    } else if (msg.type === 'join') {
        addToUserList(vmUserList.users, msg.user);
        addMessage(vmMessageList.messages, msg);
    } else if (msg.type === 'left') {
        removeFromUserList(vmUserList.users, msg.user);
        addMessage(vmMessageList.messages, msg);
    } else if (msg.type === 'chat') {
        addMessage(vmMessageList.messages, msg);
    }
};
这样，JavaScript负责更新状态，Vue负责根据状态刷新DOM。以用户列表为例，HTML代码如下：

<div id="user-list">
    <div class="media" v-for="user in users">
        <div class="media-left">
            <img class="media-object" src="/static/user.png">
        </div>
        <div class="media-body">
            <h4 class="media-heading" v-text="user.name"></h4>
        </div>
    </div>
</div>
测试的时候，如果在本机测试，需要同时用几个不同的浏览器，这样Cookie互不干扰。

最终的聊天室效果如下：

websocket

配置反向代理

如果网站配置了反向代理，例如Nginx，则HTTP和WebSocket都必须通过反向代理连接Node服务器。HTTP的反向代理非常简单，但是要正常连接WebSocket，代理服务器必须支持WebSocket协议。

我们以Nginx为例，编写一个简单的反向代理配置文件。

详细的配置可以参考Nginx的官方博客：Using NGINX as a WebSocket Proxy

首先要保证Nginx版本>=1.3，然后，通过proxy_set_header指令，设定：

proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
Nginx即可理解该连接将使用WebSocket协议。

一个示例配置文件内容如下：

server {
    listen      80;
    server_name localhost;

    # 处理静态资源文件:
    location ^~ /static/ {
        root /path/to/ws-with-koa;
    }

    # 处理WebSocket连接:
    location ^~ /ws/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }

    # 其他所有请求:
    location / {
        proxy_pass       http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# REST
## 简介
自从Roy Fielding博士在2000年他的博士论文中提出REST（Representational State Transfer）风格的软件架构模式后，REST就基本上迅速取代了复杂而笨重的SOAP，成为Web API的标准了。

什么是Web API呢？

如果我们想要获取某个电商网站的某个商品，输入http://localhost:3000/products/123，就可以看到id为123的商品页面，但这个结果是HTML页面，它同时混合包含了Product的数据和Product的展示两个部分。对于用户来说，阅读起来没有问题，但是，如果机器读取，就很难从HTML中解析出Product的数据。

如果一个URL返回的不是HTML，而是机器能直接解析的数据，这个URL就可以看成是一个Web API。比如，读取http://localhost:3000/api/products/123，如果能直接返回Product的数据，那么机器就可以直接读取。

REST就是一种设计API的模式。最常用的数据格式是JSON。由于JSON能直接被JavaScript读取，所以，以JSON格式编写的REST风格的API具有简单、易读、易用的特点。

编写API有什么好处呢？由于API就是把Web App的功能全部封装了，所以，通过API操作数据，可以极大地把前端和后端的代码隔离，使得后端代码易于测试，前端代码编写更简单。

此外，如果我们把前端页面看作是一种用于展示的客户端，那么API就是为客户端提供数据、操作数据的接口。这种设计可以获得极高的扩展性。例如，当用户需要在手机上购买商品时，只需要开发针对iOS和Android的两个客户端，通过客户端访问API，就可以完成通过浏览器页面提供的功能，而后端代码基本无需改动。

当一个Web应用以API的形式对外提供功能时，整个应用的结构就扩展为：

REST-arch

把网页视为一种客户端，是REST架构可扩展的一个关键。

## 编写REST API
REST API规范

编写REST API，实际上就是编写处理HTTP请求的async函数，不过，REST请求和普通的HTTP请求有几个特殊的地方：

REST请求仍然是标准的HTTP请求，但是，除了GET请求外，POST、PUT等请求的body是JSON数据格式，请求的Content-Type为application/json；
REST响应返回的结果是JSON数据格式，因此，响应的Content-Type也是application/json。
REST规范定义了资源的通用访问格式，虽然它不是一个强制要求，但遵守该规范可以让人易于理解。

例如，商品Product就是一种资源。获取所有Product的URL如下：

GET /api/products
而获取某个指定的Product，例如，id为123的Product，其URL如下：

GET /api/products/123
新建一个Product使用POST请求，JSON数据包含在body中，URL如下：

POST /api/products
更新一个Product使用PUT请求，例如，更新id为123的Product，其URL如下：

PUT /api/products/123
删除一个Product使用DELETE请求，例如，删除id为123的Product，其URL如下：

DELETE /api/products/123
资源还可以按层次组织。例如，获取某个Product的所有评论，使用：

GET /api/products/123/reviews
当我们只需要获取部分数据时，可通过参数限制返回的结果集，例如，返回第2页评论，每页10项，按时间排序：

GET /api/products/123/reviews?page=2&size=10&sort=time
koa处理REST

既然我们已经使用koa作为Web框架处理HTTP请求，因此，我们仍然可以在koa中响应并处理REST请求。

我们先创建一个rest-hello的工程，结构如下：

rest-hello/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- controllers/
|  |
|  +- api.js <-- REST API
|
+- app.js <-- 使用koa的js
|
+- controller.js <-- 扫描注册Controller
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
在package.json中，我们需要如下依赖包：

"dependencies": {
    "koa": "2.0.0",
    "koa-bodyparser": "3.2.0",
    "koa-router": "7.0.0"
}
运行npm install安装依赖包。

在app.js中，我们仍然使用标准的koa组件，并自动扫描加载controllers目录下的所有js文件：

const app = new Koa();

const controller = require('./controller');

// parse request body:
app.use(bodyParser());

// add controller:
app.use(controller());

app.listen(3000);
console.log('app started at port 3000...');
注意到app.use(bodyParser());这个语句，它给koa安装了一个解析HTTP请求body的处理函数。如果HTTP请求是JSON数据，我们就可以通过ctx.request.body直接访问解析后的JavaScript对象。

下面我们编写api.js，添加一个GET请求：

// 存储Product列表，相当于模拟数据库:
var products = [{
    name: 'iPhone',
    price: 6999
}, {
    name: 'Kindle',
    price: 999
}];

module.exports = {
    'GET /api/products': async (ctx, next) => {
        // 设置Content-Type:
        ctx.response.type = 'application/json';
        // 设置Response Body:
        ctx.response.body = {
            products: products
        };
    }
}
在koa中，我们只需要给ctx.response.body赋值一个JavaScript对象，koa会自动把该对象序列化为JSON并输出到客户端。

我们在浏览器中访问http://localhost:3000/api/products，可以得到如下输出：

{"products":[{"name":"iPhone","price":6999},{"name":"Kindle","price":999}]}
紧接着，我们再添加一个创建Product的API：

module.exports = {
    'GET /api/products': async (ctx, next) => {
        ...
    },

    'POST /api/products': async (ctx, next) => {
        var p = {
            name: ctx.request.body.name,
            price: ctx.request.body.price
        };
        products.push(p);
        ctx.response.type = 'application/json';
        ctx.response.body = p;
    }
};
这个POST请求无法在浏览器中直接测试。但是我们可以通过curl命令在命令提示符窗口测试这个API。我们输入如下命令：

curl -H 'Content-Type: application/json' -X POST -d '{"name":"XBox","price":3999}' http://localhost:3000/api/products
得到的返回内容如下：

{"name":"XBox","price":3999}
我们再在浏览器中访问http://localhost:3000/api/products，可以得到更新后的输出如下：

{"products":[{"name":"iPhone","price":6999},{"name":"Kindle","price":999},{"name":"XBox","price":3999}]}
可见，在koa中处理REST请求是非常简单的。bodyParser()这个middleware可以解析请求的JSON数据并绑定到ctx.request.body上，输出JSON时我们先指定ctx.response.type = 'application/json'，然后把JavaScript对象赋值给ctx.response.body就完成了REST请求的处理。

## 开发REST API
在上一节中，我们演示了如何在koa项目中使用REST。其实，使用REST和使用MVC是类似的，不同的是，提供REST的Controller处理函数最后不调用render()去渲染模板，而是把结果直接用JSON序列化返回给客户端。

使用REST虽然非常简单，但是，设计一套合理的REST框架却需要仔细考虑很多问题。

问题一：如何组织URL

在实际工程中，一个Web应用既有REST，还有MVC，可能还需要集成其他第三方系统。如何组织URL？

一个简单的方法是通过固定的前缀区分。例如，/static/开头的URL是静态资源文件，类似的，/api/开头的URL就是REST API，其他URL是普通的MVC请求。

使用不同的子域名也可以区分，但对于中小项目来说配置麻烦。随着项目的扩大，将来仍然可以把单域名拆成多域名。

问题二：如何统一输出REST

如果每个异步函数都编写下面这样的代码：

// 设置Content-Type:
ctx.response.type = 'application/json';
// 设置Response Body:
ctx.response.body = {
    products: products
};
很显然，这样的重复代码很容易导致错误，例如，写错了字符串'application/json'，或者漏写了ctx.response.type = 'application/json'，都会导致浏览器得不到JSON数据。

回忆我们集成Nunjucks模板引擎的方法：通过一个middleware给ctx添加一个render()方法，Controller就可以直接使用ctx.render('view', model)来渲染模板，不必编写重复的代码。

类似的，我们也可以通过一个middleware给ctx添加一个rest()方法，直接输出JSON数据。

由于我们给所有REST API一个固定的URL前缀/api/，所以，这个middleware还需要根据path来判断当前请求是否是一个REST请求，如果是，我们才给ctx绑定rest()方法。

我们把这个middleware先写出来，命名为rest.js：

module.exports = {
    restify: (pathPrefix) => {
        // REST API前缀，默认为/api/:
        pathPrefix = pathPrefix || '/api/';
        return async (ctx, next) => {
            // 是否是REST API前缀?
            if (ctx.request.path.startsWith(pathPrefix)) {
                // 绑定rest()方法:
                ctx.rest = (data) => {
                    ctx.response.type = 'application/json';
                    ctx.response.body = data;
                }
                await next();
            } else {
                await next();
            }
        };
    }
};
这样，任何支持REST的异步函数只需要简单地调用：

ctx.rest({
    data: 123
});
就完成了REST请求的处理。

问题三：如何处理错误

这个问题实际上有两部分。

第一，当REST API请求出错时，我们如何返回错误信息？

第二，当客户端收到REST响应后，如何判断是成功还是错误？

这两部分还必须统一考虑。

REST架构本身对错误处理并没有统一的规定。实际应用时，各种各样的错误处理机制都有。有的设计得比较合理，有的设计得不合理，导致客户端尤其是手机客户端处理API简直就是噩梦。

在涉及到REST API的错误时，我们必须先意识到，客户端会遇到两种类型的REST API错误。

一类是类似403，404，500等错误，这些错误实际上是HTTP请求可能发生的错误。REST请求只是一种请求类型和响应类型均为JSON的HTTP请求，因此，这些错误在REST请求中也会发生。

针对这种类型的错误，客户端除了提示用户“出现了网络错误，稍后重试”以外，并无法获得具体的错误信息。

另一类错误是业务逻辑的错误，例如，输入了不合法的Email地址，试图删除一个不存在的Product，等等。这种类型的错误完全可以通过JSON返回给客户端，这样，客户端可以根据错误信息提示用户“Email不合法”等，以便用户修复后重新请求API。

问题的关键在于客户端必须能区分出这两种类型的错误。

第一类的错误实际上客户端可以识别，并且我们也无法操控HTTP服务器的错误码。

第二类的错误信息是一个JSON字符串，例如：

{
    "code": "10000",
    "message": "Bad email address"
}
但是HTTP的返回码应该用啥？

有的Web应用使用200，这样客户端在识别出第一类错误后，如果遇到200响应，则根据响应的JSON判断是否有错误。这种方式对于动态语言（例如，JavaScript，Python等）非常容易：

var result = JSON.parse(response.data);
if (result.code) {
    // 有错误:
    alert(result.message);
} else {
    // 没有错误
}
但是，对于静态语言（例如，Java）就比较麻烦，很多时候，不得不做两次序列化：

APIError err = objectMapper.readValue(jsonString, APIError.class);
if (err.code == null) {
    // 没有错误，还需要重新转换:
    User user = objectMapper.readValue(jsonString, User.class);
} else {
    // 有错误:
}
有的Web应用对正确的REST响应使用200，对错误的REST响应使用400，这样，客户端即是静态语言，也可以根据HTTP响应码判断是否出错，出错时直接把结果反序列化为APIError对象。

两种方式各有优劣。我们选择第二种，200表示成功响应，400表示失败响应。

但是，要注意，绝不能混合其他HTTP错误码。例如，使用401响应“登录失败”，使用403响应“权限不够”。这会使客户端无法有效识别HTTP错误码和业务错误，其原因在于HTTP协议定义的错误码十分偏向底层，而REST API属于“高层”协议，不应该复用底层的错误码。

问题四：如何定义错误码

REST架构本身同样没有标准的错误码定义一说，因此，有的Web应用使用数字1000、1001……作为错误码，例如Twitter和新浪微博，有的Web应用使用字符串作为错误码，例如YouTube。到底哪一种比较好呢？

我们强烈建议使用字符串作为错误码。原因在于，使用数字作为错误码时，API提供者需要维护一份错误码代码说明表，并且，该文档必须时刻与API发布同步，否则，客户端开发者遇到一个文档上没有写明的错误码，就完全不知道发生了什么错误。

使用字符串作为错误码，最大的好处在于不用查表，根据字面意思也能猜个八九不离十。例如，YouTube API如果返回一个错误authError，基本上能猜到是因为认证失败。

我们定义的REST API错误格式如下：

{
    "code": "错误代码",
    "message": "错误描述信息"
}
其中，错误代码命名规范为大类:子类，例如，口令不匹配的登录错误代码为auth:bad_password，用户名不存在的登录错误代码为auth:user_not_found。这样，客户端既可以简单匹配某个类别的错误，也可以精确匹配某个特定的错误。

问题五：如何返回错误

如果一个REST异步函数想要返回错误，一个直观的想法是调用ctx.rest()：

user = processLogin(username, password);
if (user != null) {
    ctx.rest(user);
} else {
    ctx.response.status = 400;
    ctx.rest({
        code: 'auth:user_not_found',
        message: 'user not found'
    });
}
这种方式不好，因为控制流程会混乱，而且，错误只能在Controller函数中输出。

更好的方式是异步函数直接用throw语句抛出错误，让middleware去处理错误：

user = processLogin(username, password);
if (user != null) {
    ctx.rest(user);
} else {
    throw new APIError('auth:user_not_found', 'user not found');
}
这种方式可以在异步函数的任何地方抛出错误，包括调用的子函数内部。

我们只需要稍稍改写一个middleware就可以处理错误：

module.exports = {
    APIError: function (code, message) {
        this.code = code || 'internal:unknown_error';
        this.message = message || '';
    },
    restify: (pathPrefix) => {
        pathPrefix = pathPrefix || '/api/';
        return async (ctx, next) => {
            if (ctx.request.path.startsWith(pathPrefix)) {
                // 绑定rest()方法:
                ctx.rest = (data) => {
                    ctx.response.type = 'application/json';
                    ctx.response.body = data;
                }
                try {
                    await next();
                } catch (e) {
                    // 返回错误:
                    ctx.response.status = 400;
                    ctx.response.type = 'application/json';
                    ctx.response.body = {
                        code: e.code || 'internal:unknown_error',
                        message: e.message || ''
                    };
                }
            } else {
                await next();
            }
        };
    }
};
这个错误处理的好处在于，不但简化了Controller的错误处理（只需要throw，其他不管），并且，在遇到非APIError的错误时，自动转换错误码为internal:unknown_error。

受益于async/await语法，我们在middleware中可以直接用try...catch捕获异常。如果是callback模式，就无法用try...catch捕获，代码结构将混乱得多。

最后，顺便把APIError这个对象export出去。

开发REST API

我们先根据rest-hello和view-koa来创建一个rest-hello的工程，结构如下：

rest-koa/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- controllers/
|  |
|  +- api.js <-- REST API
|  |
|  +- index.js <-- MVC Controllers
|
+- products.js <-- 集中处理Product
|
+- rest.js <-- 支持REST的middleware
|
+- app.js <-- 使用koa的js
|
+- controller.js <-- 扫描注册Controller
|
+- static-files.js <-- 支持静态文件的middleware
|
+- templating.js <-- 支持Nunjucks的middleware
|
+- package.json <-- 项目描述文件
|
+- views/ <-- Nunjucks模板
|
+- static/ <-- 静态资源文件
|
+- node_modules/ <-- npm安装的所有依赖包
在package.json中，我们需要如下依赖包：

"dependencies": {
    "koa": "2.0.0",
    "koa-bodyparser": "3.2.0",
    "koa-router": "7.0.0",
    "nunjucks": "2.4.2",
    "mime": "1.3.4",
    "mz": "2.4.0"
}
运行npm install安装依赖包。

我们在这个工程中约定了如下规范：

REST API的返回值全部是object对象，而不是简单的number、boolean、null或者数组；
REST API必须使用前缀/api/。
第一条规则实际上是为了方便客户端处理结果。如果返回结果不是object，则客户端反序列化后还需要判断类型。以Objective-C为例，可以直接返回NSDictionary*：

NSDictionary* dict = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&err];
如果返回值可能是number、boolean、null或者数组，则客户端的工作量会大大增加。

Service

为了操作Product，我们用products.js封装所有操作，可以把它视为一个Service：

var id = 0;

function nextId() {
    id++;
    return 'p' + id;
}

function Product(name, manufacturer, price) {
    this.id = nextId();
    this.name = name;
    this.manufacturer = manufacturer;
    this.price = price;
}

var products = [
    new Product('iPhone 7', 'Apple', 6800),
    new Product('ThinkPad T440', 'Lenovo', 5999),
    new Product('LBP2900', 'Canon', 1099)
];

module.exports = {
    getProducts: () => {
        return products;
    },

    getProduct: (id) => {
        var i;
        for (i = 0; i < products.length; i++) {
            if (products[i].id === id) {
                return products[i];
            }
        }
        return null;
    },

    createProduct: (name, manufacturer, price) => {
        var p = new Product(name, manufacturer, price);
        products.push(p);
        return p;
    },

    deleteProduct: (id) => {
        var
            index = -1,
            i;
        for (i = 0; i < products.length; i++) {
            if (products[i].id === id) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            // remove products[index]:
            return products.splice(index, 1)[0];
        }
        return null;
    }
};
变量products相当于在内存中模拟了数据库，这里是为了简化逻辑。

API

紧接着，我们编写api.js，并放到controllers目录下：

const products = require('../products');

const APIError = require('../rest').APIError;

module.exports = {
    'GET /api/products': async (ctx, next) => {
        ctx.rest({
            products: products.getProducts()
        });
    },

    'POST /api/products': async (ctx, next) => {
        var p = products.createProduct(ctx.request.body.name, ctx.request.body.manufacturer, parseFloat(ctx.request.body.price));
        ctx.rest(p);
    },

    'DELETE /api/products/:id': async (ctx, next) => {
        console.log(`delete product ${ctx.params.id}...`);
        var p = products.deleteProduct(ctx.params.id);
        if (p) {
            ctx.rest(p);
        } else {
            throw new APIError('product:not_found', 'product not found by id.');
        }
    }
};
该API支持GET、POST和DELETE这三个请求。当然，还可以添加更多的API。

编写API时，需要注意：

如果客户端传递了JSON格式的数据（例如，POST请求），则async函数可以通过ctx.request.body直接访问已经反序列化的JavaScript对象。这是由bodyParser()这个middleware完成的。如果ctx.request.body为undefined，说明缺少middleware，或者middleware没有正确配置。

如果API路径带有参数，参数必须用:表示，例如，DELETE /api/products/:id，客户端传递的URL可能就是/api/products/A001，参数id对应的值就是A001，要获得这个参数，我们用ctx.params.id。

类似的，如果API路径有多个参数，例如，/api/products/:pid/reviews/:rid，则这两个参数分别用ctx.params.pid和ctx.params.rid获取。

这个功能由koa-router这个middleware提供。

请注意：API路径的参数永远是字符串！

MVC

有了API以后，我们就可以编写MVC，在页面上调用API完成操作。

先在controllers目录下创建index.js，编写页面入口函数：

module.exports = {
    'GET /': async (ctx, next) => {
        ctx.render('index.html');
    }
};
然后，我们在views目录下创建index.html，编写JavaScript代码读取Products：

$(function () {
    var vm = new Vue({
        el: '#product-list',
        data: {
            products: []
        }
    });

    $.getJSON('/api/products').done(function (data) {
        vm.products = data.products;
    }).fail(function (jqXHR, textStatus) {
        alert('Error: ' + jqXHR.status);
    });
});
与VM对应的HTML如下：

<table id="product-list" class="table table-hover">
    <thead>
        <tr>
            <th style="width:50px"></th>
            <th>Product</th>
            <th style="width:150px">Price</th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="p in products">
            <td>
                <img class="media-object" style="width:40px; height:40px;" src="/static/images/icon.png">
            </td>
            <td>
                <h4 class="media-heading" v-text="p.name"></h4>
                <p><span v-text="p.manufacturer"></span></p>
            </td>
            <td>
                <p style="font-size:2em">¥ <span v-text="p.price"></span></p>
            </td>
        </tr>
    </tbody>
</table>
当products变化时，Vue会自动更新表格的内容。

类似的，可以添加创建和删除Product的功能，并且刷新变量products的内容，就可以实时更新Product列表。

最终的页面效果如下：

rest-web

右侧可以通过POST /api/products创建新的Product，左侧可以通过GET /api/products列出所有Product，并且还可以通过DELETE /api/products/<id>来删除某个Product。

# MVVM
什么是MVVM？MVVM是Model-View-ViewModel的缩写。

要编写可维护的前端代码绝非易事。我们已经用MVC模式通过koa实现了后端数据、模板页面和控制器的分离，但是，对于前端来说，还不够。

这里有童鞋会问，不是讲Node后端开发吗？怎么又回到前端开发了？

对于一个全栈开发工程师来说，懂前端才会开发出更好的后端程序（不懂前端的后端工程师会设计出非常难用的API），懂后端才会开发出更好的前端程序。程序设计的基本思想在前后端都是通用的，两者并无本质的区别。这和“不想当厨子的裁缝不是好司机”是一个道理。

当我们用Node.js有了一整套后端开发模型后，我们对前端开发也会有新的认识。由于前端开发混合了HTML、CSS和JavaScript，而且页面众多，所以，代码的组织和维护难度其实更加复杂，这就是MVVM出现的原因。

在了解MVVM之前，我们先回顾一下前端发展的历史。

在上个世纪的1989年，欧洲核子研究中心的物理学家Tim Berners-Lee发明了超文本标记语言（HyperText Markup Language），简称HTML，并在1993年成为互联网草案。从此，互联网开始迅速商业化，诞生了一大批商业网站。

最早的HTML页面是完全静态的网页，它们是预先编写好的存放在Web服务器上的html文件。浏览器请求某个URL时，Web服务器把对应的html文件扔给浏览器，就可以显示html文件的内容了。

如果要针对不同的用户显示不同的页面，显然不可能给成千上万的用户准备好成千上万的不同的html文件，所以，服务器就需要针对不同的用户，动态生成不同的html文件。一个最直接的想法就是利用C、C++这些编程语言，直接向浏览器输出拼接后的字符串。这种技术被称为CGI：Common Gateway Interface。

很显然，像新浪首页这样的复杂的HTML是不可能通过拼字符串得到的。于是，人们又发现，其实拼字符串的时候，大多数字符串都是HTML片段，是不变的，变化的只有少数和用户相关的数据，所以，又出现了新的创建动态HTML的方式：ASP、JSP和PHP——分别由微软、SUN和开源社区开发。

在ASP中，一个asp文件就是一个HTML，但是，需要替换的变量用特殊的<%=var%>标记出来了，再配合循环、条件判断，创建动态HTML就比CGI要容易得多。

但是，一旦浏览器显示了一个HTML页面，要更新页面内容，唯一的方法就是重新向服务器获取一份新的HTML内容。如果浏览器想要自己修改HTML页面的内容，就需要等到1995年年底，JavaScript被引入到浏览器。

有了JavaScript后，浏览器就可以运行JavaScript，然后，对页面进行一些修改。JavaScript还可以通过修改HTML的DOM结构和CSS来实现一些动画效果，而这些功能没法通过服务器完成，必须在浏览器实现。

用JavaScript在浏览器中操作HTML，经历了若干发展阶段：

第一阶段，直接用JavaScript操作DOM节点，使用浏览器提供的原生API：

var dom = document.getElementById('name');
dom.innerHTML = 'Homer';
dom.style.color = 'red';
第二阶段，由于原生API不好用，还要考虑浏览器兼容性，jQuery横空出世，以简洁的API迅速俘获了前端开发者的芳心：

$('#name').text('Homer').css('color', 'red');
第三阶段，MVC模式，需要服务器端配合，JavaScript可以在前端修改服务器渲染后的数据。

现在，随着前端页面越来越复杂，用户对于交互性要求也越来越高，想要写出Gmail这样的页面，仅仅用jQuery是远远不够的。MVVM模型应运而生。

MVVM最早由微软提出来，它借鉴了桌面应用程序的MVC思想，在前端页面中，把Model用纯JavaScript对象表示，View负责显示，两者做到了最大限度的分离。

把Model和View关联起来的就是ViewModel。ViewModel负责把Model的数据同步到View显示出来，还负责把View的修改同步回Model。

ViewModel如何编写？需要用JavaScript编写一个通用的ViewModel，这样，就可以复用整个MVVM模型了。

一个MVVM框架和jQuery操作DOM相比有什么区别？

我们先看用jQuery实现的修改两个DOM节点的例子：

<!-- HTML -->
<p>Hello, <span id="name">Bart</span>!</p>
<p>You are <span id="age">12</span>.</p>
Hello, Bart!

You are 12.
用jQuery修改name和age节点的内容：

'use strict';

var name = 'Homer';
var age = 51;

$('#name').text(name);
$('#age').text(age);

// 执行代码并观察页面变化
 Run
如果我们使用MVVM框架来实现同样的功能，我们首先并不关心DOM的结构，而是关心数据如何存储。最简单的数据存储方式是使用JavaScript对象：

var person = {
    name: 'Bart',
    age: 12
};
我们把变量person看作Model，把HTML某些DOM节点看作View，并假定它们之间被关联起来了。

要把显示的name从Bart改为Homer，把显示的age从12改为51，我们并不操作DOM，而是直接修改JavaScript对象：

Hello, Bart!

You are 12.
'use strict';

person.name = 'Homer';
person.age = 51;

// 执行代码并观察页面变化
 Run
执行上面的代码，我们惊讶地发现，改变JavaScript对象的状态，会导致DOM结构作出对应的变化！这让我们的关注点从如何操作DOM变成了如何更新JavaScript对象的状态，而操作JavaScript对象比DOM简单多了！

这就是MVVM的设计思想：关注Model的变化，让MVVM框架去自动更新DOM的状态，从而把开发者从操作DOM的繁琐步骤中解脱出来！

## 单向绑定
MVVM就是在前端页面上，应用了扩展的MVC模式，我们关心Model的变化，MVVM框架自动把Model的变化映射到DOM结构上，这样，用户看到的页面内容就会随着Model的变化而更新。

例如，我们定义好一个JavaScript对象作为Model，并且把这个Model的两个属性绑定到DOM节点上：

mvvm-bind

经过MVVM框架的自动转换，浏览器就可以直接显示Model的数据了：

mvvm-result

现在问题来了：MVVM框架哪家强？

目前，常用的MVVM框架有：

Angular：Google出品，名气大，但是很难用；

Backbone.js：入门非常困难，因为自身API太多；

Ember：一个大而全的框架，想写个Hello world都很困难。

我们选择MVVM的目标应该是入门容易，安装简单，能直接在页面写JavaScript，需要更复杂的功能时又能扩展支持。

所以，综合考察，最佳选择是尤雨溪大神开发的MVVM框架：Vue.js

目前，Vue.js的最新版本是2.0，我们会使用2.0版本作为示例。

我们首先创建基于koa的Node.js项目。虽然目前我们只需要在HTML静态页面中编写MVVM，但是很快我们就需要和后端API进行交互，因此，要创建基于koa的项目结构如下：

hello-vue/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- app.js <-- koa app
|
+- static-files.js <-- 支持静态文件的koa middleware
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
|
+- static/ <-- 存放静态资源文件
   |
   +- css/ <-- 存放bootstrap.css等
   |
   +- fonts/ <-- 存放字体文件
   |
   +- js/ <-- 存放各种js文件
   |
   +- index.html <-- 使用MVVM的静态页面
这个Node.js项目的主要目的是作为服务器输出静态网页，因此，package.json仅需要如下依赖包：

"dependencies": {
    "koa": "2.0.0",
    "mime": "1.3.4",
    "mz": "2.4.0"
}
使用npm install安装好依赖包，然后启动app.js，在index.html文件中随便写点内容，确保浏览器可以通过http://localhost:3000/static/index.html访问到该静态文件。

紧接着，我们在index.html中用Vue实现MVVM的一个简单例子。

安装Vue

安装Vue有很多方法，可以用npm或者webpack。但是我们现在的目标是尽快用起来，所以最简单的方法是直接在HTML代码中像引用jQuery一样引用Vue。可以直接使用CDN的地址，例如：

<script src="https://unpkg.com/vue@2.0.1/dist/vue.js"></script>
也可以把vue.js文件下载下来，放到项目的/static/js文件夹中，使用本地路径：

<script src="/static/js/vue.js"></script>
这里需要注意，vue.js是未压缩的用于开发的版本，它会在浏览器console中输出很多有用的信息，帮助我们调试代码。当开发完毕，需要真正发布到服务器时，应该使用压缩过的vue.min.js，它会移除所有调试信息，并且文件体积更小。

编写MVVM

下一步，我们就可以在HTML页面中编写JavaScript代码了。我们的Model是一个JavaScript对象，它包含两个属性：

{
    name: 'Robot',
    age: 15
}
而负责显示的是DOM节点可以用{{ name }}和{{ age}}来引用Model的属性：

<div id="vm">
    <p>Hello, {{ name }}!</p>
    <p>You are {{ age }} years old!</p>
</div>
最后一步是用Vue把两者关联起来。要特别注意的是，在<head>内部编写的JavaScript代码，需要用jQuery把MVVM的初始化代码推迟到页面加载完毕后执行，否则，直接在<head>内执行MVVM代码时，DOM节点尚未被浏览器加载，初始化将失败。正确的写法如下：

<html>
<head>

<!-- 引用jQuery -->
<script src="/static/js/jquery.min.js"></script>

<!-- 引用Vue -->
<script src="/static/js/vue.js"></script>

<script>
// 初始化代码:
$(function () {
    var vm = new Vue({
        el: '#vm',
        data: {
            name: 'Robot',
            age: 15
        }
    });
    window.vm = vm;
});
</script>

</head>

<body>

    <div id="vm">
        <p>Hello, {{ name }}!</p>
        <p>You are {{ age }} years old!</p>
    </div>

</body>
<html>
我们创建一个VM的核心代码如下：

var vm = new Vue({
    el: '#vm',
    data: {
        name: 'Robot',
        age: 15
    }
});
其中，el指定了要把Model绑定到哪个DOM根节点上，语法和jQuery类似。这里的'#vm'对应ID为vm的一个<div>节点：

<div id="vm">
    ...
</div>
在该节点以及该节点内部，就是Vue可以操作的View。Vue可以自动把Model的状态映射到View上，但是不能操作View范围之外的其他DOM节点。

然后，data属性指定了Model，我们初始化了Model的两个属性name和age，在View内部的<p>节点上，可以直接用{{ name }}引用Model的某个属性。

一切正常的话，我们在浏览器中访问http://localhost:3000/static/index.html，可以看到页面输出为：

Hello, Robot!
You are 15 years old!
如果打开浏览器console，因为我们用代码window.vm = vm，把VM变量绑定到了window对象上，所以，可以直接修改VM的Model：

window.vm.name = 'Bob'
执行上述代码，可以观察到页面立刻发生了变化，原来的Hello, Robot!自动变成了Hello, Bob!。Vue作为MVVM框架会自动监听Model的任何变化，在Model数据变化时，更新View的显示。这种Model到View的绑定我们称为单向绑定。

经过CSS修饰后的页面如下：

hello-vue

可以在页面直接输入JavaScript代码改变Model，并观察页面变化。

单向绑定

在Vue中，可以直接写{{ name }}绑定某个属性。如果属性关联的是对象，还可以用多个.引用，例如，{{ address.zipcode }}。

另一种单向绑定的方法是使用Vue的指令v-text，写法如下：

<p>Hello, <span v-text="name"></span>!</p>
这种写法是把指令写在HTML节点的属性上，它会被Vue解析，该节点的文本内容会被绑定为Model的指定属性，注意不能再写双花括号{{ }}。

## 双向绑定
单向绑定非常简单，就是把Model绑定到View，当我们用JavaScript代码更新Model时，View就会自动更新。

有单向绑定，就有双向绑定。如果用户更新了View，Model的数据也自动被更新了，这种情况就是双向绑定。

什么情况下用户可以更新View呢？填写表单就是一个最直接的例子。当用户填写表单时，View的状态就被更新了，如果此时MVVM框架可以自动更新Model的状态，那就相当于我们把Model和View做了双向绑定：

mvvm-2way-binding

在浏览器中，当用户修改了表单的内容时，我们绑定的Model会自动更新：

mvvm-form

在Vue中，使用双向绑定非常容易，我们仍然先创建一个VM实例：

$(function () {
    var vm = new Vue({
        el: '#vm',
        data: {
            email: '',
            name: ''
        }
    });
    window.vm = vm;
});
然后，编写一个HTML FORM表单，并用v-model指令把某个<input>和Model的某个属性作双向绑定：

<form id="vm" action="#">
    <p><input v-model="email"></p>
    <p><input v-model="name"></p>
</form>
我们可以在表单中输入内容，然后在浏览器console中用window.vm.$data查看Model的内容，也可以用window.vm.name查看Model的name属性，它的值和FORM表单对应的<input>是一致的。

如果在浏览器console中用JavaScript更新Model，例如，执行window.vm.name='Bob'，表单对应的<input>内容就会立刻更新。

除了<input type="text">可以和字符串类型的属性绑定外，其他类型的<input>也可以和相应数据类型绑定：

多个checkbox可以和数组绑定：

<label><input type="checkbox" v-model="language" value="zh"> Chinese</label>
<label><input type="checkbox" v-model="language" value="en"> English</label>
<label><input type="checkbox" v-model="language" value="fr"> French</label>
对应的Model为：

language: ['zh', 'en']
单个checkbox可以和boolean类型变量绑定：

<input type="checkbox" v-model="subscribe">
对应的Model为：

subscribe: true; // 根据checkbox是否选中为true/false
下拉框<select>绑定的是字符串，但是要注意，绑定的是value而非用户看到的文本：

<select v-model="city">
    <option value="bj">Beijing</option>
    <option value="sh">Shanghai</option>
    <option value="gz">Guangzhou</option>
</select>
对应的Model为：

city: 'bj' // 对应option的value
双向绑定最大的好处是我们不再需要用jQuery去查询表单的状态，而是直接获得了用JavaScript对象表示的Model。

处理事件

当用户提交表单时，传统的做法是响应onsubmit事件，用jQuery获取表单内容，检查输入是否有效，最后提交表单，或者用AJAX提交表单。

现在，获取表单内容已经不需要了，因为双向绑定直接让我们获得了表单内容，并且获得了合适的数据类型。

响应onsubmit事件也可以放到VM中。我们在<form>元素上使用指令：

<form id="vm" v-on:submit.prevent="register">
其中，v-on:submit="register"指令就会自动监听表单的submit事件，并调用register方法处理该事件。使用.prevent表示阻止事件冒泡，这样，浏览器不再处理<form>的submit事件。

因为我们指定了事件处理函数是register，所以需要在创建VM时添加一个register函数：

var vm = new Vue({
    el: '#vm',
    data: {
        ...
    },
    methods: {
        register: function () {
            // 显示JSON格式的Model:
            alert(JSON.stringify(this.$data));
            // TODO: AJAX POST...
        }
    }
});
在register()函数内部，我们可以用AJAX把JSON格式的Model发送给服务器，就完成了用户注册的功能。

使用CSS修饰后的页面效果如下：

mvvm-form

## 同步DOM结构
除了简单的单向绑定和双向绑定，MVVM还有一个重要的用途，就是让Model和DOM的结构保持同步。

我们用一个TODO的列表作为示例，从用户角度看，一个TODO列表在DOM结构的表现形式就是一组<li>节点：

<ol>
    <li>
        <dl>
            <dt>产品评审</dt>
            <dd>新款iPhone上市前评审</dd>
        </dl>
    </li>
    <li>
        <dl>
            <dt>开发计划</dt>
            <dd>与PM确定下一版Android开发计划</dd>
        </dl>
    </li>
    <li>
        <dl>
            <dt>VC会议</dt>
            <dd>敲定C轮5000万美元融资</dd>
        </dl>
    </li>
</ol>
而对应的Model可以用JavaScript数组表示：

todos: [
    {
        name: '产品评审',
        description: '新款iPhone上市前评审'
    },
    {
        name: '开发计划',
        description: '与PM确定下一版Android开发计划'
    },
    {
        name: 'VC会议',
        description: '敲定C轮5000万美元融资'
    }
]
使用MVVM时，当我们更新Model时，DOM结构会随着Model的变化而自动更新。当todos数组增加或删除元素时，相应的DOM节点会增加<li>或者删除<li>节点。

在Vue中，可以使用v-for指令来实现：

<ol>
    <li v-for="t in todos">
        <dl>
            <dt>{{ t.name }}</dt>
            <dd>{{ t.description }}</dd>
        </dl>
    </li>
</ol>
v-for指令把数组和一组<li>元素绑定了。在<li>元素内部，用循环变量t引用某个属性，例如，{{ t.name }}。这样，我们只关心如何更新Model，不关心如何增删DOM节点，大大简化了整个页面的逻辑。

我们可以在浏览器console中用window.vm.todos[0].name='计划有变'查看View的变化，或者通过window.vm.todos.push({name:'新计划',description:'blabla...'})来增加一个数组元素，从而自动添加一个<li>元素。

需要注意的是，Vue之所以能够监听Model状态的变化，是因为JavaScript语言本身提供了Proxy或者Object.observe()机制来监听对象状态的变化。但是，对于数组元素的赋值，却没有办法直接监听，因此，如果我们直接对数组元素赋值：

vm.todos[0] = {
    name: 'New name',
    description: 'New description'
};
会导致Vue无法更新View。

正确的方法是不要对数组元素赋值，而是更新：

vm.todos[0].name = 'New name';
vm.todos[0].description = 'New description';
或者，通过splice()方法，删除某个元素后，再添加一个元素，达到“赋值”的效果：

var index = 0;
var newElement = {...};
vm.todos.splice(index, 1, newElement);
Vue可以监听数组的splice、push、unshift等方法调用，所以，上述代码可以正确更新View。

用CSS修饰后的页面效果如下：

todo-mvvm

## 集成API
在上一节中，我们用Vue实现了一个简单的TODO应用。通过对Model的更新，DOM结构可以同步更新。

现在，如果要把这个简单的TODO应用变成一个用户能使用的Web应用，我们需要解决几个问题：

用户的TODO数据应该从后台读取；
对TODO的增删改必须同步到服务器后端；
用户在View上必须能够修改TODO。
第1个和第2个问题都是和API相关的。只要我们实现了合适的API接口，就可以在MVVM内部更新Model的同时，通过API把数据更新反映到服务器端，这样，用户数据就保存到了服务器端，下次打开页面时就可以读取TODO列表。

我们在vue-todo的基础上创建vue-todo-2项目，结构如下：

vue-todo-2/
|
+- .vscode/
|  |
|  +- launch.json <-- VSCode 配置文件
|
+- app.js <-- koa app
|
+- static-files.js <-- 支持静态文件的koa middleware
|
+- controller.js <-- 支持路由的koa middleware
|
+- rest.js <-- 支持REST的koa middleware
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm安装的所有依赖包
|
+- controllers/ <-- 存放Controller
|  |
|  +- api.js <-- REST API
|
+- static/ <-- 存放静态资源文件
   |
   +- css/ <-- 存放bootstrap.css等
   |
   +- fonts/ <-- 存放字体文件
   |
   +- js/ <-- 存放各种js文件
   |
   +- index.html <-- 使用MVVM的静态页面
在api.js文件中，我们用数组在服务器端模拟一个数据库，然后实现以下4个API：

GET /api/todos：返回所有TODO列表；
POST /api/todos：创建一个新的TODO，并返回创建后的对象；
PUT /api/todos/:id：更新一个TODO，并返回更新后的对象；
DELETE /api/todos/:id：删除一个TODO。
和上一节的TODO数据结构相比，我们需要增加一个id属性，来唯一标识一个TODO。

准备好API后，在Vue中，我们如何把Model的更新同步到服务器端？

有两个方法，一是直接用jQuery的AJAX调用REST API，不过这种方式比较麻烦。

第二个方法是使用vue-resource这个针对Vue的扩展，它可以给VM对象加上一个$resource属性，通过$resource来方便地操作API。

使用vue-resource只需要在导入vue.js后，加一行<script>导入vue-resource.min.js文件即可。可以直接使用CDN的地址：

<script src="https://cdn.jsdelivr.net/vue.resource/1.0.3/vue-resource.min.js"></script>
我们给VM增加一个init()方法，读取TODO列表：

var vm = new Vue({
    el: '#vm',
    data: {
        title: 'TODO List',
        todos: []
    },
    created: function () {
        this.init();
    },
    methods: {
        init: function () {
            var that = this;
            that.$resource('/api/todos').get().then(function (resp) {
                // 调用API成功时调用json()异步返回结果:
                resp.json().then(function (result) {
                    // 更新VM的todos:
                    that.todos = result.todos;
                });
            }, function (resp) {
                // 调用API失败:
                alert('error');
            });
        }
    }
});
注意到创建VM时，created指定了当VM初始化成功后的回调函数，这样，init()方法会被自动调用。

类似的，对于添加、修改、删除的操作，我们也需要往VM中添加对应的函数。以添加为例：

var vm = new Vue({
    ...
    methods: {
        ...
        create: function (todo) {
            var that = this;
            that.$resource('/api/todos').save(todo).then(function (resp) {
                resp.json().then(function (result) {
                    that.todos.push(result);
                });
            }, showError);
        },
        update: function (todo, prop, e) {
            ...
        },
        remove: function (todo) {
            ...
        }
    }
});
添加操作需要一个额外的表单，我们可以创建另一个VM对象vmAdd来对表单作双向绑定，然后，在提交表单的事件中调用vm对象的create方法：

var vmAdd = new Vue({
    el: '#vmAdd',
    data: {
        name: '',
        description: ''
    },
    methods: {
        submit: function () {
            vm.create(this.$data);
        }
    }
});
vmAdd和FORM表单绑定：

<form id="vmAdd" action="#0" v-on:submit.prevent="submit">
    <p><input type="text" v-model="name"></p>
    <p><input type="text" v-model="description"></p>
    <p><button type="submit">Add</button></p>
</form>
最后，把vm绑定到对应的DOM：

<div id="vm">
    <h3>{{ title }}</h3>
    <ol>
        <li v-for="t in todos">
            <dl>
                <dt contenteditable="true" v-on:blur="update(t, 'name', $event)">{{ t.name }}</dt>
                <dd contenteditable="true" v-on:blur="update(t, 'description', $event)">{{ t.description }}</dd>
                <dd><a href="#0" v-on:click="remove(t)">Delete</a></dd>
            </dl>
        </li>
    </ol>
</div>
这里我们用contenteditable="true"让DOM节点变成可编辑的，用v-on:blur="update(t, 'name', $event)"在编辑结束时调用update()方法并传入参数，特殊变量$event表示DOM事件本身。

删除TODO是通过对<a>节点绑定v-on:click事件并调用remove()方法实现的。

如果一切无误，我们就可以先启动服务器，然后在浏览器中访问http://localhost:3000/static/index.html，对TODO进行增删改等操作，操作结果会保存在服务器端。

通过Vue和vue-resource插件，我们用简单的几十行代码就实现了一个真正可用的TODO应用。

使用CSS修饰后的页面效果如下：

mvvm-todo-2


## 在线电子表格
利用MVVM，很多非常复杂的前端页面编写起来就非常容易了。这得益于我们把注意力放在Model的结构上，而不怎么关心DOM的操作。

本节我们演示如何利用Vue快速创建一个在线电子表格：

mini-excel

首先，我们定义Model的结构，它的主要数据就是一个二维数组，每个单元格用一个JavaScript对象表示：
```json
data: {
    title: 'New Sheet',
    header: [ // 对应首行 A, B, C...
        { row: 0, col: 0, text: '' },
        { row: 0, col: 1, text: 'A' },
        { row: 0, col: 2, text: 'B' },
        { row: 0, col: 3, text: 'C' },
        ...
        { row: 0, col: 10, text: 'J' }
    ],
    rows: [
        [
            { row: 1, col: 0, text: '1' },
            { row: 1, col: 1, text: '' },
            { row: 1, col: 2, text: '' },
            ...
            { row: 1, col: 10, text: '' },
        ],
        [
            { row: 2, col: 0, text: '2' },
            { row: 2, col: 1, text: '' },
            { row: 2, col: 2, text: '' },
            ...
            { row: 2, col: 10, text: '' },
        ],
        ...
        [
            { row: 10, col: 0, text: '10' },
            { row: 10, col: 1, text: '' },
            { row: 10, col: 2, text: '' },
            ...
            { row: 10, col: 10, text: '' },
        ]
    ],
    selectedRowIndex: 0, // 当前活动单元格的row
    selectedColIndex: 0 // 当前活动单元格的col
}
```

紧接着，我们就可以把Model的结构映射到一个<table>上：
```html
<table id="sheet">
    <thead>
        <tr>
            <th v-for="cell in header" v-text="cell.text"></th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="tr in rows">
            <td v-for="cell in tr" v-text="cell.text"></td>
        </tr>
    </tbody>
</table>
```

现在，用Vue把Model和View关联起来，这个电子表格的原型已经可以运行了！

下一步，我们想在单元格内输入一些文本，怎么办？

因为不是所有单元格都可以被编辑，首行和首列不行。首行对应的是<th>，默认是不可编辑的，首列对应的是第一列的<td>，所以，需要判断某个<td>是否可编辑，我们用v-bind指令给某个DOM元素绑定对应的HTML属性：

<td v-for="cell in tr" v-bind:contenteditable="cell.contentEditable" v-text="cell.text"></td>

在Model中给每个单元格对象加上contentEditable属性，就可以决定哪些单元格可编辑。

最后，给<td>绑定click事件，记录当前活动单元格的row和col，再绑定blur事件，在单元格内容编辑结束后更新Model：

<td v-for="cell in tr" v-on:click="focus(cell)" v-on:blur="change" ...></td>

对应的两个方法要添加到VM中：
```js
var vm = new Vue({
    ...
    methods: {
        focus: function (cell) {
            this.selectedRowIndex = cell.row;
            this.selectedColIndex = cell.col;
        },
        change: function (e) {
            // change事件传入的e是DOM事件
            var
                rowIndex = this.selectedRowIndex,
                colIndex = this.selectedColIndex,
                text;
            if (rowIndex > 0 && colIndex > 0) {
                text = e.target.innerText; // 获取td的innerText
                this.rows[rowIndex - 1][colIndex].text = text;
            }
        }
    }
});
```

现在，单元格已经可以编辑，并且用户的输入会自动更新到Model中。

如果我们要给单元格的文本添加格式，例如，左对齐或右对齐，可以给Model对应的对象添加一个align属性，然后用v-bind:style绑定到<td>上：

<td v-for="cell in tr" ... v-bind:style="{ textAlign: cell.align }"></td>

然后，创建工具栏，给左对齐、居中对齐和右对齐按钮编写click事件代码，调用setAlign()函数：
```js
function setAlign(align) {
    var
        rowIndex = vm.selectedRowIndex,
        colIndex = vm.selectedColIndex,
        row, cell;
    if (rowIndex > 0 && colIndex > 0) {
        row = vm.rows[rowIndex - 1];
        cell = row[colIndex];
        cell.align = align;
    }
}

// 给按钮绑定事件:
$('#cmd-left').click(function () { setAlign('left'); });
$('#cmd-center').click(function () { setAlign('center'); });
$('#cmd-right').click(function () { setAlign('right'); });
```

现在，点击某个单元格，再点击右对齐按钮，单元格文本就变成右对齐了。

类似的，可以继续添加其他样式，例如字体、字号等。

MVVM的适用范围

从几个例子我们可以看到，MVVM最大的优势是编写前端逻辑非常复杂的页面，尤其是需要大量DOM操作的逻辑，利用MVVM可以极大地简化前端页面的逻辑。

但是MVVM不是万能的，它的目的是为了解决复杂的前端逻辑。对于以展示逻辑为主的页面，例如，新闻，博客、文档等，不能使用MVVM展示数据，因为这些页面需要被搜索引擎索引，而搜索引擎无法获取使用MVVM并通过API加载的数据。

所以，需要SEO（Search Engine Optimization）的页面，不能使用MVVM展示数据。不需要SEO的页面，如果前端逻辑复杂，就适合使用MVVM展示数据，例如，工具类页面，复杂的表单页面，用户登录后才能操作的页面等等。


# 自动化工具

## react

## vue+webpack

## Gulp+Webpack

## Grunt

## Gulp

## Webpack













