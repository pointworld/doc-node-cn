# URL

<!--introduced_in=v0.10.0-->

> 稳定性: 2 - 稳定的

`url` 模块提供了一些实用函数，用于 URL 处理与解析。
可以通过以下方式使用：

```js
const url = require('url');
```

## URL Strings and URL Objects

一个 URL 字符串是一个结构化的字符串，它包含多个有意义的组成部分。
当被解析时，会返回一个 URL 对象，它包含每个组成部分作为属性。

`url`模块提供了两套API来处理URLs：一个是Node.js遗留的特有的API,另一个则是通常使用在web浏览器中
实现了[WHATWG URL Standard]的API.

<!--The `url` module provides two APIs for working with URLs: a legacy API that is
Node.js specific, and a newer API that implements the same
[WHATWG URL Standard][] used by web browsers.-->

*请注意*: 虽然Node.js遗留的特有的API并没有被弃用，但是保留的目的是用于向后兼容已有应用程序。因此新的应用程序请使用WHATWG API。
<!--*Note*: While the Legacy API has not been deprecated, it is maintained solely
for backwards compatibility with existing applications. New application code
should use the WHATWG API.-->

WHATWG与Node.js遗留的特有的API的比较如下。网址`'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`上方是由遗留的`url.parse()`返回的对象属性。网址下方的则是由WHATWG `URL`对象的属性。
<!--A comparison between the WHATWG and Legacy APIs is provided below. Above the URL
`'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`, properties of
an object returned by the legacy `url.parse()` are shown. Below it are
properties of a WHATWG `URL` object.-->

WHATWG URL的组织属性包括`protocol`和`host`,但不包含`username`、`password`.
<!--*Note*: WHATWG URL's `origin` property includes `protocol` and `host`, but not
`username` or `password`.-->

```txt
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            href                                             │
├──────────┬──┬─────────────────────┬─────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │        host         │           path            │ hash  │
│          │  │                     ├──────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │   hostname   │ port │ pathname │     search     │       │
│          │  │                     │              │      │          ├─┬──────────────┤       │
│          │  │                     │              │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.host.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │   hostname   │ port │          │                │       │
│          │  │          │          ├──────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │        host         │          │                │       │
├──────────┴──┼──────────┴──────────┼─────────────────────┤          │                │       │
│   origin    │                     │       origin        │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴─────────────────────┴──────────┴────────────────┴───────┤
│                                            href                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
(请忽略字符串中的空格，它们只是为了格式化)
```

<!--Parsing the URL string using the WHATWG API:-->
利用WHATWG API解析一个URL字符串:
```js
const { URL } = require('url');
const myURL =
  new URL('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```
在浏览器中，WHATWG `URL`在全局总是可用的，而在Node.js中，任何情况下打开
或使用一个链接都必须事先引用'url'模块：`require('url').URL`

<!--*Note*: In Web Browsers, the WHATWG `URL` class is a global that is always
 available. In Node.js, however, the `URL` class must be accessed via
require('url').URL`.-->

<!--Parsing the URL string using the Legacy API:-->
通过Node.js提供的API解析一个URL:
```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```


## The WHATWG URL API
<!-- YAML
added: v7.0.0
-->

### Class: URL


浏览器兼容的 `URL` 类，根据 WHATWG URL 标准实现。[解析URL的示例][]可以在标准本身里边找到。

*注意*: 根据浏览器的约定，`URL` 对象的所有属性都是在类的原型上实现为getter和setter，而不是作为对象本身的数据属性。因此，与[遗留的urlObjects][]不同，在 `URL` 对象的任何属性(例如 `delete myURL.protocol`，`delete myURL.pathname`等)上使用 `delete` 关键字没有任何效果，但仍返回 `true`。

#### Constructor: new URL(input[, base])

* `input` {string} 要解析的输入URL
* `base` {string|URL} 如果“input”是相对URL，则为要解析的基本URL。

通过将`input`解析到`base`上创建一个新的`URL`对象。如果`base`是一个字符串，则解析方法与`new URL(base)`相同。


```js
const { URL } = require('url');
const myURL = new URL('/foo', 'https://example.org/');
  // https://example.org/foo
