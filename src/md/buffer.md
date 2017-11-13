# Buffer

> 稳定性: 2

在 ECMAScript 2015 (ES6) 引入 [`TypedArray`] 之前，JavaScript 语言没有读取或操作二进制数据流的机制。
`Buffer` 类被引入作为 Node.js API 的一部分，使其可以在 TCP 流或文件系统操作等场景中处理二进制数据流。

[`TypedArray`] 现已被添加进 ES6 中，`Buffer` 类以一种更优化、更适合 Node.js 用例的方式实现了 [`Uint8Array`] API。

`Buffer` 类的实例类似于整数数组，但 `Buffer` 的大小是固定的、且在 V8 堆外分配物理内存。
`Buffer` 的大小在被创建时确定，且无法调整。

`Buffer` 类在 Node.js 中是一个全局变量，因此无需使用 `require('buffer').Buffer`。

例子：

```js
// 创建一个长度为 10、且用 0 填充的 Buffer。
const buf1 = Buffer.alloc(10);

// 创建一个长度为 10、且用 0x1 填充的 Buffer。 
const buf2 = Buffer.alloc(10, 1);

// 创建一个长度为 10、且未初始化的 Buffer。
// 这个方法比调用 Buffer.alloc() 更快，
// 但返回的 Buffer 实例可能包含旧数据，
// 因此需要使用 fill() 或 write() 重写。
const buf3 = Buffer.allocUnsafe(10);

// 创建一个包含 [0x1, 0x2, 0x3] 的 Buffer。
const buf4 = Buffer.from([1, 2, 3]);

// 创建一个包含 UTF-8 字节 [0x74, 0xc3, 0xa9, 0x73, 0x74] 的 Buffer。
const buf5 = Buffer.from('tést');

// 创建一个包含 Latin-1 字节 [0x74, 0xe9, 0x73, 0x74] 的 Buffer。
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, and `Buffer.allocUnsafe()`

在 Node.js v6 之前的版本中，`Buffer` 实例是通过 `Buffer` 构造函数创建的，它根据提供的参数返回不同的 `Buffer`：

* 传一个数值作为第一个参数给 `Buffer()`（如 `new Buffer(10)`），则分配一个指定大小的新建的 `Buffer` 对象。
  在 Node.js 8.0.0 之前，分配给这种 `Buffer` 实例的内存是**没有**初始化的，且**可能包含敏感数据**。
  这种 `Buffer` 实例随后必须被初始化，可以使用 [`buf.fill(0)`] 或写满这个 `Buffer`。
  虽然这种行为是为了提高性能而**有意为之的**，但开发经验表明，创建一个快速但未初始化的 `Buffer` 与创建一个慢点但更安全的 `Buffer` 之间需要有更明确的区分。从 Node.js 8.0.0 开始， `Buffer(num)` 和 `new Buffer(num)` 将返回一个初始化内存之后的 `Buffer`。
* 传一个字符串、数组、或 `Buffer` 作为第一个参数，则将所传对象的数据拷贝到 `Buffer` 中。
* 传入一个 [`ArrayBuffer`]，则返回一个与给定的 [`ArrayBuffer`] 共享所分配内存的 `Buffer`。

因为 `new Buffer()` 的行为会根据所传入的第一个参数的值的数据类型而明显地改变，所以如果应用程序没有正确地校验传给 `new Buffer()` 的参数、或未能正确地初始化新分配的 `Buffer` 的内容，就有可能在无意中为他们的代码引入安全性与可靠性问题。

为了使 `Buffer` 实例的创建更可靠、更不容易出错，各种 `new Buffer()` 构造函数已被 **废弃**，并由 `Buffer.from()`、[`Buffer.alloc()`]、和 [`Buffer.allocUnsafe()`] 方法替代。

**开发者们应当把所有正在使用的 `new Buffer()` 构造函数迁移到这些新的 API 上。**

* [`Buffer.from(array)`] 返回一个新建的包含所提供的字节数组的副本的 `Buffer`。
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] 返回一个新建的与给定的 [`ArrayBuffer`] 共享同一内存的 `Buffer`。
* [`Buffer.from(buffer)`] 返回一个新建的包含所提供的 `Buffer` 的内容的副本的 `Buffer`。
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] 返回一个新建的包含所提供的字符串的副本的 `Buffer`。
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] 返回一个指定大小的被填满的 `Buffer` 实例。
  这个方法会明显地比 [`Buffer.allocUnsafe(size)`] 慢，但可确保新创建的 `Buffer` 实例绝不会包含旧的和潜在的敏感数据。
* [`Buffer.allocUnsafe(size)`] 与 [`Buffer.allocUnsafeSlow(size)`] 返回一个新建的指定 `size` 的 `Buffer`，但它的内容**必须**被初始化，可以使用 [`buf.fill(0)`] 或完全写满。

如果 `size` 小于或等于 [`Buffer.poolSize`] 的一半，则 [`Buffer.allocUnsafe()`] 返回的 `Buffer` 实例**可能**会被分配进一个共享的内部内存池。

### The `--zero-fill-buffers` command line option
<!-- YAML
added: v5.10.0
-->

Node.js 可以在一开始就使用 `--zero-fill-buffers` 命令行选项强制所有使用 `new Buffer(size)` 、[`Buffer.allocUnsafe()`] 、[`Buffer.allocUnsafeSlow()`] 或 `new SlowBuffer(size)` 新分配的 `Buffer` 实例在创建时**自动用 0 填充**。
使用这个选项会**改变**这些方法的**默认行为**，且**对性能有明显的影响**。
建议只在需要强制新分配的 `Buffer` 实例不能包含潜在的敏感数据时才使用 `--zero-fill-buffers` 选项。

例子：

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```



### What makes `Buffer.allocUnsafe()` and `Buffer.allocUnsafeSlow()` "unsafe"?

当调用 [`Buffer.allocUnsafe()`] 和 [`Buffer.allocUnsafeSlow()`] 时，被分配的内存段是**未初始化的**（没有用 0 填充）。
虽然这样的设计使得内存的分配非常快，但已分配的内存段可能包含潜在的敏感旧数据。
使用通过 [`Buffer.allocUnsafe()`] 创建的没有被**完全**重写内存的 `Buffer` ，在 `Buffer` 内存可读的情况下，可能泄露它的旧数据。

虽然使用 [`Buffer.allocUnsafe()`] 有明显的性能优势，但必须额外**小心**，以避免给应用程序引入安全漏洞。


## Buffers and Character Encodings
<!-- YAML
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7111
    description: Introduced `latin1` as an alias for `binary`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2859
    description: Removed the deprecated `raw` and `raws` encodings.
-->

`Buffer` 实例一般用于表示编码字符的序列，比如 UTF-8 、 UCS2 、 Base64 、或十六进制编码的数据。
通过使用显式的字符编码，就可以在 `Buffer` 实例与普通的 JavaScript 字符串之间进行相互转换。

例子：

```js
const buf = Buffer.from('hello world', 'ascii');

// 输出 68656c6c6f20776f726c64
console.log(buf.toString('hex'));

// 输出 aGVsbG8gd29ybGQ=
console.log(buf.toString('base64'));
```

Node.js 目前支持的字符编码包括：

* `'ascii'` - 仅支持 7 位 ASCII 数据。如果设置去掉高位的话，这种编码是非常快的。

* `'utf8'` - 多字节编码的 Unicode 字符。许多网页和其他文档格式都使用 UTF-8 。

* `'utf16le'` - 2 或 4 个字节，小字节序编码的 Unicode 字符。支持代理对（U+10000 至 U+10FFFF）。

* `'ucs2'` - `'utf16le'` 的别名。

* `'base64'` - Base64 编码。当从字符串创建 `Buffer` 时，按照 [RFC4648 第 5 章]的规定，这种编码也将正确地接受“URL 与文件名安全字母表”。

* `'latin1'` - 一种把 `Buffer` 编码成一字节编码的字符串的方式（由 IANA 定义在 [RFC1345] 第 63 页，用作 Latin-1 补充块与 C0/C1 控制码）。

* `'binary'` - `'latin1'` 的别名。

* `'hex'` - 将每个字节编码为两个十六进制字符。

