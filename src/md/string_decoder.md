# String Decoder

> 稳定性: 2 - 稳定的

`string_decoder` 模块提供了一个 API，用于把 `Buffer` 对象解码成字符串，但会保留编码过的多字节 UTF-8 与 UTF-16 字符。使用以下方法引入：

```js
const { StringDecoder } = require('string_decoder');
```

例子，`StringDecoder` 类的基本用法：

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer.from([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

当一个 `Buffer` 实例被写入 `StringDecoder` 实例时，会使用一个内部的 buffer 来确保解码后的字符串不会包含残缺的多字节字符。
残缺的多字节字符会被保存在这个 buffer 中，直到下次调用 `stringDecoder.write()` 或直到 `stringDecoder.end()` 被调用。

例子，欧元符号（`€`）的三个 UTF-8 编码的字节被分成三次操作写入：

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## Class: new StringDecoder([encoding])
<!-- YAML
added: v0.1.99
-->

* `encoding` {string} `StringDecoder` 使用的字符编码。默认为 `'utf8'`。

创建一个新的 `StringDecoder` 实例。


### stringDecoder.end([buffer])
<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer} 包含待解码字节的 `Buffer`。

以字符串的形式返回内部 buffer 中剩余的字节。
残缺的 UTF-8 与 UTF-16 字符的字节会被替换成符合字符编码的字符。

如果提供了 `buffer` 参数，则在返回剩余字节之前会再执行一次 `stringDecoder.write()`。


### stringDecoder.write(buffer)
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `buffer` {Buffer} 包含待解码字节的 `Buffer`。

返回一个解码后的字符串，并确保返回的字符串不包含 `Buffer` 末尾残缺的多字节字符，残缺的多字节字符会被保存在一个内部的 buffer 中用于下次调用 `stringDecoder.write()` 或 `stringDecoder.end()`。