```

如果`input`或`base`是无效URLs，将会抛出`TypeError`。请注意给定值将被强制转换为字符串。例如：


```js
const { URL } = require('url');
const myURL = new URL({ toString: () => 'https://example.org/' });
  // https://example.org/
```

存在于`input`主机名中的Unicode字符将被使用[Punycode][]算法自动转换为ASCII。

```js
const { URL } = require('url');
const myURL = new URL('https://你好你好');
  // https://xn--6qqa088eba/
```

*Note*: This feature is only available if the `node` executable was compiled
with [ICU][] enabled. If not, the domain names are passed through unchanged.

#### url.hash

* {string}

获取及设置URL的分段(hash)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
  // 输出 #bar

myURL.hash = 'baz';
console.log(myURL.href);
  // 输出 https://example.org/foo#baz
```

包含在赋给`hash`属性的值中的无效URL字符是[百分比编码][]。请注意选择哪些字符进行百分比编码可能与[url.parse()][]和[url.format()][]方法产生的不同。


#### url.host

* {string}

获取及设置URL的主机(host)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
  // 输出 example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
  // 输出 https://example.com:82/foo
```

如果给`host`属性设置的值是无效值，那么该值将被忽略。


#### url.hostname

* {string}

获取及设置URL的主机名(hostname)部分。 `url.host`和`url.hostname`之间的区别是`url.hostname`*不* 包含端口。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
  // 输出 example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
  // 输出 https://example.com:81/foo
```

如果给`hostname`属性设置的值是无效值，那么该值将被忽略。


#### url.href

* {string}

获取及设置序列化的URL。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
  // 输出 https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
  // 输出 https://example.com/bar
```

获取`href`属性的值等同于调用[`url.toString()`][]。

将此属性的值设置为新值等同于[`new URL(value)`][`new URL()`]使用创建新的`URL`对象。`URL`对象的每个属性都将被修改。

如果给`href`属性设置的值是无效URL，将会抛出`TypeError`。


#### url.origin

* {string}

获取只读序列化的URL orgin部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
  // 输出 https://example.org
```

```js
const { URL } = require('url');
const idnURL = new URL('https://你好你好');
console.log(idnURL.origin);
  // 输出 https://xn--6qqa088eba

console.log(idnURL.hostname);
  // 输出 xn--6qqa088eba
```


#### url.password

* {string}

获取及设置URL的密码(password)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
  // 输出 xyz

myURL.password = '123';
console.log(myURL.href);
  // 输出 https://abc:123@example.com
```

包含在赋给`password`属性的值中的无效URL字符是[百分比编码][]。请注意选择哪些字符进行百分比编码可能与[`url.parse()`][]和[`url.format()`][]方法产生的不同。


#### url.pathname

* {string}

获取及设置URL的路径(path)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
  // 输出 /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
  // 输出 https://example.org/abcdef?123
```

包含在赋给`pathname`属性的值中的无效URL字符是[百分比编码][]。请注意选择哪些字符进行百分比编码可能与[`url.parse()`][]和[`url.format()`][]方法产生的不同。


#### url.port

* {string}

获取及设置URL的端口(port)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:8888');
console.log(myURL.port);
  // 输出 8888

// 默认端口将自动转换为空字符
// (HTTPS协议默认端口是443)
myURL.port = '443';
console.log(myURL.port);
  // 输出空字符
console.log(myURL.href);
  // 输出 https://example.org/

myURL.port = 1234;
console.log(myURL.port);
  // 输出 1234
console.log(myURL.href);
  // 输出 https://example.org:1234/

// 完全无效的端口字符串将被忽略
myURL.port = 'abcd';
console.log(myURL.port);
  // 输出 1234

// 开头的数字将会被当做端口数
myURL.port = '5678abcd';
console.log(myURL.port);
  // 输出 5678

// 非整形数字将会被截取部分
myURL.port = 1234.5678;
console.log(myURL.port);
  // 输出 1234

// 超出范围的数字将被忽略
myURL.port = 1e10;
console.log(myURL.port);
  // 输出 1234
