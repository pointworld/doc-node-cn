# Zlib

> Stability: 2 - Stable

`zlib`模块提供通过 Gzip 和 Deflate/Inflate 实现的压缩功能，可以通过这样使用它：

```js
const zlib = require('zlib');
```

压缩或者解压数据流(例如一个文件)通过`zlib`流将源数据流传输到目标流中来完成。

```js
const gzip = zlib.createGzip();
const fs = require('fs');
const inp = fs.createReadStream('input.txt');
const out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

数据的压缩或解压缩也可以只用一个步骤完成：

```js
const input = '.................................';
zlib.deflate(input, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString('base64'));
  } else {
    // 错误处理
  }
});

const buffer = Buffer.from('eJzT0yMAAGTvBe8=', 'base64');
zlib.unzip(buffer, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString());
  } else {
    // 错误处理
  }
});
```
## Threadpool Usage

Note that all zlib APIs except those that are explicitly synchronous use libuv's
threadpool, which can have surprising and negative performance implications for
some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more
information.

## Compressing HTTP requests and responses
`zlib` 可以用来实现对 [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2) 中定义的 `gzip` 和 `deflate` 内容编码机制的支持。

HTTP 的 [`Accept-Encoding`][] 头字段用来标记客户端接受的压缩编码。
。

`注意`: 下面给出的示例大幅简化，用以展示了基本的概念。使用 `zlib` 编码成本会很高, 结果应该被缓存。关于 `zlib` 使用中有关速度/内存/压缩互相权衡的信息，查阅 [Memory Usage Tuning][]。

```js
// 客户端请求示例
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
const request = http.get({ host: 'example.com',
                           path: '/',
                           port: 80,
                           headers: { 'Accept-Encoding': 'gzip,deflate' } });
request.on('response', (response) => {
  const output = fs.createWriteStream('example.com_index.html');

  switch (response.headers['content-encoding']) {
    // 或者, 只是使用 zlib.createUnzip() 方法去处理这两种情况
    case 'gzip':
      response.pipe(zlib.createGunzip()).pipe(output);
      break;
    case 'deflate':
      response.pipe(zlib.createInflate()).pipe(output);
      break;
    default:
      response.pipe(output);
      break;
  }
});
```

```js
// 服务端示例
// 对每一个请求运行 gzip 操作的成本是十分高昂的.
// 缓存压缩缓冲区是更加高效的方式.
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
http.createServer((request, response) => {
  const raw = fs.createReadStream('index.html');
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // 注意：这不是一个合适的 accept-encoding 解析器.
  // 查阅 http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(1337);
```

默认情况下, 当解压不完整的数据时 `zlib` 方法会抛出一个错误. 然而, 如果它已经知道数据是不完整的, 或者仅仅是为了检查已压缩文件的开头, 可以通过改变用来解压最后一个的输入数据块的刷新方法来避免默认的错误处理.

```js
// 这是一个上面例子中缓存区的不完整版本
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // 错误处理
    }
  });
```

这不会改变其他抛出错误情况下的行为, 例如, 当输入内容的格式无效时. 使用这个方法, 无法确定输入是否过早结束, 或者缺乏完整性检查, 因此有必要人工检查解压结果是否有效.


## Memory Usage Tuning

<!--type=misc-->

来自 `zlib/zconf.h`, 修改为 node.js 的用法:

解压所需的内存是(字节为单位):

<!-- eslint-disable semi -->
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

就是: 当设置为 windowBits=15 和 memLevel = 8 时(默认值), 小的对象需要 128k 加上几千字节. 

例如, 为了将默认内存需求 256k 减少到 128k, 应该这样设置:

```js
const options = { windowBits: 14, memLevel: 7 };
```

这能实现, 然而, 通常会降低压缩水平.

压缩所需的内存是 `1 << windowBits` (字节为单位). 既是, 设置为 windowBits=15(默认值)
时, 小的对象需要 32k 加上几千字节.

这是一个大小为 `chunkSize` 单个内部输出 slab 缓冲, 默认为 16k.

`level` 的设置是影响 `zlib` 压缩速度最大因素. 更高的等级设置会得到更高的压缩
水平, 然而需要更长的时间完成. 较低的等级设置会导致较少的压缩, 但会大大加快速度.

通常来说, 更大的内存使用选项意味着 Node.js 必须减少调用 `zlib`, 因为它的每个 `write` 操作
能够处理更多的数据. 所以, 这是另外一个影响速度的因素, 代价是内存的占用.

## Flushing

在压缩流上调用 [`.flush()`]() 方法将使 `zlib` 返回尽可能多的输出. 这可能是以压缩质量下降
为代价的，但是当需要尽快提供数据时，这可能是有用的

在以下的实例中,  `flush()` 方法用于将部分压缩过的 HTTP 响应返回给客户端:
```js
const zlib = require('zlib');
const http = require('http');

