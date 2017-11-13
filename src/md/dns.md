
# DNS

> 稳定性: 2 - 稳定的

`dns` 模块包含两类函数：

1) 第一类函数，使用底层操作系统工具进行域名解析，且无需进行网络通信。
这类函数只有一个：[`dns.lookup()`]。

例子，查找 `iana.org`：

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
  console.log('IP 地址: %j 地址族: IPv%s', address, family);
});
// IP 地址: "192.0.43.8" 地址族: IPv4
```

2) 第二类函数，连接到一个真实的 DNS 服务器进行域名解析，且始终使用网络进行 DNS 查询。
这类函数包含了 `dns` 模块中除 [`dns.lookup()`] 以外的所有函数。
这些函数使用与 `dns.lookup()` 不同的配置文件（例如 `/etc/hosts`）。
这类函数适合于那些不想使用底层操作系统工具进行域名解析、而是想使用网络进行 DNS 查询的开发者。

例子，解析 `'archive.org'` 然后逆向解析返回的 IP 地址：

```js
const dns = require('dns');

dns.resolve4('archive.org', (err, addresses) => {
  if (err) throw err;

  console.log(`IP 地址: ${JSON.stringify(addresses)}`);

  addresses.forEach((a) => {
    dns.reverse(a, (err, hostnames) => {
      if (err) {
        throw err;
      }
      console.log(`IP 地址 ${a} 逆向解析到域名: ${JSON.stringify(hostnames)}`);
    });
  });
});
```

两类函数有微妙的差别，详见 [实现上的注意事项]。


## Class dns.Resolver
<!-- YAML
added: v8.3.0
-->

An independent resolver for DNS requests.

Note that creating a new resolver uses the default server settings. Setting
the servers used for a resolver using
[`resolver.setServers()`][`dns.setServers()`] does not affect
other resolver:

```js
const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['4.4.4.4']);

// This request will use the server at 4.4.4.4, independent of global settings.
resolver.resolve4('example.org', (err, addresses) => {
  // ...
});
```

The following methods from the `dns` module are available:

* [`resolver.getServers()`][`dns.getServers()`]
* [`resolver.setServers()`][`dns.setServers()`]
* [`resolver.resolve()`][`dns.resolve()`]
* [`resolver.resolve4()`][`dns.resolve4()`]
* [`resolver.resolve6()`][`dns.resolve6()`]
* [`resolver.resolveAny()`][`dns.resolveAny()`]
* [`resolver.resolveCname()`][`dns.resolveCname()`]
* [`resolver.resolveMx()`][`dns.resolveMx()`]
* [`resolver.resolveNaptr()`][`dns.resolveNaptr()`]
* [`resolver.resolveNs()`][`dns.resolveNs()`]
* [`resolver.resolvePtr()`][`dns.resolvePtr()`]
* [`resolver.resolveSoa()`][`dns.resolveSoa()`]
* [`resolver.resolveSrv()`][`dns.resolveSrv()`]
* [`resolver.resolveTxt()`][`dns.resolveTxt()`]
* [`resolver.reverse()`][`dns.reverse()`]

### resolver.cancel()
<!-- YAML
added: v8.3.0
-->

Cancel all outstanding DNS queries made by this resolver. The corresponding
callbacks will be called with an error with code `ECANCELLED`.

## dns.getServers()
<!-- YAML
added: v0.11.3
-->

Returns an array of IP address strings, formatted according to [rfc5952][],
that are currently configured for DNS resolution. A string will include a port
section if a custom port is used.

For example:

<!-- eslint-disable semi-->
```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

## dns.lookup(hostname[, options], callback)
<!-- YAML
added: v0.1.90
changes:
  - version: v1.2.0
    pr-url: https://github.com/nodejs/node/pull/744
    description: The `all` option is supported now.
-->
- `hostname` {string}
- `options` {integer | Object}
  - `family` {integer} The record family. Must be `4` or `6`. IPv4
    and IPv6 addresses are both returned by default.
  - `hints` {number} One or more [supported `getaddrinfo` flags][]. Multiple
    flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} When `true`, the callback returns all resolved addresses in
    an array. Otherwise, returns a single address. Defaults to `false`.
- `callback` {Function}
  - `err` {Error}
  - `address` {string} A string representation of an IPv4 or IPv6 address.
  - `family` {integer} `4` or `6`, denoting the family of `address`.

