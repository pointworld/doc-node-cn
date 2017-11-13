# HTTPS
> 稳定性: 2 - 稳定的

HTTPS 是 HTTP 基于 TLS/SSL 的版本。在 Node.js 中，它被实现为一个独立的模块。


## Class: https.Agent
<!-- YAML
added: v0.4.5
-->

HTTPS 的一个类似于 [`http.Agent`] 的代理对象。查看 [`https.request()`] 获取更多信息。


## Class: https.Server
<!-- YAML
added: v0.4.5
-->

HTTPS 的一个类似于 [`http.Agent`] 的代理对象。查看 [`https.request()`] 获取更多信息。


### server.setTimeout([msecs][, callback])
<!-- YAML
added: v0.11.2
-->
- `msecs` {number} 默认值是 120000 (2 分钟).
- `callback` {Function}

查看 [`http.Server#setTimeout()`]。

### server.timeout
<!-- YAML
added: v0.11.2
-->
- {number} 默认值是 120000 (2 分钟).

查看 [`http.Server#timeout`]。

### server.keepAliveTimeout
<!-- YAML
added: v8.0.0
-->
- {number} 默认值是 5000 (5 秒钟).
查看 [`http.Server#keepAliveTimeout`][].


## https.createServer([options][, requestListener])
<!-- YAML
added: v0.3.4
-->
- `options` {Object} 接受来自 [`tls.createServer()`][] 和 [`tls.createSecureContext()`][] 的 `options` .
- `requestListener` {Function} 添加到 `request` 事件的监听器.

例子:

```js
// curl -k https://localhost:8000/
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);
```

或者

```js
const https = require('https');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('test/fixtures/test_cert.pfx'),
  passphrase: 'sample'
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);
```


### server.close([callback])
<!-- YAML
added: v0.1.90
-->
- `callback` {Function}

查看 [`http.close()`] 获取细节。


### server.listen(handle[, callback])
- `handle` {Object}
- `callback` {Function}

### server.listen(path[, callback])
- `path` {string}
- `callback` {Function}

### server.listen([port][, host][, backlog][, callback])

- `port` {number}
- `hostname` {string}
- `backlog` {number}
- `callback` {Function}

查看 [`http.listen()`] 获取细节。



## https.get(options[, callback])

- `port` {number}
- `hostname` {string}
- `backlog` {number}
- `callback` {Function}

查看 [`http.listen()`] 获取细节。


## https.globalAgent
<!-- YAML
added: v0.5.9
-->

[`https.Agent`] 的全局实例，用于所有 HTTPS 客户端请求。


## https.request(options[, callback])
<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->
- `options` {Object | string | URL} Accepts all `options` from [`http.request()`][],
  with some differences in default values:
  - `protocol` Defaults to `https:`
  - `port` Defaults to `443`.
  - `agent` Defaults to `https.globalAgent`.
- `callback` {Function}

向一个安全的服务器发起一个请求。

The following additional `options` from [`tls.connect()`][] are also accepted when using a
  custom [`Agent`][]:
  `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

参数 `options` 可以是一个对象、或字符串、或 [`URL`] 对象。
如果参数 `options` 是一个字符串, 它自动被 [`url.parse()`] 所解析。
If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

例子:

```js
const https = require('https');

const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log('状态码：', res.statusCode);
  console.log('请求头：', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
```

Example using options from [`tls.connect()`][]:

```js
const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET',
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};
options.agent = new https.Agent(options);

const req = https.request(options, (res) => {
  // ...
});
```

也可以不对连接池使用 `Agent`。

例子:

```js
const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET',
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem'),
  agent: false
};

const req = https.request(options, (res) => {
  // ...
});
```

Example using a [`URL`][] as `options`:

```js
const { URL } = require('url');

const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```


[`Agent`]: #https_class_https_agent
[`URL`]: url.html#url_the_whatwg_url_api
[`http.Agent`]: http.html#http_class_http_agent
[`http.Server#keepAliveTimeout`]: http.html#http_server_keepalivetimeout
[`http.Server#setTimeout()`]: http.html#http_server_settimeout_msecs_callback
[`http.Server#timeout`]: http.html#http_server_timeout
[`http.Server`]: http.html#http_class_http_server
[`http.close()`]: http.html#http_server_close_callback
[`http.get()`]: http.html#http_http_get_options_callback
[`http.listen()`]: http.html#http_server_listen_port_hostname_backlog_callback
[`http.request()`]: http.html#http_http_request_options_callback
[`https.Agent`]: #https_class_https_agent
[`https.request()`]: #https_https_request_options_callback
[`tls.connect()`]: tls.html#tls_tls_connect_options_callback
[`tls.createSecureContext()`]: tls.html#tls_tls_createsecurecontext_options
[`tls.createServer()`]: tls.html#tls_tls_createserver_options_secureconnectionlistener
[`url.parse()`]: url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost
