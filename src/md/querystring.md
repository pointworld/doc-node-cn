# Query String

<!--introduced_in=v0.10.0-->

> 稳定性: 2 - 稳定的

<!--name=querystring-->

`querystring` 模块提供了一些实用函数，用于解析与格式化 URL 查询字符串。
使用以下方法引入：

```js
const querystring = require('querystring');
```

## querystring.escape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

对给定的 `str` 进行 URL 编码。

The `querystring.escape()` method performs URL percent-encoding on the given
`str` in a manner that is optimized for the specific requirements of URL
query strings.

该方法是提供给 `querystring.stringify()` 使用的，通常不直接使用。
它之所以对外开放，是为了在需要时可以通过给 `querystring.escape` 赋值一个函数来重写编码的实现。

## querystring.parse(str[, sep[, eq[, options]]])
<!-- YAML
added: v0.1.25
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10967
    description: Multiple empty entries are now parsed correctly (e.g. `&=&=`).
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6055
    description: The returned object no longer inherits from `Object.prototype`.
  - version: v6.0.0, v4.2.4
    pr-url: https://github.com/nodejs/node/pull/3807
    description: The `eq` parameter may now have a length of more than `1`.
-->

* `str` {string} 要解析的 URL 查询字符串。
* `sep` {string} 用于界定查询字符串中的键值对的子字符串。默认为 `'&'`。
* `eq` {string} 用于界定查询字符串中的键与值的子字符串。默认为 `'='`。
* `options` {Object}
  * `decodeURIComponent` {Function} 解码查询字符串的字符时使用的函数。默认为 `querystring.unescape()`。
  * `maxKeys` {number} 指定要解析的键的最大数量。默认为 `1000`。指定为 `0` 则不限制。

该方法会把一个 URL 查询字符串 `str` 解析成一个键值对的集合。

例子，查询字符串 `'foo=bar&abc=xyz&abc=123'` 被解析成：

<!-- eslint-skip -->
```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

该方法返回的对象不继承自 JavaScript 的 `Object` 类。
这意味着 `Object` 类的方法如 `obj.toString()`、`obj.hasOwnProperty()` 等没有被定义且无法使用。

默认情况下，查询字符串中的字符会被视为使用 UTF-8 编码。
如果使用的是其他字符编码，则需要指定 `decodeURIComponent` 选项，例如：

```js
// 假设存在 gbkDecodeURIComponent 函数。
querystring.parse('w=%D6%D0%CE%C4&foo=bar', null, null,
                  { decodeURIComponent: gbkDecodeURIComponent });
```

## querystring.stringify(obj[, sep[, eq[, options]]])
<!-- YAML
added: v0.1.25
-->

* `obj` {Object} 要序列化成 URL 查询字符串的对象。
* `sep` {string} 用于界定查询字符串中的键值对的子字符串。默认为 `'&'`。
* `eq` {string} 用于界定查询字符串中的键与值的子字符串。默认为 `'='`。
* `options`
  * `encodeURIComponent` {Function} 把对象中的字符转换成查询字符串时使用的函数。默认为 `querystring.escape()`。

该方法通过遍历给定的 `obj` 对象的自身属性，生成 URL 查询字符串。

如果 `obj` 对象中的属性的类型为 {string|number|boolean|string[]|number[]|boolean[]}，则属性的值会被序列化。
其他类型的属性的值会被强制转换为空字符串。

例子：

```js
querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
// 返回 'foo=bar&baz=qux&baz=quux&corge='

querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
// 返回 'foo:bar;baz:qux'
```

默认情况下，使用 UTF-8 进行编码。
如果需要使用其他编码，则需要指定 `encodeURIComponent` 选项，例如：

```js
// 假设存在 gbkEncodeURIComponent 函数。
querystring.stringify({ w: '中文', foo: 'bar' }, null, null,
                      { encodeURIComponent: gbkEncodeURIComponent });
```

## querystring.unescape(str)
<!-- YAML
added: v0.1.25
-->
* `str` {string}

对给定的 `str` 进行解码。

该方法是提供给 `querystring.parse()` 使用的，通常不直接使用。
它之所以对外开放，是为了在需要时可以通过给 `querystring.unescape` 赋值一个函数来重写解码的实现。

默认使用 JavaScript 内置的 `decodeURIComponent()` 方法来解码。