```

端口值可以被设置为数字或包含数字的字符串，数字范围`0`~`65535`(包括)。为给定`protocol`的`URL`对象设置端口值将会导致`port`值变成空字符(`''`)。

如果给`port`属性设置的值是无效字符串，但如果字符串以数字开头，那么开头部位的数字将会被赋值给`port`。否则，包括如果数字超出上述要求的数字，将被忽略。



#### url.protocol

* {string}

获取及设置URL的协议(protocol)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
  // 输出 https:

myURL.protocol = 'ftp';
console.log(myURL.href);
  // 输出 ftp://example.org/
```

如果给`protocol`属性设置的值是无效值，那么该值将被忽略。


#### url.search

* {string}

获取及设置URL的序列化查询(query)部分部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
  // 输出 ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
  // 输出 https://example.org/abc?abc=xyz
```

任何出现在赋给`search`属性值中的无效URL字符将被[百分比编码][]。请注意选择哪些字符进行百分比编码可能与[`url.parse()`][]和[`url.format()`][]方法产生的不同。


#### url.searchParams

* {URLSearchParams}

获取表示URL查询参数的[`URLSearchParams`][]对象。该属性是只读的；使用[`url.search`][]设置来替换URL的整个查询参数。请打开[`URLSearchParams`][]文档来查看更多细节。


#### url.username

* {string}

获取及设置URL的用户名(username)部分。

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
  // 输出 abc

myURL.username = '123';
console.log(myURL.href);
  // 输出 https://123:xyz@example.com/
```

任何出现在赋给`username`属性值中的无效URL字符将被[百分比编码][]。请注意选择哪些字符进行百分比编码可能与[`url.parse()`][]和[`url.format()`][]方法产生的不同。


#### url.toString()

* 返回: {string}

在`URL`对象上调用`toString()`方法将返回序列化的URL。返回值与[`url.href`][]和[`url.toJSON()`][]的相同。

由于需要符合标准，此方法不允许用户自定义URL的序列化过程。 如果需要更大灵活性，[`require('url').format()`][]可能更合适。


#### url.toJSON()

* Returns: {string}

* 返回: {string}

在`URL`对象上调用`toJSON()`方法将返回序列化的URL。返回值与[`url.href`][]和[`url.toString()`][]的相同。

当`URL`对象使用[`JSON.stringify()`][]序列化时将自动调用该方法。

```js
const { URL } = require('url');
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
  // 输出 ["https://www.example.com/","https://test.example.org/"]
```


### Class: URLSearchParams
<!-- YAML
新增于: v7.5.0
-->
`URLSearchParams`API接口提供对`URL`query部分的读写权限。`URLSearchParams`类也能够与以下四个构造函数中的任意一个单独使用。

WHATWG `URLSearchParams`接口和[`querystring`][]模块有相似的目的，但是[`querystring`][]模块的目的更加通用，因为它可以定制分隔符（`＆`和`=`）。但另一方面，这个API是专门为URL查询字符串而设计的。

```js
const { URL, URLSearchParams } = require('url');

const myURL = new URL('https://example.org/?abc=123');
console.log(myURL.searchParams.get('abc'));
// 输出 123

myURL.searchParams.append('abc', 'xyz');
console.log(myURL.href);
// 输出 https://example.org/?abc=123&abc=xyz

myURL.searchParams.delete('abc');
myURL.searchParams.set('a', 'b');
console.log(myURL.href);
// 输出 https://example.org/?a=b

const newSearchParams = new URLSearchParams(myURL.searchParams);
// 上面的代码等同于
// const newSearchParams = new URLSearchParams(myURL.search);

newSearchParams.append('a', 'c');
console.log(myURL.href);
// 输出 https://example.org/?a=b
console.log(newSearchParams.toString());
// 输出 a=b&a=c

// newSearchParams.toString() 被隐式调用
myURL.search = newSearchParams;
console.log(myURL.href);
// 输出 https://example.org/?a=b&a=c
newSearchParams.delete('a');
console.log(myURL.href);
// 输出 https://example.org/?a=b&a=c
```


#### Constructor: new URLSearchParams()

实例化一个新的空的`URLSearchParams`对象。


#### Constructor: new URLSearchParams(string)

* `string` {string} 一个查询字符串