**注意**：现代浏览器遵循 [WHATWG 编码标准] 将 'latin1' 和 ISO-8859-1 别名为 win-1252。
这意味着当进行例如 `http.get()` 这样的操作时，如果返回的字符编码是 WHATWG 规范列表中的，则有可能服务器真的返回 win-1252 编码的数据，此时使用 `'latin1'` 字符编码可能会错误地解码数据。



## Buffers and TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` 实例也是 [`Uint8Array`] 实例。
但是与 ECMAScript 2015 中的 TypedArray 规范还是有些微妙的不同。
例如，当 [`ArrayBuffer#slice()`] 创建一个切片的副本时，[`Buffer#slice()`] 的实现是在现有的 `Buffer` 上不经过拷贝直接进行创建，这也使得 [`Buffer#slice()`] 更高效。

遵循以下注意事项，也可以从一个 `Buffer` 创建一个新的 [`TypedArray`] 实例：

1. `Buffer` 对象的内存是拷贝到 [`TypedArray`] 的，而不是共享的。

2. `Buffer` 对象的内存是被解析为一个明确元素的数组，而不是一个目标类型的字节数组。
也就是说，`new Uint32Array(Buffer.from([1, 2, 3, 4]))` 会创建一个包含 `[1, 2, 3, 4]` 四个元素的 [`Uint32Array`]，而不是一个只包含一个元素 `[0x1020304]` 或 `[0x4030201]` 的 [`Uint32Array`] 。

也可以通过 TypeArray 对象的 `.buffer` 属性创建一个新建的且与 [`TypedArray`] 实例共享同一分配内存的 `Buffer` 。

例子：

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// 拷贝 `arr` 的内容
const buf1 = Buffer.from(arr);

// 与 `arr` 共享内存
const buf2 = Buffer.from(arr.buffer);

// 输出: <Buffer 88 a0>
console.log(buf1);

// 输出: <Buffer 88 13 a0 0f>
console.log(buf2);

arr[1] = 6000;

// 输出: <Buffer 88 a0>
console.log(buf1);

// 输出: <Buffer 88 13 70 17>
console.log(buf2);
```

注意，当使用 [`TypedArray`] 的 `.buffer` 创建 `Buffer` 时，也可以通过传入 `byteOffset` 和 `length` 参数只使用 [`ArrayBuffer`] 的一部分。

例子：

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

// 输出: 16
console.log(buf.length);
```

`Buffer.from()` 和 [`TypedArray.from()`] 有着不同的签名与实现。
具体而言，[`TypedArray`] 的变种接受第二个参数，在类型数组的每个元素上调用一次映射函数：

* `TypedArray.from(source[, mapFn[, thisArg]])`

`Buffer.from()` 方法不支持使用映射函数：

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]


## Buffers and ES6 iteration

`Buffer` 实例可以使用 ECMAScript 2015 (ES6) 的 `for..of` 语法进行遍历。

例子：

```js
const buf = Buffer.from([1, 2, 3]);

// 输出:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

此外，[`buf.values()`] 、[`buf.keys()`] 和 [`buf.entries()`] 方法可用于创建迭代器。


## Class: Buffer

`Buffer` 类是一个全局变量类型，用来直接处理二进制数据的。
它能够使用多种方式构建。


### new Buffer(array)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.from(array)`] 代替。

* `array` {Array} 要从中复制的字节数组

使用八字节的 `array` 分配一个新的 `Buffer`。

例子:

```js
// 创建一个新的包含字符串 'buffer' 的 UTF-8 编码的 Buffer
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```


### new Buffer(arrayBuffer[, byteOffset [, length]])
<!-- YAML
added: v3.0.0
deprecated: v6.0.0
changes:
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4682
    description: The `byteOffset` and `length` parameters are supported now.
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] 代替。

* `arrayBuffer` {ArrayBuffer} 一个 [`ArrayBuffer`]，或 [`TypedArray`] 的 `.buffer` 属性
* `byteOffset` {integer} 开始拷贝的索引。 **默认：** `0`
* `length` {integer} 拷贝的字节数。**默认：** `arrayBuffer.length - byteOffset`

该方法将创建一个 [`ArrayBuffer`] 的视图，而不会复制底层内存。例如，当传入一个 [`TypedArray`] 实例的 `.buffer` 属性的引用时，这个新建的 `Buffer` 会像 [`TypedArray`] 那样共享同一段分配的内存。

可选的 `byteOffset` 和 `length` 参数指定将与 `Buffer` 共享的 `arrayBuffer` 的内存范围。

例子:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// 与 `arr` 共享内存
const buf = new Buffer(arr.buffer);

// 输出: <Buffer 88 13 a0 0f>
console.log(buf);

// 改变原始的 Uint16Array 也将改变 Buffer
arr[1] = 6000;

// 输出: <Buffer 88 13 70 17>
console.log(buf);
```

### new Buffer(buffer)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.from(buffer)`] 代替。

* `buffer` {Buffer} 一个要拷贝数据的已存在的 `Buffer`

将传入的 `buffer` 数据拷贝到一个新建的 `Buffer` 实例。

例子:

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

// 输出: auffer
console.log(buf1.toString());

// Prints: buffer
console.log(buf2.toString());
```


### new Buffer(size)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12141
    description: new Buffer(size) will return zero-filled memory by default.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.alloc()`] 代替（或 [`Buffer.allocUnsafe()`]）。

* `size` {integer} 新建的 `Buffer` 期望的长度

分配一个大小为 `size` 字节的新建的 `Buffer`。如果 `size` 大于 [`buffer.constants.MAX_LENGTH`] 或小于 0，则抛出 [`RangeError`] 错误。如果 `size` 为 0，则创建一个长度为 0 的 `Buffer`。

在 Node.js 8.0.0 之前，以这种方式创建的 `Buffer` 实例的底层内存是 *未初始化* 的。新建的 `Buffer` 的内容是未知的并且 *可能包含敏感数据*。使用 [`Buffer.alloc(size)`][`Buffer.alloc()`] 代替它去初始化 `Buffer` 为 0。

例子:

```js
const buf = new Buffer(10);

// 输出: <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf);
```

### new Buffer(string[, encoding])
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] 代替。

* `string` {string} 要编码的字符串
* `encoding` {string} `string` 的字符串编码。 **默认：** `'utf8'`

创建一个包含给定字符串 `string` 的 `Buffer`。`encoding` 参数制定 `string` 的字符串编码。

例子:

```js
const buf1 = new Buffer('this is a tést');

// 输出: this is a tést
console.log(buf1.toString());

// 输出: this is a tC)st
console.log(buf1.toString('ascii'));


const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

// 输出: this is a tést
console.log(buf2.toString());
```


### Class Method: Buffer.alloc(size[, fill[, encoding]])
<!-- YAML
added: v5.10.0
-->

* `size` {integer} 新建的 `Buffer` 期望的长度
* `fill` {string|Buffer|integer} 用来预填充新建的 `Buffer` 的值。
  **默认:** `0`
* `encoding` {string} 如果 `fill` 是字符串，则该值是它的字符编码。
  **默认:** `'utf8'`

分配一个大小为 `size` 字节的新建的 `Buffer` 。
如果 `fill` 为 `undefined` ，则该 `Buffer` 会用 **0 填充**。

例子：

```js
const buf = Buffer.alloc(5);

// 输出: <Buffer 00 00 00 00 00>
console.log(buf);
```

分配一个大小为 `size` 字节的新建的 `Buffer` 。
如果 `size` 大于 [`buffer.constants.MAX_LENGTH`] 或小于 0，则抛出 [`RangeError`] 错误。
如果 `size` 为 0，则创建一个长度为 0 的 `Buffer`。

如果指定了 `fill` ，则会调用 [`buf.fill(fill)`] 初始化分配的 `Buffer` 。

例子：

```js
const buf = Buffer.alloc(5, 'a');

// 输出: <Buffer 61 61 61 61 61>
console.log(buf);
```

如果同时指定了 `fill` 和 `encoding` ，则会调用 [`buf.fill(fill, encoding)`] 初始化分配的 `Buffer` 。

例子：

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