解析`hostname`(例如：`'nodejs.org'`)为第一个找到的A（IPv4）或AAAA（IPv6）记录。`options`可以是对象或者整数。如果`options`没有被提供，那么IPv4 和 IPv6都是有效的。如果`options`是整数，只能是`4`或`6`。

另外，`options`可以是一个含有以下属性的对象：
* `family` {Number} - T地址族。如果提供，必须为整数4或6。如果没有提供，只接受IPv4和IPv6地址。
* `hints`: {Number} - 如果提供，它必须是一个或多个支持的`getaddrinfo`标识。如果没有提供，那么没有标识被传递给`getaddrinfo`。多个标识可以通过在逻辑上`OR`ing它们的值，来传递给hints。支持的`getaddrinfo`标识请参阅下文。有关支持的标志的更多信息请查询[supported `getaddrinfo` flags][]章节。
* `all`: {Boolean} - 值为`true`时， 回调函数返回一个包含所有解析后地址的数组，否则只返回一个地址。默认值为`false`。

所有的参数都是可选的。

回调函数包含`(err, address, family)`参数。`address`是IPv4或IPv6地址字符串。`family`、是整数4或6，表示地址族（不一定是最初传递给查找的值）。

当`all`属性被设置为`true`时，回调函数参数变为`(err, addresses)`，`addresses`则变成一个由`address` 和 `family` 属性组成的对象数组。

发生错误时，`err`是一个[`Error`][]对象，`err.code`是错误码。不仅在主机名不存在时，在如没有可用的文件描述符等情况下查找失败，err.code也会被设置为`'ENOENT'`。

`dns.lookup()` 不需要与DNS协议有任何关系。它仅仅是一个连接名字和地址的操作系统功能。在任何的node.js程序中，它的实现对表现有一些微妙但是重要的影响。在使用`dns.lookup()`之前请花些时间查询[Implementation considerations section][]章节。

使用例子：

```js
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
dns.lookup('example.com', options, (err, address, family) =>
  console.log('address: %j family: IPv%s', address, family));
// address: "2606:2800:220:1:248:1893:25c8:1946" family: IPv6

// When options.all is true, the result will be an Array.
options.all = true;
dns.lookup('example.com', options, (err, addresses) =>
  console.log('addresses: %j', addresses));
// addresses: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

If this method is invoked as its [`util.promisify()`][]ed version, and `all`
is not set to `true`, it returns a Promise for an object with `address` and
`family` properties.


### Supported getaddrinfo flags

The following flags can be passed as hints to [`dns.lookup()`][].

- `dns.ADDRCONFIG`: Returned address types are determined by the types
of addresses supported by the current system. For example, IPv4 addresses
are only returned if the current system has at least one IPv4 address
configured. Loopback addresses are not considered.
- `dns.V4MAPPED`: If the IPv6 family was specified, but no IPv6 addresses were
found, then return IPv4 mapped IPv6 addresses. Note that it is not supported
on some operating systems (e.g FreeBSD 10.1).

## dns.lookupService(address, port, callback)
<!-- YAML
added: v0.11.14
-->
- `address` {string}
- `port` {number}
- `callback` {Function}
  - `err` {Error}
  - `hostname` {string} e.g. `example.com`
  - `service` {string} e.g. `http`

将参数`address`和`port`传入操作系统底层`getnameinfo`服务来解析处理并返回主机名。

如果`address`不是有效的IP地址，会抛出`TypeError`。`port`必须是一个整数.如果不是规定的端口号，会抛出`TypeError`.

出错情况下，`err`是一个`Error`对象，`err.code`代码错误码。

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Prints: localhost ssh
});
```