将`string`解析成一个查询字符串, 并且使用它来实例化一个新的`URLSearchParams`对象.  如果`string`以`'?'`打头,则`'?'`将会被忽略.

```js
const { URLSearchParams } = require('url');
let params;

params = new URLSearchParams('user=abc&query=xyz');
console.log(params.get('user'));
  // 输出 'abc'
console.log(params.toString());
  // 输出 'user=abc&query=xyz'

params = new URLSearchParams('?user=abc&query=xyz');
console.log(params.toString());
  // 输出 'user=abc&query=xyz'
```


#### Constructor: new URLSearchParams(obj)
<!-- YAML
added: v7.10.0
-->

* `obj` {Object} 一个表示键值对集合的对象

通过使用查询哈希映射实例化一个新的`URLSearchParams`对象，`obj`的每一个属性的键和值将被强制转换为字符串。

*请注意*: 和 [`querystring`][] 模块不同的是, 在数组的形式中，重复的键是不允许的。数组使用[`array.toString()`][]进行字符串化时，只需用逗号连接所有的数组元素即可。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams({
  user: 'abc',
  query: ['first', 'second']
});
console.log(params.getAll('query'));
  // 输出 [ 'first,second' ]
console.log(params.toString());
  // 输出 'user=abc&query=first%2Csecond'
```


#### Constructor: new URLSearchParams(iterable)
<!-- YAML
added: v7.10.0
-->

* `iterable` {Iterable} 一个元素时键值对的迭代对象

以一种类似于[`Map`][]的构造函数的迭代映射方式实例化一个新的`URLSearchParams`对象。`iterable`可以是一个数组或者任何迭代对象。这就意味着`iterable`能够使另一个`URLSearchParams`，这种情况下，构造函数将简单地根据提供的`URLSearchParams`创建一个克隆`URLSearchParams`。`iterable`的元素是键值对，并且其本身也可以是任何迭代对象。

允许重复的键。

```js
const { URLSearchParams } = require('url');
let params;

// Using an array
params = new URLSearchParams([
  ['user', 'abc'],
  ['query', 'first'],
  ['query', 'second']
]);
console.log(params.toString());
  // 输出 'user=abc&query=first&query=second'

// 使用Map对象
const map = new Map();
map.set('user', 'abc');
map.set('query', 'xyz');
params = new URLSearchParams(map);
console.log(params.toString());
  // 输出 'user=abc&query=xyz'

// 使用generator函数
function* getQueryPairs() {
  yield ['user', 'abc'];
  yield ['query', 'first'];
  yield ['query', 'second'];
}
params = new URLSearchParams(getQueryPairs());
console.log(params.toString());
  // 输出 'user=abc&query=first&query=second'

// 每个键值对必须有两个元素
new URLSearchParams([
  ['user', 'abc', 'error']
]);
  // 抛出 TypeError [ERR_INVALID_TUPLE]:
  //        每一个键值对必须是迭代的[键，值]元组
```


#### urlSearchParams.append(name, value)

* `name` {string}
* `value` {string}

在查询字符串中附加一个新的键值对。


#### urlSearchParams.delete(name)

* `name` {string}

删除所有键为`name`的键值对。


#### urlSearchParams.entries()

* Returns: {Iterator}

* 返回: {Iterator}
在查询中的每个键值对上返回一个ES6迭代器。 迭代器的每一项都是一个JavaScript数组。 Array的第一个项是键`name`，Array的第二个项是值`value`。


别名为[`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].


#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} 在查询字符串中的每个键值对的调用函数。
* `thisArg` {Object} 当`fn`调用时，被用作`this`值的对象

在查询字符串中迭代每个键值对，并调用给定的函数。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/?a=b&c=d');
myURL.searchParams.forEach((value, name, searchParams) => {
  console.log(name, value, myURL.searchParams === searchParams);
});
  // 输出:
  // a b true
  // c d true