// 输出: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
console.log(buf);
```

调用 [`Buffer.alloc()`] 会明显地比另一个方法 [`Buffer.allocUnsafe()`] 慢，但是能确保新建的 `Buffer` 实例的内容**不会包含敏感数据**。

如果 `size` 不是一个数值，则抛出 `TypeError` 错误。


### Class Method: Buffer.allocUnsafe(size)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} 新建的 `Buffer` 期望的长度

分配一个大小为 `size` 字节的新建的 `Buffer` 。
如果 `size` 大于 [`buffer.constants.MAX_LENGTH`] 或小于 0，则抛出 [`RangeError`] 错误。
如果 `size` 为 0，则创建一个长度为 0 的 `Buffer`。

以这种方式创建的 `Buffer` 实例的底层内存是**未初始化**的。
新创建的 `Buffer` 的内容是未知的，且**可能包含敏感数据**。
可以使用 [`buf.fill(0)`] 初始化 `Buffer` 实例为0。

例子：

```js
const buf = Buffer.allocUnsafe(10);

// 输出: (内容可能不同): <Buffer a0 8b 28 3f 01 00 00 00 50 32>
console.log(buf);

buf.fill(0);

// 输出: <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf);
```

如果 `size` 不是一个数值，则抛出 `TypeError` 错误。

注意，`Buffer` 模块会预分配一个大小为 [`Buffer.poolSize`] 的内部 `Buffer` 实例作为快速分配池，
用于使用 [`Buffer.allocUnsafe()`] 新创建的 `Buffer` 实例，以及废弃的 `new Buffer(size)` 构造器，
仅限于当 `size` 小于或等于 `Buffer.poolSize >> 1` （[`Buffer.poolSize`] 除以2后的最大整数值）。

对这个预分配的内部内存池的使用，是调用 `Buffer.alloc(size, fill)` 和 `Buffer.allocUnsafe(size).fill(fill)` 的关键区别。
具体地说，如果 `size` 小于或等于 [`Buffer.poolSize`] 的一半，则 `Buffer.alloc(size, fill)` **不会**使用这个内部的 `Buffer` 池，而 `Buffer.allocUnsafe(size).fill(fill)` **会**使用这个内部的 `Buffer` 池。
当应用程序需要 [`Buffer.allocUnsafe()`] 提供额外的性能时，这个细微的区别是非常重要的。


### Class Method: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.10.0
-->

* `size` {integer} 新建的 `Buffer` 期望的长度

分配一个大小为 `size` 字节的新建的 `Buffer` 。
如果 `size` 大于 [`buffer.constants.MAX_LENGTH`] 或小于 0，则抛出 [`RangeError`] 错误。
如果 `size` 为 0，则创建一个长度为 0 的 `Buffer`。

以这种方式创建的 `Buffer` 实例的底层内存是**未初始化**的。
新创建的 `Buffer` 的内容是未知的，且**可能包含敏感数据**。
可以使用 [`buf.fill(0)`] 初始化 `Buffer` 实例为0。

当使用 [`Buffer.allocUnsafe()`] 分配新建的 `Buffer` 时，当分配的内存小于 4KB 时，默认会从一个单一的预分配的 `Buffer` 切割出来。
这使得应用程序可以避免垃圾回收机制因创建太多独立分配的 `Buffer` 实例而过度使用。
这个方法通过像大多数持久对象一样消除追踪与清理的需求，改善了性能与内存使用。

当然，在开发者可能需要在不确定的时间段从内存池保留一小块内存的情况下，使用 `Buffer.allocUnsafeSlow()` 创建一个非池的 `Buffer` 实例然后拷贝出相关的位元是合适的做法。

例子：

```js
// 需要保留一小块内存块
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // 为保留的数据分配内存
  const sb = Buffer.allocUnsafeSlow(10);

  // 拷贝数据进新分配的内存
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

`Buffer.allocUnsafeSlow()` 应当仅仅作为开发者已经在他们的应用程序中观察到过度的内存保留之后的终极手段使用。

如果 `size` 不是一个数值，则抛出 `TypeError` 错误。


### Class Method: Buffer.byteLength(string[, encoding])
<!-- YAML
added: v0.1.90
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8946
    description: Passing invalid input will now throw an error.
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5255
    description: The `string` parameter can now be any `TypedArray`, `DataView`
                 or `ArrayBuffer`.
-->

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer} 要计算长度的值
* `encoding` {string} 如果 `string` 是字符串，则这是它的字符编码。
  **默认:** `'utf8'`
* 返回: {integer} `string` 包含的字节数

返回一个字符串的实际字节长度。
这与 [`String.prototype.length`] 不同，因为那返回字符串的**字符**数。

*注意* 对于 `'base64'` 和 `'hex'`， 该函数假定有效的输入。 对于包含 non-Base64/Hex-encoded 数据的字符串 (e.g. 空格)， 返回值可能大于
从字符串中创建的 `Buffer` 的长度。 

例子：

```js
const str = '\u00bd + \u00bc = \u00be';

// 输出: ½ + ¼ = ¾: 9 个字符, 12 个字节
console.log(`${str}: ${str.length} 个字符, ` +
            `${Buffer.byteLength(str, 'utf8')} 个字节`);
```

当 `string` 是一个 `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`] 时，返回实际的字节长度。


### Class Method: Buffer.compare(buf1, buf2)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Returns: {integer}

比较 `buf1` 和 `buf2` ，通常用于 `Buffer` 实例数组的排序。
相当于调用 [`buf1.compare(buf2)`] 。

例子：

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

// 输出: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (结果相当于: [buf2, buf1])
console.log(arr.sort(Buffer.compare));
```


### Class Method: Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Array} 要合并的 `Buffer` 或 [`Uint8Array`] 实例的数组
* `totalLength` {integer} 合并时 `list` 中 `Buffer` 实例的总长度
* 返回: {Buffer}

返回一个合并了 `list` 中所有 `Buffer` 实例的新建的 `Buffer` 。

如果 `list` 中没有元素、或 `totalLength` 为 0 ，则返回一个新建的长度为 0 的 `Buffer` 。

如果没有提供 `totalLength` ，则从 `list` 中的 `Buffer` 实例计算得到。
为了计算 `totalLength` 会导致需要执行额外的循环，所以提供明确的长度会运行更快。

如果提供了 `totalLength`，`totalLength` 必须是一个正整数。如果从 `list` 中计算得到的 `Buffer` 长度超过了 `totalLength`，则合并的结果将会被截断为 `totalLength` 的长度。

例子：从一个包含三个 `Buffer` 实例的数组创建为一个单一的 `Buffer`。

```js
const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

// 输出: 42
console.log(totalLength);

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

// 输出: <Buffer 00 00 00 00 ...>
console.log(bufA);

// 输出: 42
console.log(bufA.length);
```

### Class Method: Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `array` {Array}

通过一个八位字节的 `array` 创建一个新的 `Buffer` 。

例子：

```js
// 创建一个新的包含字符串 'buffer' 的 UTF-8 字节的 Buffer
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

如果 `array` 不是一个数组，则抛出 `TypeError` 错误。


### Class Method: Buffer.from(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer} 一个 [`ArrayBuffer`]，或一个 [`TypedArray`] 的 `.buffer` 属性。
* `byteOffset` {integer} 开始拷贝的索引。默认为 `0`。
* `length` {integer} 拷贝的字节数。默认为 `arrayBuffer.length - byteOffset`。

该方法将创建一个 [`ArrayBuffer`] 的视图，而不会复制底层内存。例如，当传入一个 [`TypedArray`] 实例的 `.buffer` 属性的引用时，这个新建的 `Buffer` 会像 [`TypedArray`] 那样共享同一分配的内存。

例子：

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// 与 `arr` 共享内存
const buf = Buffer.from(arr.buffer);

// 输出: <Buffer 88 13 a0 0f>
console.log(buf);

// 改变原始的 Uint16Array 也会改变 Buffer
arr[1] = 6000;

// 输出: <Buffer 88 13 70 17>
console.log(buf);
```

可选的 `byteOffset` 和 `length` 参数指定将与 `Buffer` 共享的 `arrayBuffer` 的内存范围。

例子：

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

// 输出: 2
console.log(buf.length);
```

如果 `arrayBuffer` 不是一个 [`ArrayBuffer`]，则抛出 `TypeError` 错误。

### Class Method: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer} 一个要拷贝数据的已存在的 `Buffer`

将传入的 `buffer` 数据拷贝到一个新建的 `Buffer` 实例。

例子：

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

// 输出: auffer
console.log(buf1.toString());