如果以 [`util.promisify()`][http://nodejs.cn/api/util.html#util_util_promisify_original] 方式进行调用, 它将返回一个包含`hostname`和`service`属性的Promise 对象。


## dns.resolve(hostname[, rrtype], callback)
<!-- YAML
added: v0.1.27
-->
- `hostname` {string} Hostname to resolve.
- `rrtype` {string} Resource record type. Default: `'A'`.
- `callback` {Function}
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Uses the DNS protocol to resolve a hostname (e.g. `'nodejs.org'`) into an array
of the resource records. The `callback` function has arguments
`(err, records)`. When successful, `records` will be an array of resource
records. The type and structure of individual results varies based on `rrtype`:

|  `rrtype` | `records` contains             | Result type | Shorthand method         |
|-----------|--------------------------------|-------------|--------------------------|
| `'A'`     | IPv4 addresses (default)       | {string}    | [`dns.resolve4()`][]     |
| `'AAAA'`  | IPv6 addresses                 | {string}    | [`dns.resolve6()`][]     |
| `'CNAME'` | canonical name records         | {string}    | [`dns.resolveCname()`][] |
| `'MX'`    | mail exchange records          | {Object}    | [`dns.resolveMx()`][]    |
| `'NAPTR'` | name authority pointer records | {Object}    | [`dns.resolveNaptr()`][] |
| `'NS'`    | name server records            | {string}    | [`dns.resolveNs()`][]    |
| `'PTR'`   | pointer records                | {string}    | [`dns.resolvePtr()`][]   |
| `'SOA'`   | start of authority records     | {Object}    | [`dns.resolveSoa()`][]   |
| `'SRV'`   | service records                | {Object}    | [`dns.resolveSrv()`][]   |
| `'TXT'`   | text records                   | {string}    | [`dns.resolveTxt()`][]   |
| `'ANY'`   | any records                    | {Object}    | [`dns.resolveAny()`][]   |

On error, `err` is an [`Error`][] object, where `err.code` is one of the
[DNS error codes](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->
- `hostname` {string} Hostname to resolve.
- `options` {Object}
  - `ttl` {boolean} Retrieve the Time-To-Live value (TTL) of each record.
    When `true`, the callback receives an array of
    `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings,
    with the TTL expressed in seconds.
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

使用`DNS`协议解析IPv4地址主机名(`A`记录)。`adresses`参数是传递给`callback`函数的IPv4地址数组。（例如：`['74.125.79.104', '74.125.79.105', '74.125.79.106']`）



## dns.resolve6(hostname[, options], callback)
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->
- `hostname` {string} Hostname to resolve.
- `options` {Object}
  - `ttl` {boolean} Retrieve the Time-To-Live value (TTL) of each record.
    When `true`, the callback receives an array of
    `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of
    strings, with the TTL expressed in seconds.
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

使用`DNS`协议解析IPv6地址主机名(`AAAA`记录)。`adresses`参数是传递给`callback`函数的IPv6地址数组.



## dns.resolveCname(hostname, callback)
<!-- YAML
added: v0.3.2
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

使用`DNS`协议解析`CNAME`记录主机名。`adresses`参数是传递给`callback`函数规范内有效的主机名数组（例如：`['bar.example.com']`）.


## dns.resolveMx(hostname, callback)
<!-- YAML
added: v0.1.27
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {Object[]}

使用DNS协议处理邮件交换记录主机名(`MX`记录)。`adresses`参数是传递给`callback`函数的主机名对象数组，对象包含`priority`和`exchange`属性（例如： `[{priority: 10, exchange: 'mx.example.com'}, ...]`）。


## dns.resolveNaptr(hostname, callback)
<!-- YAML
added: v0.9.12
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {Object[]}

使用DNS协议来处理基于正则表达式匹配的记录(`NAPTR`记录)的主机名。`adresses`参数是传递给`callback`函数的主机名对象数组，对象包含属性：

* `flags`
* `service`
* `regexp`
* `replacement`
* `order`
* `preference`

例如：

<!-- eslint-skip -->
```js
{
  flags: 's',
  service: 'SIP+D2U',
  regexp: '',
  replacement: '_sip._udp.example.com',
  order: 30,
  preference: 100
}
```



## dns.resolveNs(hostname, callback)

<!-- YAML
added: v0.1.90
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

使用DNS协议处理名称服务器主机名记录(`NS`记录)。`adresses`为有效的名称服务器记录主机名数组（eg:`['ns1.example.com', 'ns2.example.com']`）。


## dns.resolvePtr(hostname, callback)
<!-- YAML
added: v6.0.0
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

使用DNS协议处理主机名引用记录(PTR记录)。`addresses`参数将一个字符串数组传递给回调函数`callback`,其中包含回复记录。


## dns.resolveSoa(hostname, callback)
<!-- YAML
added: v0.11.10
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `address` {Object}

使用DNS协议处理主机名子域名记录(`SOA`记录)。`addresses`参数为一个对象包含以下属性：

* `nsname`
* `hostmaster`
* `serial`
* `refresh`
* `retry`
* `expire`
* `minttl`

<!-- eslint-skip -->
```js
{
  nsname: 'ns.example.com',
  hostmaster: 'root.example.com',
  serial: 2013101809,
  refresh: 10000,
  retry: 2400,
  expire: 604800,
  minttl: 3600
}
```



## dns.resolveSrv(hostname, callback)
<!-- YAML
added: v0.1.27
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {Object[]}

使用DNS协议来处理主机名服务记录(SRV记录)。`callback`函数返回的`addresses`参数为对象数组,每个对象包含以下属性：

* `priority`
* `weight`
* `port`
* `name`

<!-- eslint-skip -->
```js
{
  priority: 10,
  weight: 5,
  port: 21223,
  name: 'service.example.com'
}
```



## dns.resolveTxt(hostname, callback)
<!-- YAML
added: v0.1.27
-->
- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

使用DNS协议处理文本查询主机名(TXT记录)。回调函数`callback`会返回`addresses`参数，它是一个文本记录与主机名一一对应的二维数组(例如：`[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`).
每个数组文本块包含一条记录。根据用例,这些可以是连接在一起或单独对待。


## dns.resolveAny(hostname, callback)

- `hostname` {string}
- `callback` {Function}
  - `err` {Error}
  - `ret` {Object[]}

Uses the DNS protocol to resolve all records (also known as `ANY` or `*` query).
The `ret` argument passed to the `callback` function will be an array containing
various types of records. Each object has a property `type` that indicates the
type of the current record. And depending on the `type`, additional properties
will be present on the object:

| Type | Properties |
|------|------------|
| `"A"` | `address` / `ttl` |
| `"AAAA"` | `address` / `ttl` |
| `"CNAME"` | `value` |
| `"MX"` | Refer to [`dns.resolveMx()`][] |
| `"NAPTR"` | Refer to [`dns.resolveNaptr()`][] |
| `"NS"` | `value` |
| `"PTR"` | `value` |
| `"SOA"` | Refer to [`dns.resolveSoa()`][] |
| `"SRV"` | Refer to [`dns.resolveSrv()`][] |
| `"TXT"` | This type of record contains an array property called `entries` which refers to [`dns.resolveTxt()`][], eg. `{ entries: ['...'], type: 'TXT' }` |

Here is a example of the `ret` object passed to the callback:

<!-- eslint-disable semi -->
```js
[ { type: 'A', address: '127.0.0.1', ttl: 299 },
  { type: 'CNAME', value: 'example.com' },
  { type: 'MX', exchange: 'alt4.aspmx.l.example.com', priority: 50 },
  { type: 'NS', value: 'ns1.example.com' },
  { type: 'TXT', entries: [ 'v=spf1 include:_spf.example.com ~all' ] },
  { type: 'SOA',
    nsname: 'ns1.example.com',
    hostmaster: 'admin.example.com',
    serial: 156696742,
    refresh: 900,
    retry: 900,
    expire: 1800,
    minttl: 60 } ]
```

## dns.reverse(ip, callback)
<!-- YAML
added: v0.1.16
-->
- `ip` {string}
- `callback` {Function}
  - `err` {Error}
  - `hostnames` {string[]}

执行一个反向DNS查询返回IPv4或IPv6地址的主机名的数组。

出错情况下，`err`是一个`Error`对象，`err.code`代码错误码。错误码列表：[here](https://nodejs.org/dist/latest-v8.x/docs/api/dns.html#dns_error_codes).


## dns.setServers(servers)
<!-- YAML
added: v0.11.3
-->
- `servers` {string[]} array of [rfc5952][] formatted addresses

Sets the IP address and port of servers to be used when performing DNS
resolution. The `servers` argument is an array of [rfc5952][] formatted
addresses. If the port is the IANA default DNS port (53) it can be omitted.

For example:

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

`ip`地址无效将会报错。

`dns.setServers()`方法不要在DNS查询过程中使用。



## Error codes
每个DNS查询可以返回一个错误代码如下:

*   `dns.NODATA`: DNS服务返回没有数据.
*   `dns.FORMERR`: DNS服务器查询没有格式化.
*   `dns.SERVFAIL`: DNS服务器返回失败。
*   `dns.NOTFOUND`: 域名未找到。
*   `dns.NOIMP`: DNS服务器不执行请求的操作。
*   `dns.REFUSED`: 查询DNS服务器拒绝。
*   `dns.BADQUERY`:  未格式化DNS查询。
*   `dns.BADNAME`: 未格式化主机名
*   `dns.BADFAMILY`: 没有提供地址族
*   `dns.BADRESP`: 未格式化DNS回复
*   `dns.CONNREFUSED`: 无法连接DNS服务器
*   `dns.TIMEOUT`: 连接DNS服务器超时
*   `dns.EOF`: 文件末尾
*   `dns.FILE`: 读取文件错误
*   `dns.NOMEM`: 内存溢出
*   `dns.DESTRUCTION`: 通道以及销毁
*   `dns.BADSTR`: 未格式化字符串
*   `dns.BADFLAGS`: 指定非法标记
*   `dns.NONAME`: 给定的主机名不是数字。
*   `dns.BADHINTS`: 指定非法的提示标志。
*   `dns.NOTINITIALIZED`: `c-ares`异步DNS请求库初始化未完成。
*   `dns.LOADIPHLPAPI`: 加载`iphlpapi.dll`(Windows IP辅助API应用程序接口模块)错误
*   `dns.ADDRGETNETWORKPARAMS`: 找不到`GetNetworkParams`(读取本机DNS信息)函数
*   `dns.CANCELLED`: DNS查询取消

## Implementation considerations
尽管`dns.lookup()`和各种`dns.resolve *()/ dns.reverse()`函数有相同的目标将网络的名字与网络地址联系在一起(反之亦然)，他们的行为是完全不同的。
这些差异可以有微妙但重大影响着Node.js程序行为。

### `dns.lookup()`
在底层,`dns.lookup()`使用操作系统设施与大多数其他程序相同。例如，`dns.lookup()`几乎总是解析给定的主机名与`ping`命令一样。在许多类POSIX操作系统中，
`dns.lookup()`函数的行为可以通过改变`nsswitch.conf(5)`并且/或`resolv.conf(5)`设置进行改变，但是需要注意改变这些文件就意味着改变所有正在这个操作系统中运行
的所有进程的行为。

尽管以异步`JavaScript`的角度来调用`dns.lookup()`,但在内部`libuv`底层线程池中却是同步的调用`getaddrinfo(3)`。因为`libuv`线程池有固定大小，它意味着,如果出于某种原因调用`getaddrinfo(3)`需要很长时间,其他操作可以运行在libuv线程池中(如文件系统操作)就会存在性能问题。为了缓解这个问题,一个可能的解决办法是增加libuv的线程池大小通过设置`'UV_THREADPOOL_SIZE'`环境变量值大于`4`(当前的默认值).更多libuv线程池信息，请查看：[here](http://docs.libuv.org/en/latest/threadpool.html)

### `dns.resolve()`, `dns.resolve*()` and `dns.reverse()`

这些功能实现与dns.lookup()截然不同。它们不仅没有使用`getaddrinfo(3)`并且通过网络执行DNS查询。使用异步网络通信，并且没有使用libuv线程池。

因此,这些函数不会像使用libuv线程池的`dns.lookup()`函数一样会对其它进程有负面影响。

它们不像`dns.lookup()`一样使用相同的配置文件。例如，它们不会使用来自`/etc/hosts`配置。

[`Error`]: errors.html#errors_class_error
[`dns.lookup()`]: #dns_dns_lookup_hostname_options_callback
[`dns.resolve()`]: #dns_dns_resolve_hostname_rrtype_callback
[`dns.resolve4()`]: #dns_dns_resolve4_hostname_options_callback
[`dns.resolve6()`]: #dns_dns_resolve6_hostname_options_callback
[`dns.resolveCname()`]: #dns_dns_resolvecname_hostname_callback
[`dns.resolveMx()`]: #dns_dns_resolvemx_hostname_callback
[`dns.resolveNaptr()`]: #dns_dns_resolvenaptr_hostname_callback
[`dns.resolveNs()`]: #dns_dns_resolvens_hostname_callback
[`dns.resolvePtr()`]: #dns_dns_resolveptr_hostname_callback
[`dns.resolveSoa()`]: #dns_dns_resolvesoa_hostname_callback
[`dns.resolveSrv()`]: #dns_dns_resolvesrv_hostname_callback
[`dns.resolveTxt()`]: #dns_dns_resolvetxt_hostname_callback
[`dns.resolveAny()`]: #dns_dns_resolveany_hostname_callback
[`dns.getServers()`]: #dns_dns_getservers
[`dns.setServers()`]: #dns_dns_setservers_servers
[`dns.reverse()`]: #dns_dns_reverse_ip_callback
[DNS error codes]: #dns_error_codes
[Implementation considerations section]: #dns_implementation_considerations
[supported `getaddrinfo` flags]: #dns_supported_getaddrinfo_flags
[the official libuv documentation]: http://docs.libuv.org/en/latest/threadpool.html
[`util.promisify()`]: util.html#util_util_promisify_original
[rfc5952]: https://tools.ietf.org/html/rfc5952#section-6

[实现上的注意事项]: #dns_implementation_considerations