```


#### urlSearchParams.get(name)

* `name` {string}
* 返回: {string} ，如果没有键值对对应给定的`name`则返回`null`。

返回键是`name`的第一个键值对的值。如果没有对应的键值对，则返回`null`。


#### urlSearchParams.getAll(name)

* `name` {string}
* 返回: {Array}

返回键是`name`的所有键值对的值，如果没有满足条件的键值对，则返回一个空的数组。


#### urlSearchParams.has(name)

* `name` {string}
* 返回: {boolean}

如果存在至少一对键是name的键值对则返回 `true`。


#### urlSearchParams.keys()

* 返回: {Iterator}

在每一个键值对上返回一个键的ES6迭代器。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('foo=bar&foo=baz');
for (const name of params.keys()) {
  console.log(name);
}
  // 输出:
  // foo
  // foo
```


#### urlSearchParams.set(name, value)

* `name` {string}
* `value` {string}

将`URLSearchParams`对象中与`name`相对应的值设置为`value`。如果已经存在键为`name`的键值对，将第一对的值设为`value`并且删除其他对。如果不存在，则将此键值对附加在查询字符串后。

```js
const { URLSearchParams } = require('url');

const params = new URLSearchParams();
params.append('foo', 'bar');
params.append('foo', 'baz');
params.append('abc', 'def');
console.log(params.toString());
  // 输出 foo=bar&foo=baz&abc=def

params.set('foo', 'def');
params.set('xyz', 'opq');
console.log(params.toString());
  // 输出 foo=def&abc=def&xyz=opq
```


#### urlSearchParams.sort()
<!-- YAML
added: v7.7.0
-->

按现有名称就地排列所有的名称-值对。使用[稳定排序算法][]完成排序，因此保留具有相同名称的名称-值对之间的相对顺序。

特别地，该方法可以用来增加缓存命中。
```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
  // Prints query%5B%5D=abc&query%5B%5D=123&type=search
```


#### urlSearchParams.toString()

* 返回: {string}

返回查询参数序列化后的字符串，必要时存在百分号编码字符。


#### urlSearchParams.values()

* Returns: {Iterator}

在每一个键值对上返回一个值的ES6迭代器。


#### urlSearchParams\[@@iterator\]()

* 返回: {Iterator}

返回在查询字符串中每一个键值对的ES6迭代器。迭代器的每一个项都是一个JavaScript数组。数组中的第一个项是`name`，第二个项是`value`。

别名：[`urlSearchParams.entries()`][].

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('foo=bar&xyz=baz');
for (const [name, value] of params) {
  console.log(name, value);
}
  // 输出:
  // foo bar
  // xyz baz
```


### url.domainToASCII(domain)
 
<!-- YAML
added: v7.4.0
-->

* `domain` {string}
* 返回: {string}

返回[Punycode][] ASCII序列化的`domain`. 如果`domain`是无效域名，将返回空字符串。

它执行的是[`url.domainToUnicode()`][]的逆运算。

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
  // 输出 xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
  // 输出 xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
  // 输出空字符串
```


### url.domainToUnicode(domain)
<!-- YAML
added: v7.4.0
-->

* `domain` {string}
* 返回: {string}

返回Unicode序列化的`domain`. 如果`domain`是无效域名，将返回空字符串。

它执行的是[`url.domainToASCII()`][]的逆运算。

```js
const url = require('url');
console.log(url.domainToUnicode('xn--espaol-zwa.com'));
  // 输出 español.com
console.log(url.domainToUnicode('xn--fiq228c.com'));
  // 输出 中文.com
console.log(url.domainToUnicode('xn--iñvalid.com'));
  // 输出空字符串
```


### url.format(URL[, options])
<!-- YAML
added: v7.6.0
-->

* `URL` {URL} 一个[WHATWG URL][]对象
* `options` {Object}
  * `auth` {boolean} 如果序列化的URL字符串应该包含用户名和密码为`true`，否则为`false`。默认为`true`。
  * `fragment` {boolean} 如果序列化的URL字符串应该包含分段为`true`，否则为`false`。默认为`true`。
  * `search` {boolean} 如果序列化的URL字符串应该包含搜索查询为`true`，否则为`false`。默认为`true`。
  * `unicode` {boolean} `true` 如果出现在URL字符串主机元素里的Unicode字符应该被直接编码而不是使用Punycode编码为`true`，默认为`false`。

返回一个[WHATWG URL][]对象的可自定义序列化的URL字符串表达。