// 输出: buffer
console.log(buf2.toString());
```

如果 `buffer` 不是一个 `Buffer`，则抛出 `TypeError` 错误。


### Class Method: Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} 要编码的字符串
* `encoding` {string} `string` 的字符编码。 **默认:** `'utf8'`

新建一个包含所给的 JavaScript 字符串 `string` 的 `Buffer` 。
`encoding` 参数指定 `string` 的字符编码。

例子：

```js
const buf1 = Buffer.from('this is a tést');

// 输出: this is a tést
console.log(buf1.toString());

// 输出: this is a tC)st
console.log(buf1.toString('ascii'));


const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

// 输出: this is a tést
console.log(buf2.toString());
```

如果 `string` 不是一个字符串，则抛出 `TypeError` 错误。


### Class Method: Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} An object supporting `Symbol.toPrimitive` or `valueOf()`
* `offsetOrEncoding` {number|string} A byte-offset or encoding, depending on
  the value returned either by `object.valueOf()` or
  `object[Symbol.toPrimitive]()`.
* `length` {number} A length, depending on the value returned either by
  `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to
`object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

For example:

```js
const buf = Buffer.from(new String('this is a test'));
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns
`Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

For example:

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```


### Class Method: Buffer.isBuffer(obj)
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* 返回: {boolean}

如果 `obj` 是一个 `Buffer` 则返回 `true` ，否则返回 `false` 。


### Class Method: Buffer.isEncoding(encoding)
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} 一个要检查的字符编码名称
* 返回: {boolean}

如果 `encoding` 是一个支持的字符编码则返回 `true`，否则返回 `false` 。


### Class Property: Buffer.poolSize
<!-- YAML
added: v0.11.3
-->

* {integer} **默认:** `8192`

这是用于决定预分配的、内部 `Buffer` 实例池的大小的字节数。
这个值可以修改。


### buf[index]
<!-- YAML
type: property
name: [index]
-->

索引操作符 `[index]` 可用于获取或设置 `buf` 中指定 `index` 位置的八位字节。
这个值指向的是单个字节，所以合法的值范围是的 `0x00` 至 `0xFF`（十六进制），或 `0` 至 `255`（十进制）。

该操作符继承自 `Uint8Array`，所以它对越界访问的处理与 `UInt8Array` 相同（也就是说，获取时返回 `undefined`，设置时什么也不做）。

例如：拷贝一个 ASCII 字符串到一个 `Buffer`，每次一个字节。

```js
const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

// 输出: Node.js
console.log(buf.toString('ascii'));
```


### buf.buffer

`buffer` 属性指向创建该 `Buffer` 的底层的 `ArrayBuffer` 对象。

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// 输出: true
```

### buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `target` parameter can now be a `Uint8Array`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5880
    description: Additional parameters for specifying offsets are supported now.
-->

* `target` {Buffer|Uint8Array} 要比较的 `Buffer` 或 [`Uint8Array`]。
* `targetStart` {integer} `target` 中开始对比的偏移量。
  **默认:** `0`
* `targetEnd` {integer} `target` 中结束对比的偏移量（不包含）。
  当 `targetStart` 为 `undefined` 时忽略。
  **默认:** `target.length`
* `sourceStart` {integer} `buf` 中开始对比的偏移量。
  当 `targetStart` 为 `undefined` 时忽略。
  **默认:** `0`
* `sourceEnd` {integer} `buf` 中结束对比的偏移量（不包含）。
  当 `targetStart` 为 `undefined` 时忽略。
  **默认:** [`buf.length`]
* 返回: {integer}

比较 `buf` 与 `target`，返回表明 `buf` 在排序上是否排在 `target` 之前、或之后、或相同。
对比是基于各自 `Buffer` 实际的字节序列。

* 如果 `target` 与 `buf` 相同，则返回 `0` 。
* 如果 `target` 排在 `buf` **前面**，则返回 `1` 。
* 如果 `target` 排在 `buf` **后面**，则返回 `-1` 。

例子：

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

// 输出: 0
console.log(buf1.compare(buf1));

// 输出: -1
console.log(buf1.compare(buf2));

// 输出: -1
console.log(buf1.compare(buf3));

// 输出: 1
console.log(buf2.compare(buf1));

// 输出: 1
console.log(buf2.compare(buf3));

// 输出: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (结果相当于: [buf1, buf3, buf2])
console.log([buf1, buf2, buf3].sort(Buffer.compare));
```

可选的  `targetStart` 、 `targetEnd` 、 `sourceStart` 与 `sourceEnd` 参数可用于分别在 `target` 与 `buf` 中限制对比在指定的范围内。

例子：

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

// 输出: 0
console.log(buf1.compare(buf2, 5, 9, 0, 4));

// 输出: -1
console.log(buf1.compare(buf2, 0, 6, 4));

// 输出: 1
console.log(buf1.compare(buf2, 5, 6, 5));
```

如果 `targetStart < 0` 、 `sourceStart < 0` 、 `targetEnd > target.byteLength` 或 `sourceEnd > source.byteLength`，则抛出 `RangeError` 错误。


### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} 要拷贝进的 `Buffer` 或 [`Uint8Array`]。
* `targetStart` {integer} `target` 中开始拷贝进的偏移量。
  **默认:** `0`
* `sourceStart` {integer} `buf` 中开始拷贝的偏移量。
  当 `targetStart` 为 `undefined` 时忽略。
  **默认:** `0`
* `sourceEnd` {integer} `buf` 中结束拷贝的偏移量（不包含）。
  当 `sourceStart` 为 `undefined` 时忽略。
  **默认:** [`buf.length`]
* 返回: {integer} 被拷贝的字节数。

拷贝 `buf` 的一个区域的数据到 `target` 的一个区域，即便 `target` 的内存区域与 `buf` 的重叠。

例子：创建两个 `Buffer` 实例 `buf1` 与 `buf2` ，并拷贝 `buf1` 中第 16 个至第 19 个字节到 `buf2` 第 8 个字节起。

```js
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 是 'a' 的十进制 ASCII 值
  buf1[i] = i + 97;
}

buf1.copy(buf2, 8, 16, 20);

// 输出: !!!!!!!!qrst!!!!!!!!!!!!!
console.log(buf2.toString('ascii', 0, 25));
```

例子：创建一个 `Buffer` ，并拷贝同一 `Buffer` 中一个区域的数据到另一个重叠的区域。

```js
const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 是 'a' 的十进制 ASCII 值
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

// 输出: efghijghijklmnopqrstuvwxyz
console.log(buf.toString());
```



### buf.entries()
<!-- YAML
added: v1.1.0
-->

* 返回: {Iterator}

从 `buf` 的内容中，创建并返回一个 `[index, byte]` 形式的[迭代器]。

例子：记录一个 `Buffer` 全部的内容。

```js
const buf = Buffer.from('buffer');

// 输出:
//   [0, 98]
//   [1, 117]
//   [2, 102]
//   [3, 102]
//   [4, 101]
//   [5, 114]
for (const pair of buf.entries()) {
  console.log(pair);
}
```


### buf.equals(otherBuffer)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer} 要比较的 `Buffer` 或 [`Uint8Array`]。
* 返回: {boolean}

如果 `buf` 与 `otherBuffer` 具有完全相同的字节，则返回 `true`，否则返回 `false`。

例子：

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

// 输出: true
console.log(buf1.equals(buf2));

// 输出: false
console.log(buf1.equals(buf3));
```


### buf.fill(value[, offset[, end]][, encoding])
<!-- YAML
added: v0.5.0
changes:
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4935
    description: The `encoding` parameter is supported now.
-->

* `value` {string|Buffer|integer} 用来填充 `buf` 的值
* `offset` {integer} 开始填充 `buf` 的位置。**默认:** `0`
* `end` {integer} 结束填充 `buf` 的位置（不包含）。**默认:** [`buf.length`]
* `encoding` {string} 如果 `value` 是一个字符串，则这是它的字符编码。
  **默认:** `'utf8'`
* 返回: {Buffer} `buf` 的引用

如果未指定 `offset` 和 `end`，则填充整个 `buf`。
这个简化使得一个 `Buffer` 的创建与填充可以在一行内完成。

例子：用 ASCII 字符 `'h'` 填充 `Buffer`。

```js
const b = Buffer.allocUnsafe(50).fill('h');

// 输出: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
console.log(b.toString());
```