http.createServer((request, response) => {
  // 为了简单起见，省略了对 Accept-Encoding 的检测
  response.writeHead(200, { 'content-encoding': 'gzip' });
  const output = zlib.createGzip();
  output.pipe(response);

  setInterval(() => {
    output.write(`The current time is ${Date()}\n`, () => {
      // 数据已经传递给了 zlib，但压缩算法看能已经决定缓存数据以便得到更高的压缩效率。
      output.flush();
    });
  }, 1000);
}).listen(1337);
```


## Constants
<!-- YAML
added: v0.5.8
-->

<!--type=misc-->

这些被定义在 `zlib.h` 的全部常量同时也被定义在 `require('zlib').constants` 常量上.
不需要在正常的操作中使用这些常量. 记录他们为了使他们的存在并不奇怪. 这个章节几乎直接取自[zlib documentation].
参阅 <http://zlib.net/mamual.html#Constants> 获取更多信息.

*注意*: 以前, 可以直接从 `require('zlib')` 中获取到这些常量, 例如 `zlib.Z_NO_FLUSH`. 
目前仍然可以从模块中直接访问这些常量, 但是不推荐使用.

可接受的 flush 值.

* `zlib.constants.Z_NO_FLUSH`
* `zlib.constants.Z_PARTIAL_FLUSH`
* `zlib.constants.Z_SYNC_FLUSH`
* `zlib.constants.Z_FULL_FLUSH`
* `zlib.constants.Z_FINISH`
* `zlib.constants.Z_BLOCK`
* `zlib.constants.Z_TREES`

返回压缩/解压函数的返回值. 发送错误时为负值, 正值用于特殊但正常的事件.

* `zlib.constants.Z_OK`
* `zlib.constants.Z_STREAM_END`
* `zlib.constants.Z_NEED_DICT`
* `zlib.constants.Z_ERRNO`
* `zlib.constants.Z_STREAM_ERROR`
* `zlib.constants.Z_DATA_ERROR`
* `zlib.constants.Z_MEM_ERROR`
* `zlib.constants.Z_BUF_ERROR`
* `zlib.constants.Z_VERSION_ERROR`

压缩等级.

* `zlib.constants.Z_NO_COMPRESSION`
* `zlib.constants.Z_BEST_SPEED`
* `zlib.constants.Z_BEST_COMPRESSION`
* `zlib.constants.Z_DEFAULT_COMPRESSION`

压缩策略

* `zlib.constants.Z_FILTERED`
* `zlib.constants.Z_HUFFMAN_ONLY`
* `zlib.constants.Z_RLE`
* `zlib.constants.Z_FIXED`
* `zlib.constants.Z_DEFAULT_STRATEGY`


## Class Options
<!-- YAML
added: v0.11.1
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an Uint8Array now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
-->

<!--type=misc-->

每一个类都有一个 `options` 对象. 所有的选项都是可选的.

注意一些选项只与压缩相关, 会被解压类忽视.

* `flush` {integer} (default: `zlib.constants.Z_NO_FLUSH`)
* `finishFlush` {integer} (default: `zlib.constants.Z_FINISH`)
* `chunkSize` {integer} (default: 16\*1024)
* `windowBits` {integer}
* `level` {integer} (compression only)
* `memLevel` {integer} (compression only)
* `strategy` {integer} (compression only)
* `dictionary` {Buffer|TypedArray|DataView} (deflate/inflate only, empty dictionary by
  default)
* `info` {boolean} (If `true`, returns an object with `buffer` and `engine`)

更多信息查阅在 <http://zlib.net/manual.html#Advanced> 关于 `deflateInit2` 以及 `inflateInit2` 的描述， 

## Class: zlib.Deflate
<!-- YAML
added: v0.5.8
-->

使用 deflate 压缩数据。

## Class: zlib.DeflateRaw
<!-- YAML
added: v0.5.8
-->

使用 deflate 压缩数据，并且不附加一个 `zlib` 头。

## Class: zlib.Gunzip
<!-- YAML
added: v0.5.8
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5883
    description: Trailing garbage at the end of the input stream will now
                 result in an `error` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压缩 gzip 流。

## Class: zlib.Gzip
<!-- YAML
added: v0.5.8
-->

使用 gzip 压缩数据。

## Class: zlib.Inflate
<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压一个 deflate 流。

## Class: zlib.InflateRaw
<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压一个 raw deflate 流。

## Class: zlib.Unzip
<!-- YAML
added: v0.5.8
-->

通过自动检测头信息解压 Gzip 或者 Deflate 压缩的流.


## Class: zlib.Zlib
<!-- YAML
added: v0.5.8
-->

没有被 `zlib` 模块导出. 它被记录于此因为它是 compressor/decompressor 类的基础类.


### zlib.bytesRead
<!-- YAML
added: REPLACEME
-->

* {number}

`zlib.bytesRead` 属性指的是压缩引擎处理之前读取的字节数 (压缩或者解压, 适用于派生类)。


### zlib.flush([kind], callback)
<!-- YAML
added: v0.5.8
-->

`kind` 默认为 `zlib.constants.Z_FULL_FLUSH`.

刷新挂起的数据. 不要轻易的调用这个方法, 过早的刷新会对压缩算法造成负面影响.

执行这个操作只会从 `zlib` 内部状态刷新数据, 不会在流级别上执行任何类型的刷新. 相反, 它的表现
类似正常的 `.write()` 调用. 即它将在队列中其他数据写入操作之后执行，并且只会在从流中读取数据之后
才产生输出。

### zlib.params(level, strategy, callback)
<!-- YAML
added: v0.11.4
-->

动态更新压缩等级和压缩策略. 只对解压算法有效.


### zlib.reset()
<!-- YAML
added: v0.7.0
-->

重置 compressor/decompressor 为默认值。仅适用于 inflate 和 deflate 算法。


## zlib.constants
<!-- YAML
added: v7.0.0
-->

提供一个列举出 Zlib 相关常数的对象。

## zlib.createDeflate([options])
<!-- YAML
added: v0.5.8
-->

创建并返回一个带有给定 [options][] 的新的 [Deflate][] 对象。

## zlib.createDeflateRaw([options])
<!-- YAML
added: v0.5.8
-->

创建并返回一个带有给定 [options][] 的新的 [DeflateRaw][] 对象.

*注意*: zlib 库拒绝 256-字节的 windows 的请求 (即 `{windowBits: 8}` in `options`).
当创建具有这个特定 `windowBits` 值的 [DeflateRaw][] 对象时, 会抛出一个 `Error`


## zlib.createGunzip([options])
<!-- YAML
added: v0.5.8
-->

创建并返回一个带有给定 options 的新的 [Gunzip][] 对象。

## zlib.createGzip([options])
<!-- YAML
added: v0.5.8
-->

创建并返回一个带有给定 options 的新的 [Gzip][] 对象。

## zlib.createInflate([options])
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Inflate][] object with the given [options][].

## zlib.createInflateRaw([options])
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [InflateRaw][] object with the given [options][].

## zlib.createUnzip([options])
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Unzip][] object with the given [options][].

## Convenience Methods

<!--type=misc-->

所有这些方法都将 [`Buffer`][], [`TypeArray`][], [`DataView`][], 或者字符串作为第一个
参数, 一个回调函数作为可选的第二个参数提供给 `zlib` 类, 会在 `callback(error, result)`
中调用.

每一个方法相对应的都有一个接受相同参数, 但是没有回调的 `*Sync` 版本. 



### zlib.deflate(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.deflateSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Deflate][].

### zlib.deflateRaw(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.deflateRawSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [DeflateRaw][].

### zlib.gunzip(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.gunzipSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

使用 [Gunzip][] 解压缩一个 [Buffer][] 或者字符串。

### zlib.gzip(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.gzipSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Gzip][].

### zlib.inflate(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.inflateSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Inflate][].

### zlib.inflateRaw(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.inflateRawSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [InflateRaw][].

### zlib.unzip(buffer[, options], callback)
<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->
### zlib.unzipSync(buffer[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Unzip][].

[`.flush()`]: #zlib_zlib_flush_kind_callback
[`Accept-Encoding`]: https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
[`Buffer`]: buffer.html#buffer_class_buffer
[`Content-Encoding`]: https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11
[`DataView`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
[`TypedArray`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
[DeflateRaw]: #zlib_class_zlib_deflateraw
[Deflate]: #zlib_class_zlib_deflate
[Gunzip]: #zlib_class_zlib_gunzip
[Gzip]: #zlib_class_zlib_gzip
[InflateRaw]: #zlib_class_zlib_inflateraw
[Inflate]: #zlib_class_zlib_inflate
[Memory Usage Tuning]: #zlib_memory_usage_tuning
[Unzip]: #zlib_class_zlib_unzip
[options]: #zlib_class_options
[zlib documentation]: http://zlib.net/manual.html#Constants