虽然URL对象的`toString()`方法和`href`属性都可以返回URL的序列化的字符串。然而，两者都不可以被自定义。而`url.format(URL[, options])`方法允许输出的基本自定义。

例如：

```js
const { URL } = require('url');
const myURL = new URL('https://a:b@你好你好?abc#foo');

console.log(myURL.href);
  // 输出 https://a:b@xn--6qqa088eba/?abc#foo

console.log(myURL.toString());
  // 输出 https://a:b@xn--6qqa088eba/?abc#foo

console.log(url.format(myURL, { fragment: false, unicode: true, auth: false }));
  // 输出 'https://你好你好/?abc'
```


## Legacy URL API

在遗留的API中，空格(`' '`)及以下字符将自动转义为URL对象的属性：

```txt
< > " ` \r \n \t { } | \ ^ '
```

例如，ASCII空格字符(`' '`)被编码为`%20`.ASCII斜杠(`/`)字符被编码为`%3C`。



### Legacy urlObject

遗留的urlObject (`require('url').Url`)由`url.parse()`函数创建并返回。



#### urlObject.auth

`auth` 属性是 URL 的用户名与密码部分。
该字符串跟在 `protocol` 和双斜杠（如果有）的后面，排在 `host` 部分的前面且被一个 ASCII 的 at 符号（`@`）分隔。
该字符的格式为 `{username}[:{password}]`，`[:{password}]` 部分是可选的。

例如：`'user:pass'`


#### urlObject.hash

`hash` 属性包含 URL 的碎片部分，包括开头的 ASCII 哈希字符（`#`）。

例如：`'#hash'`


#### urlObject.host

`host` 属性是 URL 的完整的小写的主机部分，包括 `port`（如果有）。

例如：`'sub.host.com:8080'`


#### urlObject.hostname

`hostname` 属性是 `host` 组成部分排除 `port` 之后的小写的主机名部分。

例如：`'sub.host.com'`


#### urlObject.href

`href` 属性是解析后的完整的 URL 字符串，`protocol` 和 `host` 都会被转换为小写的。

例如：`'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`


#### urlObject.path

`path` 属性是一个 `pathname` 与 `search` 组成部分的串接。

例如：`'/p/a/t/h?query=string'`

不会对 `path` 执行解码。


#### urlObject.pathname

`pathname` 属性包含 URL 的整个路径部分。
它跟在 `host` （包括 `port`）后面，排在 `query` 或 `hash` 组成部分的前面且被 ASCII 问号（`?`）或哈希字符（`#`）分隔。

例如：`'/p/a/t/h'`

不会对路径字符串执行解码。


#### urlObject.port

`port` 属性是 `host` 组成部分中的数值型的端口部分。

例如：`'8080'`


#### urlObject.protocol

`protocol` 属性表明 URL 的小写的协议体制。

例如：`'http:'`


#### urlObject.query

`query` 属性是不含开头 ASCII 问号（`?`）的查询字符串，或一个被 [`querystring`] 模块的 `parse()` 方法返回的对象。
`query` 属性是一个字符串还是一个对象是由传入 `url.parse()` 的 `parseQueryString` 参数决定的。

例如：`'query=string'` or `{'query': 'string'}`

如果返回一个字符串，则不会对查询字符串执行解码。
如果返回一个对象，则键和值都会被解码。


#### urlObject.search

`search` 属性包含 URL 的整个查询字符串部分，包括开头的 ASCII 问号字符（`?`）。

例如：`'?query=string'`

不会对查询字符串执行解码。


#### urlObject.slashes

`slashes` 属性是一个 `boolean`，如果 `protocol` 中的冒号后面跟着两个 ASCII 斜杠字符（`/`），则值为 `true`。


### url.format(urlObject)
<!-- YAML
added: v0.1.25
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7234
    description: URLs with a `file:` scheme will now always use the correct
                 number of slashes regardless of `slashes` option. A false-y
                 `slashes` option with no protocol is now also respected at all
                 times.
-->

* `urlObject` {Object|string} 一个 URL 对象（就像 `url.parse()` 返回的）。
  如果是一个字符串，则通过 `url.parse()` 转换为一个对象。

`url.format()` 方法返回一个从 `urlObject` 格式化后的 URL 字符串。