`value` 如果不是一个字符串或整数，则会被强行转换为 `uint32` 值。

如果 `fill()` 操作的最后一次写入的是一个多字节字符，则只有字符中适合 `buf` 的第一个字节会被写入。

例子：用一个两个字节的字符填充 `Buffer`。

```js
// 输出: <Buffer c8 a2 c8>
console.log(Buffer.allocUnsafe(3).fill('\u0222'));
```


### buf.includes(value[, byteOffset][, encoding])
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} 要搜索的值
* `byteOffset` {integer} `buf` 中开始搜索的位置。**默认:** `0`
* `encoding` {string} 如果 `value` 是一个字符串，则这是它的字符编码。
  **默认:** `'utf8'`
* 返回: {boolean} 如果 `buf` 找到 `value`，则返回 `true`，否则返回 `false`

相当于 [`buf.indexOf() !== -1`]。

例子：

```js
const buf = Buffer.from('this is a buffer');

// 输出: true
console.log(buf.includes('this'));

// 输出: true
console.log(buf.includes('is'));

// 输出: true
console.log(buf.includes(Buffer.from('a buffer')));

// 输出: true
// (97 是 'a' 的十进制 ASCII 值)
console.log(buf.includes(97));

// 输出: false
console.log(buf.includes(Buffer.from('a buffer example')));

// 输出: true
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));

// 输出: false
console.log(buf.includes('this', 4));
```


### buf.indexOf(value[, byteOffset][, encoding])
<!-- YAML
added: v1.5.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
  - version: v5.7.0, v4.4.0
    pr-url: https://github.com/nodejs/node/pull/4803
    description: When `encoding` is being passed, the `byteOffset` parameter
                 is no longer required.
-->

* `value` {string|Buffer|Uint8Array|integer} 要搜索的值
* `byteOffset` {integer} `buf` 中开始搜索的位置。**默认:** `0`
* `encoding` {string} 如果 `value` 是一个字符串，则这是它的字符编码。
  **默认:** `'utf8'`
* 返回: {integer} `buf` 中 `value` 首次出现的索引，如果 `buf` 没包含 `value` 则返回 `-1`

如果 `value` 是：

  * 字符串，则 `value` 根据 `encoding` 的字符编码进行解析。
  * `Buffer` 或 [`Uint8Array`]，则 `value` 会被作为一个整体使用。如果要比较部分 `Buffer`，可使用 [`buf.slice()`]。
  * 数值, 则 `value` 会解析为一个 `0` 至 `255` 之间的无符号八位整数值。

例子：

```js
const buf = Buffer.from('this is a buffer');

// 输出: 0
console.log(buf.indexOf('this'));

// 输出: 2
console.log(buf.indexOf('is'));

// 输出: 8
console.log(buf.indexOf(Buffer.from('a buffer')));

// 输出: 8
// (97 是 'a' 的十进制 ASCII 值)
console.log(buf.indexOf(97));

// 输出: -1
console.log(buf.indexOf(Buffer.from('a buffer example')));

// 输出: 8
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));


const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2');

// 输出: 4
console.log(utf16Buffer.indexOf('\u03a3', 0, 'ucs2'));

// 输出: 6
console.log(utf16Buffer.indexOf('\u03a3', -4, 'ucs2'));
```

如果 `value` 不是一个字符串， 数字， 或者 `Buffer`， 该方法会抛出一个
`TypeError` 异常， 如果 `value` 是一个数字， 它将会被强制转换成一个有效的 byte 值，
该值介于0到255之间。

如果 `byteOffset` 不是一个数字， 它将会被强制转换成一个数字。  任何对 `NaN` or 0, like `{}`, `[]`, `null` or `undefined`，
的参数， 将会搜索整个 buffer。 该行为和 [`String#indexOf()`] 保持一致。

```js
const b = Buffer.from('abcdef');

// 传入一个不是有效字节的数字
// 输出：2，相当于搜索 99 或 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// 传入 byteOffset，其值强制转换为 NaN 或 0
// 输出：1，搜索整个 buffer
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

如果 `value` 是一个空字符串或空 `Buffer`，并且 `byteOffset` 小于 `buf.length`，返回 `byteOffset`。如果 `value` 是一个空字符串，并且 `byteOffset` 大于 `buf.length`，返回 `buf.length`。

### buf.keys()
<!-- YAML
added: v1.1.0
-->

* 返回: {Iterator}

创建并返回一个包含 `buf` 键名（索引）的[迭代器]。

例子：

```js
const buf = Buffer.from('buffer');

// 输出:
//   0
//   1
//   2
//   3
//   4
//   5
for (const key of buf.keys()) {
  console.log(key);
}
```


### buf.lastIndexOf(value[, byteOffset][, encoding])
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} 要搜索的值
* `byteOffset` {integer} `buf` 中开始搜索的位置。
  **默认:** [`buf.length`]` - 1`
* `encoding` {string} 如果 `value` 是一个字符串，则这是它的字符编码。
  **默认:** `'utf8'`
* 返回: {integer} `buf` 中 `value` 最后一次出现的索引，如果 `buf` 没包含 `value` 则返回 `-1`

与 [`buf.indexOf()`] 类似，除了 `buf` 是从后往前搜索而不是从前往后。

例子：

```js
const buf = Buffer.from('this buffer is a buffer');

// 输出: 0
console.log(buf.lastIndexOf('this'));

// 输出: 17
console.log(buf.lastIndexOf('buffer'));

// 输出: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));

// 输出: 15
// (97 是 'a' 的十进制 ASCII 值)
console.log(buf.lastIndexOf(97));

// 输出: -1
console.log(buf.lastIndexOf(Buffer.from('yolo')));

// 输出: 5
console.log(buf.lastIndexOf('buffer', 5));

// 输出: -1
console.log(buf.lastIndexOf('buffer', 4));


const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2');

// 输出: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'ucs2'));

// 输出: 4
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'ucs2'));
```

如果 `value` 不是一个字符串， 数字， 或者 `Buffer`， 该方法会抛出一个
`TypeError` 异常， 如果 `value` 是一个数字， 它将会被强制转换成一个有效的 byte 值，
该值介于0到255之间。

如果 `byteOffset` 不是一个数字， 它将会被强制转换成一个数字。  任何对 `NaN` or 0, like `{}`, `[]`, `null` or `undefined`，
的参数， 将会搜索整个 buffer。 该行为和 [`String#lastIndexOf()`] 保持一致。

```js
const b = Buffer.from('abcdef');

// 传入一个不是有效字节的数字
// 输出：2，相当于搜索 99 或 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// 传入 byteOffset，其值强制转换为 NaN
// 输出：1，搜索整个 buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// 传入 byteOffset，其值强制转换为 0
// 输出：-1，相当于传入 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

如果 `value` 是一个空字符串或者空 `Buffer`，返回 `byteOffset`。

### buf.length
<!-- YAML
added: v0.1.90
-->

* {integer}

返回 `buf` 在字节数上分配的内存量。
注意，这并不一定反映 `buf` 内可用的数据量。

例子：创建一个 `Buffer` 并写入一个较短的 ASCII 字符串。

```js
const buf = Buffer.alloc(1234);

// 输出: 1234
console.log(buf.length);

buf.write('some string', 0, 'ascii');

// 输出: 1234
console.log(buf.length);
```

虽然 `length` 属性不是不可变的，但改变 `length` 的值可能会导致不确定、不一致的行为。
那些希望修改一个 `Buffer` 的长度的应用程序应当将 `length` 视为只读的，且使用 [`buf.slice()`] 创建一个新的 `Buffer`。

例子：

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

// 输出: 10
console.log(buf.length);

buf = buf.slice(0, 5);

// 输出: 5
console.log(buf.length);
```



### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`] instead.

`buf.parent` 属性是 `buf.buffer` 不推荐的别名。

### buf.readDoubleBE(offset[, noAssert])
### buf.readDoubleLE(offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 8`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {number}

用指定的字节序格式（`readDoubleBE()` 返回大端序，`readDoubleLE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个64位双精度值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

// 输出: 8.20788039913184e-304
console.log(buf.readDoubleBE());

// 输出: 5.447603722011605e-270
console.log(buf.readDoubleLE());

// 抛出异常: RangeError: Index out of range
console.log(buf.readDoubleLE(1));

// 警告: 读取超出 buffer 的最后一位字节！
// 这会导致内存区段错误！不要这么做！
console.log(buf.readDoubleLE(1, true));
```