如果 `urlObject` 不是一个对象或字符串，则 `url.parse()` 抛出 [`TypeError`]。

格式化过程如下：

* 创建一个新的空字符串 `result`。
* 如果 `urlObject.protocol` 是一个字符串，则它会被原样添加到 `result`。
* 否则，如果 `urlObject.protocol` 不是 `undefined` 也不是一个字符串，则抛出 [`Error`]。
* 对于不是以 `:` 结束的 `urlObject.protocol`，`:` 会被添加到 `result`。
* 如果以下条件之一为真，则 `//` 会被添加到 `result`：
    * `urlObject.slashes` 属性为真；
    * `urlObject.protocol` 以 `http`、`https`、`ftp`、`gopher` 或 `file` 开头；
* 如果 `urlObject.auth` 属性的值为真，且 `urlObject.host` 或 `urlObject.hostname` 不为 `undefined`，则 `urlObject.auth` 会被添加到 `result`，且后面带上 `@`。
* 如果 `urlObject.host` 属性为 `undefined`，则：
  * 如果 `urlObject.hostname` 是一个字符串，则它会被添加到 `result`。
  * 否则，如果 `urlObject.hostname` 不是 `undefined` 也不是一个字符串，则抛出 [`Error`]。
  * 如果 `urlObject.port` 属性的值为真，且 `urlObject.hostname` 不为 `undefined`：
    * `:` 会被添加到 `result`。
    * `urlObject.port` 的值会被添加到 `result`。
* 否则，如果 `urlObject.host` 属性的值为真，则 `urlObject.host` 的值会被添加到 `result`。
* 如果 `urlObject.pathname` 属性是一个字符串且不是一个空字符串：
  * 如果 `urlObject.pathname` 不是以 `/` 开头，则 `/` 会被添加到 `result`。
  * `urlObject.pathname` 的值会被添加到 `result`。
* 否则，如果 `urlObject.pathname` 不是 `undefined` 也不是一个字符串，则抛出 [`Error`]。
* 如果 `urlObject.search` 属性为 `undefined` 且 `urlObject.query` 属性是一个 `Object`，则 `?` 会被添加到 `result`，后面跟上把 `urlObject.query` 的值传入 [`querystring`] 模块的 `stringify()` 方法的调用结果。
* 否则，如果 `urlObject.search` 是一个字符串：
  * 如果 `urlObject.search` 的值不是以 `?` 开头，则 `?` 会被添加到 `result`。
  * `urlObject.search` 的值会被添加到 `result`。
* 否则，如果 `urlObject.search` 不是 `undefined` 也不是一个字符串，则抛出 [`Error`]。
* 如果 `urlObject.hash` 属性是一个字符串：
  * 如果 `urlObject.hash` 的值不是以 `#` 开头，则 `#` 会被添加到 `result`。
  * `urlObject.hash` 的值会被添加到 `result`。
* 否则，如果 `urlObject.hash` 属性不是 `undefined` 也不是一个字符串，则抛出 [`Error`]。
* 返回 `result`。



### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])
<!-- YAML
added: v0.1.25
-->

* `urlString` {string} 要解析的 URL 字符串。
* `parseQueryString` {boolean} 如果为 `true`，则 `query` 属性总会通过 [`querystring`] 模块的 `parse()` 方法生成一个对象。
  如果为 `false`，则返回的 URL 对象上的 `query` 属性会是一个未解析、未解码的字符串。
  默认为 `false`。
* `slashesDenoteHost` {boolean} 如果为 `true`，则 `//` 之后至下一个 `/` 之前的字符串会被解析作为 `host`。
  例如，`//foo/bar` 会被解析为 `{host: 'foo', pathname: '/bar'}` 而不是 `{pathname: '//foo/bar'}`。
  默认为 `false`。

`url.parse()` 方法会解析一个 URL 字符串并返回一个 URL 对象。

如果`urlString`不是字符串将会抛出`TypeError`。

如果`auth`属性存在但无法编码则抛出`URIError`。


### url.resolve(from, to)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8215
    description: The `auth` fields are now kept intact when `from` and `to`
                 refer to the same host.
  - version: v6.5.0, v4.6.2
    pr-url: https://github.com/nodejs/node/pull/8214
    description: The `port` field is copied correctly now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/1480
    description: The `auth` fields is cleared now the `to` parameter
                 contains a hostname.
-->

* `from` {string} 解析时相对的基本 URL。
* `to` {string} 要解析的超链接 URL。

`url.resolve()` 方法会以一种 Web 浏览器解析超链接的方式把一个目标 URL 解析成相对于一个基础 URL。

例子：

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>


## Percent-Encoding in URLs

允许URL只包含一定范围的字符。 任何超出该范围的字符都必须进行编码。 如何对这些字符进行编码，以及哪些字符要编码完全取决于字符在URL结构内的位置。


### Legacy API

在遗留的API中，空格(`' '`)及以下字符将自动转义为URL对象的属性：

```txt
< > " ` \r \n \t { } | \ ^ '
```

例如，ASCII空格字符(`' '`)被编码为`%20`.ASCII斜杠(`/`)字符被编码为`%3C`。


### WHATWG API

[WHATWG URL Standard][]使用比遗留的API更具选择性和更精细的方法来选择使用的编码字符。

WHATWG算法定义了三个“百分比编码集”，它们描述了必须进行百分编码的字符范围：

* *C0 control percent-encode set(C0控制百分比编码集)* 包括范围在U+0000 ~ U+001F（含）的代码点及大于U+007E的所有代码点。

* *path percent-encode set(路径百分比编码集)* 包括 *C0 control percent-encode set(C0控制百分比编码集)* 的代码点 及 U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, 和 U+007D 的代码点。

* *userinfo encode set(用户信息编码集)* 包括 *path percent-encode set(路径百分比编码集)* 的代码点 及 U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, 和 U+007C 的代码点。

*userinfo percent-encode set(用户信息百分比编码集)* 专门用于用户名和密码部分的编码。*path percent-encode set(路径百分比编码集)* 用于大多数URL的路径部分编码。*C0 control percent-encode set(C0控制百分比编码集)* 则用于所有其他情况的编码，特别地包括URL的分段部分，特殊条件下也包括主机及路径部分。

当主机名中出现非ASCII字符时，主机名将使用[Punycode][]算法进行编码。然而，请注意，主机名*可能同时* 包含Punycode编码和百分比编码的字符。例如：

```js
const { URL } = require('url');
const myURL = new URL('https://%CF%80.com/foo');
console.log(myURL.href);
  // 输出 https://xn--1xa.com/foo
console.log(myURL.origin);
  // 输出 https://π.com
```



[`Error`]: errors.html#errors_class_error
[`JSON.stringify()`]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[`Map`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[`TypeError`]: errors.html#errors_class_typeerror
[`URLSearchParams`]: #url_class_urlsearchparams
[`array.toString()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toString
[`new URL()`]: #url_constructor_new_url_input_base
[`querystring`]: querystring.html
[`require('url').format()`]: #url_url_format_url_options
[`url.domainToASCII()`]: #url_url_domaintoascii_domain
[`url.domainToUnicode()`]: #url_url_domaintounicode_domain
[`url.format()`]: #url_url_format_urlobject
[`url.href`]: #url_url_href
[`url.parse()`]: #url_url_parse_urlstring_parsequerystring_slashesdenotehost
[`url.search`]: #url_url_search
[`url.toJSON()`]: #url_url_tojson
[`url.toString()`]: #url_url_tostring
[`urlSearchParams.entries()`]: #url_urlsearchparams_entries
[`urlSearchParams@@iterator()`]: #url_urlsearchparams_iterator
[ICU]: intl.html#intl_options_for_building_node_js
[Punycode]: https://tools.ietf.org/html/rfc5891#section-4.4
[WHATWG URL Standard]: https://url.spec.whatwg.org/
[WHATWG URL]: #url_the_whatwg_url_api
[examples of parsed URLs]: https://url.spec.whatwg.org/#example-url-parsing
[legacy urlObject]: #url_legacy_urlobject
[percent-encoded]: #whatwg-percent-encoding
[stable sorting algorithm]: https://en.wikipedia.org/wiki/Sorting_algorithm#Stability