### buf.readFloatBE(offset[, noAssert])
### buf.readFloatLE(offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {number}

用指定的字节序格式（`readFloatBE()` 返回大端序，`readFloatLE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个32位浮点值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([1, 2, 3, 4]);

// 输出: 2.387939260590663e-38
console.log(buf.readFloatBE());

// 输出: 1.539989614439558e-36
console.log(buf.readFloatLE());

// 抛出异常: RangeError: Index out of range
console.log(buf.readFloatLE(1));

// 警告: 读取超出 buffer 的最后一位字节！
// 这会导致内存区段错误！不要这么做！
console.log(buf.readFloatLE(1, true));
```


### buf.readInt8(offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 1`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

从 `buf` 中指定的 `offset` 读取一个有符号的8位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

从 `Buffer` 中读取的整数值会被解析为二进制补码值。

例子：

```js
const buf = Buffer.from([-1, 5]);

// 输出: -1
console.log(buf.readInt8(0));

// 输出: 5
console.log(buf.readInt8(1));

// 抛出异常: RangeError: Index out of range
console.log(buf.readInt8(2));
```


### buf.readInt16BE(offset[, noAssert])
### buf.readInt16LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 2`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

用指定的字节序格式（`readInt16BE()` 返回大端序，`readInt16LE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个有符号的16位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

从 `Buffer` 中读取的整数值会被解析为二进制补码值。

例子：

```js
const buf = Buffer.from([0, 5]);

// 输出: 5
console.log(buf.readInt16BE());

// 输出: 1280
console.log(buf.readInt16LE());

// 抛出异常: RangeError: Index out of range
console.log(buf.readInt16LE(1));
```



### buf.readInt32BE(offset[, noAssert])
### buf.readInt32LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

用指定的字节序格式（`readInt32BE()` 返回大端序，`readInt32LE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个有符号的32位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

从 `Buffer` 中读取的整数值会被解析为二进制补码值。

例子：

```js
const buf = Buffer.from([0, 0, 0, 5]);

// 输出: 5
console.log(buf.readInt32BE());

// 输出: 83886080
console.log(buf.readInt32LE());

// 抛出异常: RangeError: Index out of range
console.log(buf.readInt32LE(1));
```


### buf.readIntBE(offset, byteLength[, noAssert])
### buf.readIntLE(offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - byteLength`
* `byteLength` {integer} 要读取的字节数。必须满足：`0 < byteLength <= 6`
* `noAssert` {boolean} 是否跳过 `offset` 和 `byteLength` 校验？ **默认:** `false`
* 返回: {integer}

从 `buf` 中指定的 `offset` 读取 `byteLength` 个字节，且读取的值会被解析为二进制补码值。
最高支持48位精度。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// 输出: -546f87a9cbee
console.log(buf.readIntLE(0, 6).toString(16));

// 输出: 1234567890ab
console.log(buf.readIntBE(0, 6).toString(16));

// 抛出异常: RangeError: Index out of range
console.log(buf.readIntBE(1, 6).toString(16));
```


### buf.readUInt8(offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 1`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

从 `buf` 中指定的 `offset` 读取一个无符号的8位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([1, -2]);

// 输出: 1
console.log(buf.readUInt8(0));

// 输出: 254
console.log(buf.readUInt8(1));

// 抛出异常: RangeError: Index out of range
console.log(buf.readUInt8(2));
```



### buf.readUInt16BE(offset[, noAssert])
### buf.readUInt16LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 2`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

用指定的字节序格式（`readUInt16BE()` 返回大端序，`readUInt16LE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个无符号的16位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

// 输出: 1234
console.log(buf.readUInt16BE(0).toString(16));

// 输出: 3412
console.log(buf.readUInt16LE(0).toString(16));

// 输出: 3456
console.log(buf.readUInt16BE(1).toString(16));

// 输出: 5634
console.log(buf.readUInt16LE(1).toString(16));

// 抛出异常: RangeError: Index out of range
console.log(buf.readUInt16LE(2).toString(16));
```


### buf.readUInt32BE(offset[, noAssert])
### buf.readUInt32LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `offset` 检验？**默认:** `false`
* 返回: {integer}

用指定的字节序格式（`readUInt32BE()` 返回大端序，`readUInt32LE()` 返回小端序）从 `buf` 中指定的 `offset` 读取一个无符号的32位整数值。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

// 输出: 12345678
console.log(buf.readUInt32BE(0).toString(16));

// 输出: 78563412
console.log(buf.readUInt32LE(0).toString(16));

// 抛出异常: RangeError: Index out of range
console.log(buf.readUInt32LE(1).toString(16));
```


### buf.readUIntBE(offset, byteLength[, noAssert])
### buf.readUIntLE(offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} 开始读取的位置，必须满足：`0 <= offset <= buf.length - byteLength`
* `byteLength` {integer} 要读取的字节数。必须满足：`0 < byteLength <= 6`
* `noAssert` {boolean} 是否跳过 `offset` 和 `byteLength` 校验？ **默认:** `false`
* 返回: {integer}

从 `buf` 中指定的 `offset` 读取 `byteLength` 个字节，且读取的值会被解析为无符号的整数。
最高支持48位精度。

设置 `noAssert` 为 `true` 则 `offset` 可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// 输出: 1234567890ab
console.log(buf.readUIntBE(0, 6).toString(16));

// 输出: ab9078563412
console.log(buf.readUIntLE(0, 6).toString(16));

//抛出异常: RangeError: Index out of range
console.log(buf.readUIntBE(1, 6).toString(16));
```


### buf.slice([start[, end]])
<!-- YAML
added: v0.3.0
changes:
  - version: v7.1.0, v6.9.2
    pr-url: https://github.com/nodejs/node/pull/9341
    description: Coercing the offsets to integers now handles values outside
                 the 32-bit integer range properly.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/9101
    description: All offsets are now coerced to integers before doing any
                 calculations with them.
-->

* `start` {integer} 新建的 `Buffer` 开始的位置。 **默认:** `0`
* `end` {integer} 新建的 `Buffer` 结束的位置（不包含）。
  **默认:** [`buf.length`]
* 返回: {Buffer}

返回一个指向相同原始内存的新建的 `Buffer`，但做了偏移且通过 `start` 和 `end` 索引进行裁剪。

Specifying `end` greater than [`buf.length`] will return the same result as
that of `end` equal to [`buf.length`].

**注意，修改这个新建的 `Buffer` 切片，也会同时修改原始的 `Buffer` 的内存，因为这两个对象所分配的内存是重叠的。**

例子：创建一个包含 ASCII 字母表的 `Buffer`，并进行切片，然后修改原始 `Buffer` 上的一个字节。

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 是 'a' 的十进制 ASCII 值 
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

// 输出: abc
console.log(buf2.toString('ascii', 0, buf2.length));

buf1[0] = 33;

// 输出: !bc
console.log(buf2.toString('ascii', 0, buf2.length));
```

指定负的索引会导致切片的生成是相对于 `buf` 的末尾而不是开头。

例子：

```js
const buf = Buffer.from('buffer');

// 输出: buffe
// (相当于 buf.slice(0, 5))
console.log(buf.slice(-6, -1).toString());

// 输出: buff
// (相当于 buf.slice(0, 4))
console.log(buf.slice(-6, -2).toString());

// 输出: uff
// (相当于 buf.slice(1, 4))
console.log(buf.slice(-5, -2).toString());
```


### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* 返回: {Buffer} `buf` 的引用

将 `buf` 解析为一个无符号16位的整数数组，并且以字节顺序原地进行交换。
如果 [`buf.length`] 不是2的倍数，则抛出 `RangeError` 错误。

例子：

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// 输出: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap16();

// 输出: <Buffer 02 01 04 03 06 05 08 07>
console.log(buf1);


const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// 抛出异常: RangeError: Buffer size must be a multiple of 16-bits
buf2.swap16();
```


### buf.swap32()
<!-- YAML
added: v5.10.0
-->

* 返回: {Buffer} `buf` 的引用

将 `buf` 解析为一个无符号32位的整数数组，并且以字节顺序原地进行交换。
如果 [`buf.length`] 不是4的倍数，则抛出 `RangeError` 错误。

例子：

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// 输出: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap32();

// 输出: <Buffer 04 03 02 01 08 07 06 05>
console.log(buf1);


const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// 抛出异常: RangeError: Buffer size must be a multiple of 32-bits
buf2.swap32();
```



### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* 返回: {Buffer} `buf` 的引用

将 `buf` 解析为一个64位的数值数组，并且以字节顺序原地进行交换。
如果 [`buf.length`] 不是8的倍数，则抛出 `RangeError` 错误。

例子：

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// 输出: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap64();

// 输出: <Buffer 08 07 06 05 04 03 02 01>
console.log(buf1);


const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// 抛出异常: RangeError: Buffer size must be a multiple of 64-bits
buf2.swap64();
```

注意，JavaScript 不能编码64位整数。
该方法是用来处理64位浮点数的。


### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* 返回: {Object}

返回 `buf` 的 JSON 格式。
当字符串化一个 `Buffer` 实例时，[`JSON.stringify()`] 会隐式地调用该函数。

例子：

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

// 输出: {"type":"Buffer","data":[1,2,3,4,5]}
console.log(json);

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

// 输出: <Buffer 01 02 03 04 05>
console.log(copy);
```


### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} 解码使用的字符编码。**默认:** `'utf8'`
* `start` {integer} 开始解码的字节偏移量。**默认:** `0`
* `end` {integer} 结束解码的字节偏移量（不包含）。
  **默认:** [`buf.length`]
* 返回: {string}

根据 `encoding` 指定的字符编码解码 `buf` 成一个字符串。
`start` 和 `end` 可传入用于只解码 `buf` 的一部分。

字符串实例的最大长度（以UTF-16代码为单位）可查看[`buffer.constants.MAX_STRING_LENGTH`][]。

例子：

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 是 'a' 的十进制 ASCII 值
  buf1[i] = i + 97;
}

// 输出: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii'));

// 输出: abcde
console.log(buf1.toString('ascii', 0, 5));


const buf2 = Buffer.from('tést');

// 输出: 74c3a97374
console.log(buf2.toString('hex'));

// 输出: té
console.log(buf2.toString('utf8', 0, 3));

// 输出: té
console.log(buf2.toString(undefined, 0, 3));
```



### buf.values()
<!-- YAML
added: v1.1.0
-->

* 返回: {Iterator}

创建并返回一个包含 `buf` 的值（字节）的[迭代器]。
当 `Buffer` 使用 `for..of` 时会自动调用该函数。

例子：

```js
const buf = Buffer.from('buffer');

// 输出:
//   98
//   117
//   102
//   102
//   101
//   114
for (const value of buf.values()) {
  console.log(value);
}

// 输出:
//   98
//   117
//   102
//   102
//   101
//   114
for (const value of buf) {
  console.log(value);
}
```


### buf.write(string[, offset[, length]][, encoding])
<!-- YAML
added: v0.1.90
-->

* `string` {string} 要写入 `buf` 的字符串
* `offset` {integer} 开始写入 `string` 的位置。**默认:** `0`
* `length` {integer} 要写入的字节数。**默认:** `buf.length - offset`
* `encoding` {string} `string` 的字符编码。**默认:** `'utf8'`
* 返回: {integer} 写入的字节数

根据 `encoding` 的字符编码写入 `string` 到 `buf` 中的 `offset` 位置。
`length` 参数是写入的字节数。
如果 `buf` 没有足够的空间保存整个字符串，则只会写入 `string` 的一部分。
只部分解码的字符不会被写入。

例子：

```js
const buf = Buffer.allocUnsafe(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

// 输出: 12 个字节: ½ + ¼ = ¾
console.log(`${len} 个字节: ${buf.toString('utf8', 0, len)}`);
```


### buf.writeDoubleBE(value, offset[, noAssert])
### buf.writeDoubleLE(value, offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {number} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 8`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeDoubleBE()` 写入大端序，`writeDoubleLE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的64位双精度值。
当 `value` 不是一个64位双精度值时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(0xdeadbeefcafebabe, 0);

// 输出: <Buffer 43 eb d5 b7 dd f9 5f d7>
console.log(buf);

buf.writeDoubleLE(0xdeadbeefcafebabe, 0);

// 输出: <Buffer d7 5f f9 dd b7 d5 eb 43>
console.log(buf);
```


### buf.writeFloatBE(value, offset[, noAssert])
### buf.writeFloatLE(value, offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {number} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeFloatBE()` 写入大端序，`writeFloatLE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的32位浮点值。
当 `value` 不是一个32位浮点值时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

// 输出: <Buffer 4f 4a fe bb>
console.log(buf);

buf.writeFloatLE(0xcafebabe, 0);

// 输出: <Buffer bb fe 4a 4f>
console.log(buf);
```



### buf.writeInt8(value, offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 1`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的有符号的8位整数。
当 `value` 不是一个有符号的8位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的末尾，但后果是不确定的。

`value` 会被解析并写入为二进制补码值。

例子：

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

// 输出: <Buffer 02 fe>
console.log(buf);
```


### buf.writeInt16BE(value, offset[, noAssert])
### buf.writeInt16LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 2`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeInt16BE()` 写入大端序，`writeInt16LE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的有符号的16位整数。
当 `value` 不是一个有符号的16位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

`value` 会被解析并写入为二进制补码值。

例子：

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

// 输出: <Buffer 01 02 04 03>
console.log(buf);
```


### buf.writeInt32BE(value, offset[, noAssert])
### buf.writeInt32LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeInt32BE()` 写入大端序，`writeInt32LE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的有符号的32位整数。
当 `value` 不是一个有符号的32位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

`value` 会被解析并写入为二进制补码值。

例子：

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

// 输出: <Buffer 01 02 03 04 08 07 06 05>
console.log(buf);
```



### buf.writeIntBE(value, offset, byteLength[, noAssert])
### buf.writeIntLE(value, offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - byteLength`
* `byteLength` {integer} 要写入的字节数，必须满足：`0 < byteLength <= 6`
* `noAssert` {boolean} 是否跳过 `value`、`offset` 和 `byteLength` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

写入 `value` 中的 `byteLength` 个字节到 `buf` 中指定的 `offset` 位置。
最高支持48位精度。
当 `value` 不是一个有符号的整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的末尾，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

// 输出: <Buffer 12 34 56 78 90 ab>
console.log(buf);

buf.writeUIntLE(0x1234567890ab, 0, 6);

// 输出: <Buffer ab 90 78 56 34 12>
console.log(buf);
```


### buf.writeUInt8(value, offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 1`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的无符号的8位整数。
当 `value` 不是一个无符号的8位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的末尾，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

// 输出: <Buffer 03 04 23 42>
console.log(buf);
```



### buf.writeUInt16BE(value, offset[, noAssert])
### buf.writeUInt16LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 2`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeUInt16BE()` 写入大端序，`writeUInt16LE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的无符号的16位整数。
当 `value` 不是一个无符号的16位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

// 输出: <Buffer de ad be ef>
console.log(buf);

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

// 输出: <Buffer ad de ef be>
console.log(buf);
```


### buf.writeUInt32BE(value, offset[, noAssert])
### buf.writeUInt32LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - 4`
* `noAssert` {boolean} 是否跳过 `value` 和 `offset` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

用指定的字节序格式（`writeUInt32BE()` 写入大端序，`writeUInt32LE()` 写入小端序）写入 `value` 到 `buf` 中指定的 `offset` 位置。
`value` 应当是一个有效的无符号的32位整数。
当 `value` 不是一个无符号的32位整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的最后一位字节，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

// 输出: <Buffer fe ed fa ce>
console.log(buf);

buf.writeUInt32LE(0xfeedface, 0);

// 输出: <Buffer ce fa ed fe>
console.log(buf);
```


### buf.writeUIntBE(value, offset, byteLength[, noAssert])
### buf.writeUIntLE(value, offset, byteLength[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} 要写入 `buf` 的数值
* `offset` {integer} 开始写入的位置，必须满足：`0 <= offset <= buf.length - byteLength`
* `byteLength` {integer} 要写入的字节数，必须满足：`0 < byteLength <= 6`
* `noAssert` {boolean} 是否跳过 `value`、`offset` 和 `byteLength` 检验？**默认:** `false`
* 返回: {integer} `offset` 加上写入的字节数

写入 `value` 中的 `byteLength` 个字节到 `buf` 中指定的 `offset` 位置。
最高支持48位精度。
当 `value` 不是一个无符号的整数时，反应是不确定的。

设置 `noAssert` 为 `true` 则 `value` 的编码形式可超出 `buf` 的末尾，但后果是不确定的。

例子：

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

// 输出: <Buffer 12 34 56 78 90 ab>
console.log(buf);

buf.writeUIntLE(0x1234567890ab, 0, 6);

// 输出: <Buffer ab 90 78 56 34 12>
console.log(buf);
```


## buffer.INSPECT_MAX_BYTES
<!-- YAML
added: v0.5.4
-->

* {Integer} **默认:** `50`

当调用 `buf.inspect()` 时返回的最大字节数。
可以被用户模块重写。
详见 [`util.inspect()`] 了解更多 `buf.inspect()` 的行为。

注意，这个属性是在通过 `require('buffer')` 返回的 `buffer` 模块上，而不是在 `Buffer` 的全局变量或 `Buffer` 实例上。


## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} 分配给单个 `Buffer` 实例的最大内存

An alias for [`buffer.constants.MAX_LENGTH`][]

注意整个属性是通过 `require('buffer')` 返回的 `buffer` 模块的属性，而不是全局 `Buffer` 对象或 `Buffer` 实例的属性。

## buffer.transcode(source, fromEnc, toEnc)
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} 一个 `Buffer` 或 `Uint8Array` 实例
* `fromEnc` {string} 当前编码
* `toEnc` {string} 目标编码


将给定的 `Buffer` 或 `Uint8Array` 实例从一个字符编码重新编码到另一个字符。 返回一个新的Buffer实例。

如果 `fromEnc` 或 `toEnc` 指定的字符串编码无效，或者不允许从 `fromEnc` 转换为 `toEnc`，将抛出异常。

如果给定的字节序列不能在目标编码中充分表示，转码过程将使用替代字符。例如：

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// 输出: '?'
```

因为欧元符号（`€`）不能在 US-ASCII 中表示，所以在转换 `Buffer` 的时候使用 `?` 代替。

注意 `buffer` 属性是通过 `require('buffer')` 返回的 `buffer` 模块，而不是全局 `Buffer` 或 `Buffer` 实例的属性。

## Class: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.allocUnsafeSlow()`] 代替。

返回一个不放入分配池的 `Buffer`。

为了避免垃圾回收机制因创建太多独立分配的 Buffer 实例而过度使用，默认小于 4KB 的内存会从一个单一的大内存中切割出来。这种方式可以有效提高性能和内存利用率，避免 V8 频繁追踪和清理过多的 Persistent 对象。

开发者可能需要在不确定的时间段从内存池保留一小块内存的情况下，针对这种情况，就可以使用 `SlowBuffer` 类创建不放入分配池 `Buffer` 实例，然后通过内存拷贝获取目标数据。

例子:

```js
// 需要保存的一小块内存
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // 为保留的数据分配内存
  const sb = SlowBuffer(10);

  // 将数据复制到新的分配的内存中
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

`SlowBuffer` 应当仅仅作为开发者已经在他们的应用程序中观察到过度的内存保留之后的终极手段使用。

### new SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> 稳定性: 0 - 废弃的: 使用 [`Buffer.allocUnsafeSlow()`] 代替。

* `size` {integer} 新建的 `SlowBuffer` 期望的长度

分配一个 `size` 字节的新的 `Buffer`。如果 `size` 大于 [`buffer.constants.MAX_LENGTH`] 或小于 0，将会抛出 [`RangeError`] 错误。如果 `size` 为 0，则返回一个为 0 的 `Buffer`.

`SlowBuffer` 实例的底层内存是 *未初始化的*。新建的 `SlowBuffer` 的内容是未知的，并且可能包含敏感数据。使用 [`buf.fill(0)`][`buf.fill()`] 初始化 `SlowBuffer` 为 0。

例子:

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

// 输出: (内容可能有变化): <Buffer 78 e0 82 02 01>
console.log(buf);

buf.fill(0);

// 输出: <Buffer 00 00 00 00 00>
console.log(buf);
```

## Buffer Constants
<!-- YAML
added: 8.2.0
-->

请注意`buffer.constants`是通过`require('buffer')`返回的`buffer`模块的一个属性，而不是全局`Buffer`或`Buffer`实例。 


### buffer.constants.MAX_LENGTH
<!-- YAML
added: 8.2.0
-->

* {integer}  单个`Buffer`实例允许的最大量度。

在32位体系结构上，这个值是`(2^30)-1` (~1GB)。
在64位体系结构上，这个值是`(2^31)-1` (~2GB)。

也可在[`buffer.kMaxLength`][]查看该值。


### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: 8.2.0
-->

* {integer} 单个`string`实例允许的最大长度。

代表`string`能有的原始最大`长度`，以UTF-16代码为单位。

该值可能取决于正在使用的JS引擎。


[`ArrayBuffer#slice()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/slice
[`ArrayBuffer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[`Buffer.alloc()`]: #buffer_class_method_buffer_alloc_size_fill_encoding
[`Buffer.allocUnsafe()`]: #buffer_class_method_buffer_allocunsafe_size
[`Buffer.allocUnsafeSlow()`]: #buffer_class_method_buffer_allocunsafeslow_size
[`Buffer.from(array)`]: #buffer_class_method_buffer_from_array
[`Buffer.from(arrayBuffer)`]: #buffer_class_method_buffer_from_arraybuffer_byteoffset_length
[`Buffer.from(buffer)`]: #buffer_class_method_buffer_from_buffer
[`Buffer.from(string)`]: #buffer_class_method_buffer_from_string_encoding
[`Buffer.poolSize`]: #buffer_class_property_buffer_poolsize
[`DataView`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
[`JSON.stringify()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[`RangeError`]: errors.html#errors_class_rangeerror
[`String#indexOf()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
[`String#lastIndexOf()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf
[`String.prototype.length`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length
[`TypedArray.from()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/from
[`TypedArray`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
[`Uint32Array`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
[`Uint8Array`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[`buf.buffer`]: #buffer_buf_buffer
[`buf.compare()`]: #buffer_buf_compare_target_targetstart_targetend_sourcestart_sourceend
[`buf.entries()`]: #buffer_buf_entries
[`buf.fill()`]: #buffer_buf_fill_value_offset_end_encoding
[`buf.indexOf()`]: #buffer_buf_indexof_value_byteoffset_encoding
[`buf.keys()`]: #buffer_buf_keys
[`buf.length`]: #buffer_buf_length
[`buf.slice()`]: #buffer_buf_slice_start_end
[`buf.values()`]: #buffer_buf_values
[`buffer.kMaxLength`]: #buffer_buffer_kmaxlength
[`buffer.constants.MAX_LENGTH`]: #buffer_buffer_constants_max_length
[`buffer.constants.MAX_STRING_LENGTH`]: #buffer_buffer_constants_max_string_length
[`util.inspect()`]: util.html#util_util_inspect_object_options
[RFC1345]: https://tools.ietf.org/html/rfc1345
[RFC4648, Section 5]: https://tools.ietf.org/html/rfc4648#section-5
[WHATWG Encoding Standard]: https://encoding.spec.whatwg.org/
[iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols

[`Buffer.allocUnsafe(size)`]: #buffer_class_method_buffer_allocunsafe_size
[`Buffer.allocUnsafeSlow(size)`]: #buffer_class_method_buffer_allocunsafeslow_size
[`buf1.compare(buf2)`]: #buffer_buf_compare_target_targetstart_targetend_sourcestart_sourceend
[`buf.fill(fill)`]: #buffer_buf_fill_value_offset_end_encoding
[`buf.fill(fill, encoding)`]: #buffer_buf_fill_value_offset_end_encoding
[`buf.fill(0)`]: #buffer_buf_fill_value_offset_end_encoding
[`buf.indexOf() !== -1`]: #buffer_buf_indexof_value_byteoffset_encoding
[`Buffer#slice()`]: #buffer_buf_slice_start_end
[RFC4648 第 5 章]: https://tools.ietf.org/html/rfc4648#section-5
[WHATWG 规范]: https://encoding.spec.whatwg.org/
[WHATWG 编码标准]: https://encoding.spec.whatwg.org/
[迭代器]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
