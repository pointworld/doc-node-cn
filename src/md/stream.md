# Stream

> 稳定性: 2 - 稳定的

流（stream）在 Node.js 中是处理流数据的抽象接口（abstract interface）。
`stream` 模块提供了基础的 API 。使用这些 API 可以很容易地来构建实现流接口的对象。

Node.js 提供了多种流对象。 例如，
[HTTP 请求][http-incoming-message] 和 [`process.stdout`][]
就都是流的实例。

流可以是可读的、可写的，或是可读写的。所有的流都是
[`EventEmitter`][] 的实例。

`stream` 模块可以通过以下方式引入：

```js
const stream = require('stream');
```

尽管所有的 Node.js 用户都应该理解流的工作方式，这点很重要，
但是 `stream` 模块本身只对于那些需要创建新的流的实例的开发者最有用处。 对于主要是 *消费* 流的开发者来说，他们很少（如果有的话）需要接使用 `stream` 模块。
 
 
## Organization of this Document


本文档主要分为两节，第三节是一些额外的注意事项。第一节阐述了在应用中和 *使用* 流相关的 API 。 第二节阐述了和 *实现* 新的流类型相关的 API 。


## Types of Streams

Node.js 中有四种基本的流类型：

* [Readable][] - 可读的流 (例如
  [`fs.createReadStream()`][]).
* [Writable][] - 可写的流 (例如
  [`fs.createWriteStream()`][]).
* [Duplex][] - 可读写的流 (例如
  [`net.Socket`][]).
* [Transform][] - 在读写过程中可以修改和变换数据的 Duplex 流  (例如 [`zlib.createDeflate()`][]).


### Object Mode

所有使用 Node.js API 创建的流对象都只能操作 strings 和 `Buffer`（或 `Uint8Array`）
对象。但是，通过一些第三方流的实现，你依然能够处理其它类型的 JavaScript 值 (除了 `null`，它在流处理中有特殊意义)。 这些流被认为是工作在 “对象模式”（object mode）。

在创建流的实例时，可以通过 `objectMode` 选项使流的实例切换到对象模式。试图将已经存在的流切换到对象模式是不安全的。


### Buffering

<!--type=misc-->

[Writable][] 和 [Readable][] 流都会将数据存储到内部的缓存（buffer）中。这些缓存可以
通过相应的 `writable._writableState.getBuffer()` 或
`readable._readableState.buffer`来获取。

缓存的大小取决于传递给流构造函数的 `highWaterMark` 选项。
对于普通的流， `highWaterMark`
选项指定了总共的字节数。对于工作在对象模式的流，
`highWaterMark` 指定了对象的总数。

当可读流的实现调用 
[`stream.push(chunk)`][stream-push] 方法时，数据被放到缓存中。如果流的消费者
没有调用 [`stream.read()`][stream-read] 方法， 这些数据会始终存在于内部队列中，直到被消费。

当内部可读缓存的大小达到 `highWaterMark` 指定的阈值时，流会暂停从底层资源读取数据，直到当前
缓存的数据被消费 (也就是说，
流会在内部停止调用 `readable._read()` 来填充可读缓存)。

可写流通过反复调用
[`writable.write(chunk)`][stream-write] 方法将数据放到缓存。
当内部可写缓存的总大小小于
`highWaterMark` 指定的阈值时， 调用 `writable.write()` 将返回`true`。 
一旦内部缓存的大小达到或超过 `highWaterMark` ，调用 `writable.write()` 将返回 `false` 。

`stream` API 的关键目标， 尤其对于 [`stream.pipe()`] 方法，
就是限制缓存数据大小，以达到可接受的程度。这样，对于读写速度不匹配的源头和目标，就不会超出可用的内存大小。

[Duplex][] 和 [Transform][] 都是可读写的。
在内部，它们都维护了 *两个* 相互独立的缓存用于读和写。
在维持了合理高效的数据流的同时，也使得对于读和写可以独立进行而互不影响。
例如， [`net.Socket`][] 就是 [Duplex][] 的实例，它的可读端可以消费从套接字（socket）中接收的数据， 
可写端则可以将数据写入到套接字。
由于数据写入到套接字中的速度可能比从套接字接收数据的速度快或者慢，
在读写两端使用独立缓存，并进行独立操作就显得很重要了。


## API for Stream Consumers

<!--type=misc-->

几乎所有的 Node.js 应用，不管多么简单，都在某种程度上使用了流。
下面是在 Node.js 应用中使用流实现的一个简单的 HTTP 服务器：

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req 是 http.IncomingMessage 的实例，这是一个 Readable Stream
  // res 是 http.ServerResponse 的实例，这是一个 Writable Stream

  let body = '';
  // 接收数据为 utf8 字符串，
  // 如果没有设置字符编码，将接收到 Buffer 对象。
  req.setEncoding('utf8');

  // 如果监听了 'data' 事件，Readable streams 触发 'data' 事件 
  req.on('data', (chunk) => {
    body += chunk;
  });

  // end 事件表明整个 body 都接收完毕了 
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // 发送一些信息给用户
      res.write(typeof data);
      res.end();
    } catch (er) {
      // json 数据解析失败 
      res.statusCode = 400;
      return res.end(`error: ${er.message}`);
    }
  });
});

server.listen(1337);

// $ curl localhost:1337 -d "{}"
// object
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Unexpected token o in JSON at position 1
```

[Writable][] 流 (比如例子中的 `res`) 暴露了一些方法，比如
`write()` 和 `end()` 。这些方法可以将数据写入到流中。

当流中的数据可以读取时，[Readable][] 流使用 [`EventEmitter`][] API 来通知应用。
这些数据可以使用多种方法从流中读取。

[Writable][] 和 [Readable][] 流都使用了 [`EventEmitter`][] API ，通过多种方式，
与流的当前状态进行交互。

[Duplex][] 和 [Transform][] 都是同时满足 [Writable][] 和 [Readable][] 。

对于只是简单写入数据到流和从流中消费数据的应用来说，
不要求直接实现流接口，通常也不需要调用 `require('stream')`。

需要实现两种类型流的开发者可以参考 [API for Stream Implementers][]。

### Writable Streams

Writable streams 是 *destination* 的一种抽象，这种 *destination* 允许数据写入。

[Writable][] 的例子包括了：

* [HTTP requests, on the client][]
* [HTTP responses, on the server][]
* [fs write streams][]
* [zlib streams][zlib]
* [crypto streams][crypto]
* [TCP sockets][]
* [child process stdin][]
* [`process.stdout`][], [`process.stderr`][]

*注意*: 上面的某些例子事实上是 [Duplex][] 流，只是实现了 [Writable][] 接口。

所有 [Writable][] 流都实现了
`stream.Writable` 类定义的接口。

尽管特定的 [Writable][] 流的实现可能略有差别，
所有的 Writable streams 都可以按一种基本模式进行使用，如下面例子所示：

```js
const myStream = getWritableStreamSomehow();
myStream.write('some data');
myStream.write('some more data');
myStream.end('done writing data');
```


#### Class: stream.Writable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'
<!-- YAML
added: v0.9.4
-->

`'close'` 事件将在流或其底层资源（比如一个文件）关闭后触发。`'close'` 事件触发后，该流将不会再触发任何事件。

不是所有 [Readable][] 都会触发 `'close'` 事件。


##### Event: 'drain'
<!-- YAML
added: v0.9.4
-->

如果调用 [`stream.write(chunk)`][stream-write] 方法返回 `false`，流将在适当的时机触发
`'drain'` 事件，这时才可以继续向流中写入数据。

```js
// 向可写流中写入数据一百万次。
// 需要注意背压 （back-pressure）。
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // 最后 一次
        writer.write(data, encoding, callback);
      } else {
        // 检查是否可以继续写入。 
        // 这里不要传递 callback， 因为写入还没有结束！ 
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // 这里提前停下了， 
      // 'drain' 事件触发后才可以继续写入  
      writer.once('drain', write);
    }
  }
}
```



##### Event: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

`'error'` 事件在写入数据出错或者使用管道出错时触发。事件发生时，回调函数仅会接收到一个 `Error` 参数。

*注意*: `'error'` 事件发生时，流并不会关闭。


##### Event: 'finish'
<!-- YAML
added: v0.9.4
-->

在调用了 [`stream.end()`][stream-end] 方法，且缓冲区数据都已经传给底层系统（underlying system）之后， `'finish'` 事件将被触发。

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.end('This is the end\n');
writer.on('finish', () => {
  console.error('All writes are now complete.');
});
```



##### Event: 'pipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} 输出到目标可写流（writable）的源流（source stream）

在可读流（readable stream）上调用 [`stream.pipe()`][] 方法，并在目标流向 (destinations) 中添加当前可写流 ( writable ) 时，将会在可写流上触发 `'pipe'` 事件。

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.error('something is piping into the writer');
  assert.equal(src, reader);
});
reader.pipe(writer);
```



##### Event: 'unpipe'
<!-- YAML
added: v0.9.4
-->

* `src` {[Readable][] Stream} [unpiped][`stream.unpipe()`] 当前可写流的源流

在 [Readable][] 上调用 [`stream.unpipe()`][] 方法，从目标流向中移除当前 [Writable][] 时，将会触发 `'unpipe'` 事件。

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.error('Something has stopped piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
reader.unpipe(writer);
```


##### writable.cork()
<!-- YAML
added: v0.11.2
-->

调用 `writable.cork()` 方法将强制所有写入数据都内存中的缓冲区里。
直到调用 [`stream.uncork()`][] 或
[`stream.end()`][stream-end] 方法时，缓冲区里的数据才会被输出。

在向流中写入大量小块数据（small chunks of data）时，内部缓冲区（internal
buffer）可能失效，从而导致性能下降。`writable.cork()` 方法主要就是用来避免这种情况。 对于这种情况，
实现了 `writable._writev()` 方法的流可以对写入的数据进行缓冲，从而提高写入效率。

也可查看 [`writable.uncork()`]。


##### writable.end([chunk][, encoding][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} 可选的，需要写入的数据。对于非对象模式下的流， `chunk` 必须是字符串、或 `Buffer`、或 `Uint8Array`。对于对象模式下的流， `chunk` 可以是任意的 JavaScript 值，除了 `null`。
* `encoding` {string} 如果 `chunk` 是字符串，这里指定字符编码。
* `callback` {Function} 可选的，流结束时的回调函数。

调用 `writable.end()` 方法表明接下来没有数据要被写入 [Writable][]。通过传入可选的 `chunk` 和 `encoding` 参数，可以在关闭流之前再写入一段数据。如果传入了可选的 `callback` 函数，它将作为 [`'finish'`][] 事件的回调函数。

在调用了 [`stream.end()`][stream-end] 方法之后，再调用 [`stream.write()`][stream-write] 方法将会导致错误。

```js
// 写入 'hello, ' ，并用 'world!' 来结束写入
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// 后面不允许再写入数据！
```



##### writable.setDefaultEncoding(encoding)
<!-- YAML
added: v0.11.15
changes:
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/5040
    description: This method now returns a reference to `writable`.
-->

* `encoding` {string} 新的默认编码
* 返回： `this`

`writable.setDefaultEncoding()` 用于为 [Writable][] 设置 `encoding`。


##### writable.uncork()
<!-- YAML
added: v0.11.2
-->

`writable.uncork()` 将输出在 [`stream.cork()`][] 方法被调用之后缓冲在内存中的所有数据。

如果使用 [`writable.cork()`] 和 `writable.uncork()` 来管理写入缓存，建议使用 `process.nextTick()` 来延迟调用 `writable.uncork()` 方法。通过这种方式，可以对单个 Node.js 事件循环中调用的所有 `writable.write()` 方法进行批处理。

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

如果一个流多次调用了 [`writable.cork()`] 方法，那么也必须调用同样次数的 `writable.uncork()` 方法以输出缓冲区数据。

```js
stream.cork();
stream.write('some ');
stream.cork();
stream.write('data ');
process.nextTick(() => {
  stream.uncork();
  // 之前的数据只有在 uncork() 被二次调用后才会输出
  stream.uncork();
});
```

也可查看 [`writable.cork()`]。


##### writable.write(chunk[, encoding][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6170
    description: Passing `null` as the `chunk` parameter will always be
                 considered invalid now, even in object mode.
-->

* `chunk` {string|Buffer|Uint8Array|any} 要写入的数据。可选的。
  For streams
  not operating in object mode, `chunk` must be a string, `Buffer` or
  `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value
  other than `null`.
* `encoding` {string} 如果 `chunk` 是字符串，这里指定字符编码
* `callback` {Function} 缓冲数据输出时的回调函数
* 返回： {boolean} 如果流需要等待 `'drain'` 事件触发才能继续写入数据，这里将返回 `false` ； 否则返回 `true`。

`writable.write()` 方法向流中写入数据，并在数据处理完成后调用 `callback` 。如果有错误发生， `callback` *不一定* 会接收到这个错误作为第一个参数。要确保可靠地检测到写入错误，应该监听
`'error'` 事件。

在确认了 `chunk` 后，如果内部缓冲区的大小小于创建流时设定的 `highWaterMark` 阈值，函数将返回 `true` 。
如果返回值为 `false` ，应该停止向流中写入数据，直到 [`'drain'`][] 事件被触发。

当一个流不处在 drain 的状态， 对 `write()` 的调用会缓存数据块， 并且返回 false。
一旦所有当前所有缓存的数据块都排空了（被操作系统接受来进行输出）， 那么 `'drain'` 事件就会被触发。
我们建议， 一旦 write() 返回 false， 在 `'drain'` 事件触发前， 不能写入任何数据块。 
然而，当流不处在 `'drain'` 状态时， 调用 `write()` 是被允许的， Node.js 会缓存所有已经写入的数据块， 
直到达到最大内存占用， 这时它会无条件中止。 甚至在它中止之前， 高内存占用将会导致差的垃圾回收器的性能和高的系统相对敏感性
（即使内存不在需要，也通常不会被释放回系统）。 如果远程的另一端没有读取数据， TCP sockets 可能永远也不会 drain ， 
所以写入到一个不会drain的socket可能会导致远程可利用的漏洞。 

对于一个 [Transform][], 写入数据到一个不会drain的流尤其成问题， 因为 `Transform` 流默认被暂停， 直到它们被pipe或者被添加了
 `'data'` 或 `'readable'` event handler。 

如果将要被写入的数据可以根据需要生成或者取得，我们建议将逻辑封装为一个 [Readable][] 流并且使用 
[`stream.pipe()`][]。 但是如果调用 `write()` 优先, 那么可以使用 [`'drain'`][] 事件来防止回压并且避免内存问题:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Wait for cb to be called before doing any other write.
write('hello', () => {
  console.log('write completed, do more writes now');
});
```

对象模式的写入流将忽略 `encoding` 参数。


##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* Returns: `this`

Destroy the stream, and emit the passed error. After this call, the
writable stream has ended. Implementors should not override this method,
but instead implement [`writable._destroy`][writable-_destroy].

### Readable Streams

可读流（Readable streams）是对提供数据的 *源头* （source）的抽象。

可读流的例子包括：

* [HTTP responses, on the client][http-incoming-message]
* [HTTP requests, on the server][http-incoming-message]
* [fs read streams][]
* [zlib streams][zlib]
* [crypto streams][crypto]
* [TCP sockets][]
* [child process stdout and stderr][]
* [`process.stdin`][]

所有的 [Readable][] 都实现了
`stream.Readable` 类定义的接口。


#### Two Modes

可读流事实上工作在下面两种模式之一：flowing 和 paused 。

在 flowing 模式下， 可读流自动从系统底层读取数据，并通过 [`EventEmitter`][] 接口的事件尽快将数据提供给应用。

在 paused 模式下，必须显式调用 [`stream.read()`][stream-read] 方法来从流中读取数据片段。

所有初始工作模式为 paused 的 [Readable][] 流，可以通过下面三种途径切换到 flowing
模式：

* 监听 [`'data'`][] 事件。
* 调用 [`stream.resume()`][stream-resume] 方法。
* 调用 [`stream.pipe()`][] 方法将数据发送到 [Writable][]。

可读流可以通过下面途径切换到 paused 模式：

* 如果不存在管道目标（pipe destination），可以通过调用
  [`stream.pause()`][stream-pause] 方法实现。
* 如果存在管道目标，可以通过取消 [`'data'`][] 事件监听，并调用 [`stream.unpipe()`][] 方法移除所有管道目标来实现。

这里需要记住的重要概念就是，可读流需要先为其提供消费或忽略数据的机制，才能开始提供数据。如果消费机制被禁用或取消，可读流将 *尝试*
停止生成数据。

*注意*: 为了向后兼容，取消 [`'data'`][] 事件监听并 **不会** 自动将流暂停。同时，如果存在管道目标（pipe destination），且目标状态变为可以接收数据（drain and ask for
more data），调用了 [`stream.pause()`][stream-pause] 方法也并不保证流会一直 *保持* 暂停状态。

*注意*: 如果 [Readable][] 切换到 flowing 模式，且没有消费者处理流中的数据，这些数据将会丢失。
比如， 调用了 `readable.resume()` 方法却没有监听 `'data'` 事件，或是取消了 `'data'` 事件监听，就有可能出现这种情况。


#### Three States

可读流的“两种操作模式”是一种简单抽象。它抽象了在可读流实现（Readable stream implementation）内部发生的复杂的状态管理过程。

在任意时刻，任意可读流应确切处于下面三种状态之一：

* `readable._readableState.flowing = null`
* `readable._readableState.flowing = false`
* `readable._readableState.flowing = true`

若 `readable._readableState.flowing` 为 `null`，由于不存在数据消费者，可读流将不会产生数据。
在这个状态下，监听 `'data'` 事件，调用 `readable.pipe()`
方法，或者调用 `readable.resume()` 方法，
`readable._readableState.flowing` 的值将会变为 `true` 。这时，随着数据生成，可读流开始频繁触发事件。

调用 `readable.pause()` 方法， `readable.unpipe()` 方法， 或者接收 “背压”（back pressure），
将导致 `readable._readableState.flowing` 值变为 `false`。
这将暂停事件流，但 *不会* 暂停数据生成。
While in this state, attaching a listener for the `'data'` event
would not cause `readable._readableState.flowing` to switch to `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// flowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // will not emit 'data'
pass.resume(); // must be called to make 'data' being emitted
```

当 `readable._readableState.flowing` 值为 `false` 时， 数据可能堆积到流的内部缓存中。


#### Choose One

可读流 API 的演化贯穿了多个 Node.js 版本，提供了多种方法来消费流数据。通常开发者应该选择其中 *一种* 来消费数据，而 *不应该* 在单个流使用多种方法来消费数据。

对于大多数用户，建议使用 `readable.pipe()` 方法来消费流数据，因为它是最简单的一种实现。开发者如果要精细地控制数据传递和产生的过程，可以使用 [`EventEmitter`][] 和 `readable.pause()`/`readable.resume()` 提供的 API 。


#### Class: stream.Readable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'
<!-- YAML
added: v0.9.4
-->

The `'close'` event is emitted when the stream and any of its underlying
resources (a file descriptor, for example) have been closed. The event indicates
that no more events will be emitted, and no further computation will occur.

Not all [Readable][] streams will emit the `'close'` event.

##### Event: 'data'
<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} 数据片段。对于非对象模式的可读流，这是一个字符串或者 `Buffer`。
  对于对象模式的可读流，这可以是除 `null` 以外的任意类型 JavaScript 值。

`'data'` 事件会在流将数据传递给消费者时触发。当流转换到 flowing 模式时会触发该事件。调用 `readable.pipe()`， `readable.resume()` 方法，或为 `'data'` 事件添加回调可以将流转换到 flowing 模式。 `'data'` 事件也会在调用 `readable.read()` 方法并有数据返回时触发。

在没有明确暂停的流上添加 `'data'` 事件监听会将流转换为 flowing 模式。 数据会在可用时尽快传递给下个流程。

如果调用 `readable.setEncoding()` 方法明确为流指定了默认编码，回调函数将接收到一个字符串，否则接收到的数据将是一个
`Buffer` 实例。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
```


##### Event: 'end'
<!-- YAML
added: v0.9.4
-->

`'end'` 事件将在流中再没有数据可供消费时触发。

*注意*： `'end'` 事件只有在数据被完全消费后 **才会触发** 。 可以在数据被完全消费后，通过将流转换到 
flowing 模式， 或反复调用 [`stream.read()`][stream-read] 方法来实现这一点。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
readable.on('end', () => {
  console.log('There will be no more data.');
});
```


##### Event: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

The `'error'` event may be emitted by a Readable implementation at any time.
Typically, this may occur if the underlying stream is unable to generate data
due to an underlying internal failure, or when a stream implementation attempts
to push an invalid chunk of data.

The listener callback will be passed a single `Error` object.

##### Event: 'readable'
<!-- YAML
added: v0.9.4
-->

`'readable'` 事件将在流中有数据可供读取时触发。在某些情况下，为 `'readable'` 事件添加回调将会导致一些数据被读取到内部缓存中。

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  // 有一些数据可读了
});
```
当到达流数据尾部时， `'readable'` 事件也会触发。触发顺序在 `'end'` 事件之前。

事实上， `'readable'` 事件表明流有了新的动态：要么是有了新的数据，要么是到了流的尾部。 对于前者， [`stream.read()`][stream-read] 将返回可用的数据。而对于后者， [`stream.read()`][stream-read] 将返回
`null`。 例如，下面的例子中的 `foo.txt` 是一个空文件：

```js
const fs = require('fs');
const rr = fs.createReadStream('foo.txt');
rr.on('readable', () => {
  console.log('readable:', rr.read());
});
rr.on('end', () => {
  console.log('end');
});
```

上面交脚本的输出如下：

```txt
$ node test.js
readable: null
end
```

*注意*： 通常情况下，`readable.pipe()` 方法和 `'data'` 事件机制比 `'readable'` 事件更容易理解。
However, handling `'readable'` might result in increased throughput.


##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* 返回： {boolean}

`readable.isPaused()` 方法返回可读流的当前操作状态。 该方法主要是在
`readable.pipe()` 方法的底层机制中用到。大多数情况下，没有必要直接使用该方法。

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```


##### readable.pause()
<!-- YAML
added: v0.9.4
-->

* 返回： `this`

`readable.pause()` 方法将会使 flowing 模式的流停止触发 [`'data'`][] 事件， 进而切出 flowing 模式。任何可用的数据都将保存在内部缓存中。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
  readable.pause();
  console.log('There will be no additional data for 1 second.');
  setTimeout(() => {
    console.log('Now data will start flowing again.');
    readable.resume();
  }, 1000);
});
```


##### readable.pipe(destination[, options])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 数据写入目标
* `options` {Object} Pipe 选项
  * `end` {boolean} 在 reader 结束时结束 writer 。默认为 `true`。

`readable.pipe()` 绑定一个 [Writable][] 到 `readable` 上，
将可写流自动切换到 flowing 模式并将所有数据传给绑定的 [Writable][]。数据流将被自动管理。这样，即使是可读流较快，目标可写流也不会超负荷（overwhelmed）。

下面例子将 `readable` 中的所有数据通过管道传递给名为 `file.txt` 的文件：

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// readable 中的所有数据都传给了 'file.txt'
readable.pipe(writable);
```
可以在单个可读流上绑定多个可写流。

`readable.pipe()` 方法返回 *目标流* 的引用，这样就可以对流进行链式地管道操作：

```js
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

默认情况下，当源可读流（the source Readable stream）触发 [`'end'`][] 事件时，目标流也会调用 [`stream.end()`][stream-end] 方法从而结束写入。要禁用这一默认行为， `end`
选项应该指定为 `false`， 这将使目标流保持打开，
如下面例子所示：

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

这里有一点要警惕，如果可读流在处理时发生错误，目标可写流 *不会* 自动关闭。
如果发生错误，需要 *手动* 关闭所有流以避免内存泄漏。

*注意*：不管对 [`process.stderr`][] 和 [`process.stdout`][] 指定什么选项，它们都是直到 Node.js 进程退出才关闭。


##### readable.read([size])
<!-- YAML
added: v0.9.4
-->

* `size` {number} Optional argument to specify how much data to read.
* Return {string|Buffer|null}

The `readable.read()` method pulls some data out of the internal buffer and
returns it. If no data available to be read, `null` is returned. By default,
the data will be returned as a `Buffer` object unless an encoding has been
specified using the `readable.setEncoding()` method or the stream is operating
in object mode.

The optional `size` argument specifies a specific number of bytes to read. If
`size` bytes are not available to be read, `null` will be returned *unless*
the stream has ended, in which case all of the data remaining in the internal
buffer will be returned.

If the `size` argument is not specified, all of the data contained in the
internal buffer will be returned.

The `readable.read()` method should only be called on Readable streams operating
in paused mode. In flowing mode, `readable.read()` is called automatically until
the internal buffer is fully drained.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

In general, it is recommended that developers avoid the use of the `'readable'`
event and the `readable.read()` method in favor of using either
`readable.pipe()` or the `'data'` event.

A Readable stream in object mode will always return a single item from
a call to [`readable.read(size)`][stream-read], regardless of the value of the
`size` argument.

*Note*: If the `readable.read()` method returns a chunk of data, a `'data'`
event will also be emitted.

*Note*: Calling [`stream.read([size])`][stream-read] after the [`'end'`][]
event has been emitted will return `null`. No runtime error will be raised.

##### readable.resume()
<!-- YAML
added: v0.9.4
-->

* Returns: `this`

The `readable.resume()` method causes an explicitly paused Readable stream to
resume emitting [`'data'`][] events, switching the stream into flowing mode.

The `readable.resume()` method can be used to fully consume the data from a
stream without actually processing any of that data as illustrated in the
following example:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

##### readable.setEncoding(encoding)
<!-- YAML
added: v0.9.4
-->

* `encoding` {string} 要使用的编码
* Returns: `this`

`readble.setEncoding()` 方法会为从可读流读入的数据设置字符编码

By default, no encoding is assigned and stream data will be returned as
`Buffer` objects.
设置编码会使得该流数据返回指定编码的字符串而不是`Buffer`对象。例如，调用`readable.setEncoding('utf-8')`会使得输出数据作为UTF-8数据解析，并作为字符串返回。调用`readable.setEncoding('hex')`使得数据被编码成16进制字符串格式。

可读流会妥善处理多字节字符，如果仅仅直接从流中取出`Buffer`对象，很可能会导致错误解码。

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('got %d characters of string data', chunk.length);
});
```


##### readable.unpipe([destination])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 可选的，指定需要分离的目标流

`readable.unpipe()` 方法将之前通过[`stream.pipe()`][]方法绑定的流分离

如果 `destination` 没有传入, 则所有绑定的流都会被分离.

如果传入 `destination`, 但它没有被`pipe()`绑定过，则该方法不作为.

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt');
  readable.unpipe(writable);
  console.log('Manually close the file stream');
  writable.end();
}, 1000);
```


##### readable.unshift(chunk)
<!-- YAML
added: v0.9.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|any} Chunk of data to unshift onto the
  read queue. For streams not operating in object mode, `chunk` must be a
  string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be
  any JavaScript value other than `null`.

The `readable.unshift()` method pushes a chunk of data back into the internal
buffer. This is useful in certain situations where a stream is being consumed by
code that needs to "un-consume" some amount of data that it has optimistically
pulled out of the source, so that the data can be passed on to some other party.

*Note*: The `stream.unshift(chunk)` method cannot be called after the
[`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to
use of a [Transform][] stream instead. See the [API for Stream Implementers][]
section for more information.

```js
// Pull off a header delimited by \n\n
// use unshift() if we get too much
// Call the callback with (error, header, stream)
const { StringDecoder } = require('string_decoder');
function parseHeader(stream, callback) {
  stream.on('error', callback);
  stream.on('readable', onReadable);
  const decoder = new StringDecoder('utf8');
  let header = '';
  function onReadable() {
    let chunk;
    while (null !== (chunk = stream.read())) {
      const str = decoder.write(chunk);
      if (str.match(/\n\n/)) {
        // found the header boundary
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // remove the readable listener before unshifting
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // still reading the header.
        header += str;
      }
    }
  }
}
```

*Note*: Unlike [`stream.push(chunk)`][stream-push], `stream.unshift(chunk)`
will not end the reading process by resetting the internal reading state of the
stream. This can cause unexpected results if `readable.unshift()` is called
during a read (i.e. from within a [`stream._read()`][stream-_read]
implementation on a custom stream). Following the call to `readable.unshift()`
with an immediate [`stream.push('')`][stream-push] will reset the reading state
appropriately, however it is best to simply avoid calling `readable.unshift()`
while in the process of performing a read.

##### readable.wrap(stream)
<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} An "old style" readable stream

Versions of Node.js prior to v0.10 had streams that did not implement the
entire `stream` module API as it is currently defined. (See [Compatibility][]
for more information.)

When using an older Node.js library that emits [`'data'`][] events and has a
[`stream.pause()`][stream-pause] method that is advisory only, the
`readable.wrap()` method can be used to create a [Readable][] stream that uses
the old stream as its data source.

It will rarely be necessary to use `readable.wrap()` but the method has been
provided as a convenience for interacting with older Node.js applications and
libraries.

For example:

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

##### readable.destroy([error])
<!-- YAML
added: v8.0.0
-->

Destroy the stream, and emit `'error'`. After this call, the
readable stream will release any internal resources.
Implementors should not override this method, but instead implement
[`readable._destroy`][readable-_destroy].

### Duplex and Transform Streams

#### Class: stream.Duplex
<!-- YAML
added: v0.9.4
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8834
    description: Instances of `Duplex` now return `true` when
                 checking `instanceof stream.Writable`.
-->

<!--type=class-->

Duplex 流是同时实现了 [Readable][] 和
[Writable][] 接口的流。

Duplex 流的实例包括了：

* [TCP sockets][]
* [zlib streams][zlib]
* [crypto streams][crypto]


#### Class: stream.Transform
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

变换流（Transform streams） 是一种 [Duplex][] 流。它的输出与输入是通过某种方式关联的。和所有 [Duplex][] 流一样，变换流同时实现了 [Readable][] 和 [Writable][] 接口。

变换流的实例包括：

* [zlib streams][zlib]
* [crypto streams][crypto]



##### transform.destroy([error])
<!-- YAML
added: v8.0.0
-->

Destroy the stream, and emit `'error'`. After this call, the
transform stream would release any internal resources.
implementors should not override this method, but instead implement
[`readable._destroy`][readable-_destroy].
The default implementation of `_destroy` for `Transform` also emit `'close'`.

## API for Stream Implementers

<!--type=misc-->

The `stream` module API has been designed to make it possible to easily
implement streams using JavaScript's prototypal inheritance model.

First, a stream developer would declare a new JavaScript class that extends one
of the four basic stream classes (`stream.Writable`, `stream.Readable`,
`stream.Duplex`, or `stream.Transform`), making sure they call the appropriate
parent class constructor:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

The new stream class must then implement one or more specific methods, depending
on the type of stream being created, as detailed in the chart below:

<table>
  <thead>
    <tr>
      <th>
        <p>Use-case</p>
      </th>
      <th>
        <p>Class</p>
      </th>
      <th>
        <p>Method(s) to implement</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>Reading only</p>
    </td>
    <td>
      <p>[Readable](#stream_class_stream_readable)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Writing only</p>
    </td>
    <td>
      <p>[Writable](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p><code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Reading and writing</p>
    </td>
    <td>
      <p>[Duplex](#stream_class_stream_duplex)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Operate on written data, then read the result</p>
    </td>
    <td>
      <p>[Transform](#stream_class_stream_transform)</p>
    </td>
    <td>
      <p><code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
</table>

*Note*: The implementation code for a stream should *never* call the "public"
methods of a stream that are intended for use by consumers (as described in
the [API for Stream Consumers][] section). Doing so may lead to adverse
side effects in application code consuming the stream.

### Simplified Construction
<!-- YAML
added: v1.2.0
-->

For many simple cases, it is possible to construct a stream without relying on
inheritance. This can be accomplished by directly creating instances of the
`stream.Writable`, `stream.Readable`, `stream.Duplex` or `stream.Transform`
objects and passing appropriate methods as constructor options.

For example:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementing a Writable Stream

The `stream.Writable` class is extended to implement a [Writable][] stream.

Custom Writable streams *must* call the `new stream.Writable([options])`
constructor and implement the `writable._write()` method. The
`writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])

* `options` {Object}
  * `highWaterMark` {number} Buffer level when
    [`stream.write()`][stream-write] starts returning `false`. Defaults to
    `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether or not to decode strings into
    Buffers before passing them to [`stream._write()`][stream-_write].
    Defaults to `true`
  * `objectMode` {boolean} Whether or not the
    [`stream.write(anyObj)`][stream-write] is a valid operation. When set,
    it becomes possible to write JavaScript values other than string,
    `Buffer` or `Uint8Array` if supported by the stream implementation.
    Defaults to `false`
  * `write` {Function} Implementation for the
    [`stream._write()`][stream-_write] method.
  * `writev` {Function} Implementation for the
    [`stream._writev()`][stream-_writev] method.
  * `destroy` {Function} Implementation for the
    [`stream._destroy()`][writable-_destroy] method.
  * `final` {Function} Implementation for the
    [`stream._final()`][stream-_final] method.

For example:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

```js
const { Writable } = require('stream');
const util = require('util');

function MyWritable(options) {
  if (!(this instanceof MyWritable))
    return new MyWritable(options);
  Writable.call(this, options);
}
util.inherits(MyWritable, Writable);
```

Or, using the Simplified Constructor approach:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
  writev(chunks, callback) {
    // ...
  }
});
```

#### writable.\_write(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The chunk to be written. Will **always**
  be a buffer unless the `decodeStrings` option was set to `false`
  or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then `encoding` is the
  character encoding of that string. If chunk is a `Buffer`, or if the
  stream is operating in object mode, `encoding` may be ignored.
* `callback` {Function} Call this function (optionally with an error
  argument) when processing is complete for the supplied chunk.

All Writable stream implementations must provide a
[`writable._write()`][stream-_write] method to send data to the underlying
resource.

*Note*: [Transform][] streams provide their own implementation of the
[`writable._write()`][stream-_write].

*Note*: This function MUST NOT be called by application code directly. It
should be implemented by child classes, and called by the internal Writable
class methods only.

The `callback` method must be called to signal either that the write completed
successfully or failed with an error. The first argument passed to the
`callback` must be the `Error` object if the call failed or `null` if the
write succeeded.

It is important to note that all calls to `writable.write()` that occur between
the time `writable._write()` is called and the `callback` is called will cause
the written data to be buffered. Once the `callback` is invoked, the stream will
emit a [`'drain'`][] event. If a stream implementation is capable of processing
multiple chunks of data at once, the `writable._writev()` method should be
implemented.

If the `decodeStrings` property is set in the constructor options, then
`chunk` may be a string rather than a Buffer, and `encoding` will
indicate the character encoding of the string. This is to support
implementations that have an optimized handling for certain string
data encodings. If the `decodeStrings` property is explicitly set to `false`,
the `encoding` argument can be safely ignored, and `chunk` will remain the same
object that is passed to `.write()`.

The `writable._write()` method is prefixed with an underscore because it is
internal to the class that defines it, and should never be called directly by
user programs.

#### writable.\_writev(chunks, callback)

* `chunks` {Array} The chunks to be written. Each chunk has following
  format: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} A callback function (optionally with an error
  argument) to be invoked when processing is complete for the supplied chunks.

*Note*: This function MUST NOT be called by application code directly. It
should be implemented by child classes, and called by the internal Writable
class methods only.

The `writable._writev()` method may be implemented in addition to
`writable._write()` in stream implementations that are capable of processing
multiple chunks of data at once. If implemented, the method will be called with
all chunks of data currently buffered in the write queue.

The `writable._writev()` method is prefixed with an underscore because it is
internal to the class that defines it, and should never be called directly by
user programs.

#### writable.\_destroy(err, callback)
<!-- YAML
added: v8.0.0
-->

* `err` {Error} An error.
* `callback` {Function} A callback function that takes an optional error argument
  which is invoked when the writable is destroyed.

#### writable.\_final(callback)
<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Call this function (optionally with an error
  argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented
by child classes, and if so, will be called by the internal Writable
class methods only.

This optional function will be called before the stream closes, delaying the
`finish` event until `callback` is called. This is useful to close resources
or write buffered data before a stream ends.

#### Errors While Writing

It is recommended that errors occurring during the processing of the
`writable._write()` and `writable._writev()` methods are reported by invoking
the callback and passing the error as the first argument. This will cause an
`'error'` event to be emitted by the Writable. Throwing an Error from within
`writable._write()` can result in unexpected and inconsistent behavior depending
on how the stream is being used.  Using the callback ensures consistent and
predictable handling of errors.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
});
```

#### An Example Writable Stream

The following illustrates a rather simplistic (and somewhat pointless) custom
Writable stream implementation. While this specific Writable stream instance
is not of any real particular usefulness, the example illustrates each of the
required elements of a custom [Writable][] stream instance:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }

  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
}
```

### Implementing a Readable Stream

The `stream.Readable` class is extended to implement a [Readable][] stream.

Custom Readable streams *must* call the `new stream.Readable([options])`
constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `options` {Object}
  * `highWaterMark` {number} The maximum number of bytes to store in
    the internal buffer before ceasing to read from the underlying
    resource. Defaults to `16384` (16kb), or `16` for `objectMode` streams
  * `encoding` {string} If specified, then buffers will be decoded to
    strings using the specified encoding. Defaults to `null`
  * `objectMode` {boolean} Whether this stream should behave
    as a stream of objects. Meaning that [`stream.read(n)`][stream-read] returns
    a single value instead of a Buffer of size n. Defaults to `false`
  * `read` {Function} Implementation for the [`stream._read()`][stream-_read]
    method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`][readable-_destroy]
    method.

For example:

```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

```js
const { Readable } = require('stream');
const util = require('util');

function MyReadable(options) {
  if (!(this instanceof MyReadable))
    return new MyReadable(options);
  Readable.call(this, options);
}
util.inherits(MyReadable, Readable);
```

Or, using the Simplified Constructor approach:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)

* `size` {number} Number of bytes to read asynchronously

*Note*: This function MUST NOT be called by application code directly. It
should be implemented by child classes, and called by the internal Readable
class methods only.

All Readable stream implementations must provide an implementation of the
`readable._read()` method to fetch data from the underlying resource.

When `readable._read()` is called, if data is available from the resource, the
implementation should begin pushing that data into the read queue using the
[`this.push(dataChunk)`][stream-push] method. `_read()` should continue reading
from the resource and pushing data until `readable.push()` returns `false`. Only
when `_read()` is called again after it has stopped should it resume pushing
additional data onto the queue.

*Note*: Once the `readable._read()` method has been called, it will not be
called again until the [`readable.push()`][stream-push] method is called.

The `size` argument is advisory. For implementations where a "read" is a
single operation that returns data can use the `size` argument to determine how
much data to fetch. Other implementations may ignore this argument and simply
provide data whenever it becomes available. There is no need to "wait" until
`size` bytes are available before calling [`stream.push(chunk)`][stream-push].

The `readable._read()` method is prefixed with an underscore because it is
internal to the class that defines it, and should never be called directly by
user programs.

#### readable.push(chunk[, encoding])
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the
  read queue. For streams not operating in object mode, `chunk` must be a
  string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be
  any JavaScript value.
* `encoding` {string} Encoding of string chunks.  Must be a valid
  Buffer encoding, such as `'utf8'` or `'ascii'`
* Returns {boolean} `true` if additional chunks of data may continued to be
  pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will
be added to the internal queue for users of the stream to consume.
Passing `chunk` as `null` signals the end of the stream (EOF), after which no
more data can be written.

When the Readable is operating in paused mode, the data added with
`readable.push()` can be read out by calling the
[`readable.read()`][stream-read] method when the [`'readable'`][] event is
emitted.

When the Readable is operating in flowing mode, the data added with
`readable.push()` will be delivered by emitting a `'data'` event.

The `readable.push()` method is designed to be as flexible as possible. For
example, when wrapping a lower-level source that provides some form of
pause/resume mechanism, and a data callback, the low-level source can be wrapped
by the custom Readable instance as illustrated in the following example:

```js
// source is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // if push() returns false, then stop reading from source
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```
*Note*: The `readable.push()` method is intended be called only by Readable
Implementers, and only from within the `readable._read()` method.

#### Errors While Reading

It is recommended that errors occurring during the processing of the
`readable._read()` method are emitted using the `'error'` event rather than
being thrown. Throwing an Error from within `readable._read()` can result in
unexpected and inconsistent behavior depending on whether the stream is
operating in flowing or paused mode. Using the `'error'` event ensures
consistent and predictable handling of errors.

<!-- eslint-disable no-useless-return -->
```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // do some work
  }
});
```

#### An Example Counting Stream

<!--type=example-->

The following is a basic example of a Readable stream that emits the numerals
from 1 to 1,000,000 in ascending order, and then ends.

```js
const { Readable } = require('stream');

class Counter extends Readable {
  constructor(opt) {
    super(opt);
    this._max = 1000000;
    this._index = 1;
  }

  _read() {
    const i = this._index++;
    if (i > this._max)
      this.push(null);
    else {
      const str = '' + i;
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### Implementing a Duplex Stream

A [Duplex][] stream is one that implements both [Readable][] and [Writable][],
such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the
`stream.Duplex` class is extended to implement a [Duplex][] stream (as opposed
to extending the `stream.Readable` *and* `stream.Writable` classes).

*Note*: The `stream.Duplex` class prototypically inherits from
`stream.Readable` and parasitically from `stream.Writable`, but `instanceof`
will work properly for both base classes due to overriding
[`Symbol.hasInstance`][] on `stream.Writable`.

Custom Duplex streams *must* call the `new stream.Duplex([options])`
constructor and implement *both* the `readable._read()` and
`writable._write()` methods.

#### new stream.Duplex(options)
<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `options` {Object} Passed to both Writable and Readable
  constructors. Also has the following fields:
  * `allowHalfOpen` {boolean} Defaults to `true`. If set to `false`, then
    the stream will automatically end the writable side when the
    readable side ends.
  * `readableObjectMode` {boolean} Defaults to `false`. Sets `objectMode`
    for readable side of the stream. Has no effect if `objectMode`
    is `true`.
  * `writableObjectMode` {boolean} Defaults to `false`. Sets `objectMode`
    for writable side of the stream. Has no effect if `objectMode`
    is `true`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side
    of the stream. Has no effect if `highWaterMark` is provided.
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side
    of the stream. Has no effect if `highWaterMark` is provided.

For example:

```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

```js
const { Duplex } = require('stream');
const util = require('util');

function MyDuplex(options) {
  if (!(this instanceof MyDuplex))
    return new MyDuplex(options);
  Duplex.call(this, options);
}
util.inherits(MyDuplex, Duplex);
```

Or, using the Simplified Constructor approach:

```js
const { Duplex } = require('stream');

const myDuplex = new Duplex({
  read(size) {
    // ...
  },
  write(chunk, encoding, callback) {
    // ...
  }
});
```

#### An Example Duplex Stream

The following illustrates a simple example of a Duplex stream that wraps a
hypothetical lower-level source object to which data can be written, and
from which data can be read, albeit using an API that is not compatible with
Node.js streams.
The following illustrates a simple example of a Duplex stream that buffers
incoming written data via the [Writable][] interface that is read back out
via the [Readable][] interface.

```js
const { Duplex } = require('stream');
const kSource = Symbol('source');

class MyDuplex extends Duplex {
  constructor(source, options) {
    super(options);
    this[kSource] = source;
  }

  _write(chunk, encoding, callback) {
    // The underlying source only deals with strings
    if (Buffer.isBuffer(chunk))
      chunk = chunk.toString();
    this[kSource].writeSomeData(chunk);
    callback();
  }

  _read(size) {
    this[kSource].fetchSomeData(size, (data, encoding) => {
      this.push(Buffer.from(data, encoding));
    });
  }
}
```

The most important aspect of a Duplex stream is that the Readable and Writable
sides operate independently of one another despite co-existing within a single
object instance.

#### Object Mode Duplex Streams

For Duplex streams, `objectMode` can be set exclusively for either the Readable
or Writable side using the `readableObjectMode` and `writableObjectMode` options
respectively.

In the following example, for instance, a new Transform stream (which is a
type of [Duplex][] stream) is created that has an object mode Writable side
that accepts JavaScript numbers that are converted to hexadecimal strings on
the Readable side.

```js
const { Transform } = require('stream');

// All Transform streams are also Duplex Streams
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary
    chunk |= 0;

    // Transform the chunk into something else.
    const data = chunk.toString(16);

    // Push the data onto the readable queue.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Prints: 01
myTransform.write(10);
// Prints: 0a
myTransform.write(100);
// Prints: 64
```

### Implementing a Transform Stream

A [Transform][] stream is a [Duplex][] stream where the output is computed
in some way from the input. Examples include [zlib][] streams or [crypto][]
streams that compress, encrypt, or decrypt data.

*Note*: There is no requirement that the output be the same size as the input,
the same number of chunks, or arrive at the same time. For example, a
Hash stream will only ever have a single chunk of output which is
provided when the input is ended. A `zlib` stream will produce output
that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [Transform][] stream.

The `stream.Transform` class prototypically inherits from `stream.Duplex` and
implements its own versions of the `writable._write()` and `readable._read()`
methods. Custom Transform implementations *must* implement the
[`transform._transform()`][stream-_transform] method and *may* also implement
the [`transform._flush()`][stream-_flush] method.

*Note*: Care must be taken when using Transform streams in that data written
to the stream can cause the Writable side of the stream to become paused if
the output on the Readable side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both Writable and Readable
  constructors. Also has the following fields:
  * `transform` {Function} Implementation for the
    [`stream._transform()`][stream-_transform] method.
  * `flush` {Function} Implementation for the [`stream._flush()`][stream-_flush]
    method.

For example:

```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

```js
const { Transform } = require('stream');
const util = require('util');

function MyTransform(options) {
  if (!(this instanceof MyTransform))
    return new MyTransform(options);
  Transform.call(this, options);
}
util.inherits(MyTransform, Transform);
```

Or, using the Simplified Constructor approach:

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### Events: 'finish' and 'end'

The [`'finish'`][] and [`'end'`][] events are from the `stream.Writable`
and `stream.Readable` classes, respectively. The `'finish'` event is emitted
after [`stream.end()`][stream-end] is called and all chunks have been processed
by [`stream._transform()`][stream-_transform]. The `'end'` event is emitted
after all data has been output, which occurs after the callback in
[`transform._flush()`][stream-_flush] has been called.

#### transform.\_flush(callback)

* `callback` {Function} A callback function (optionally with an error
  argument and data) to be called when remaining data has been flushed.

*Note*: This function MUST NOT be called by application code directly. It
should be implemented by child classes, and called by the internal Readable
class methods only.

In some cases, a transform operation may need to emit an additional bit of
data at the end of the stream. For example, a `zlib` compression stream will
store an amount of internal state used to optimally compress the output. When
the stream ends, however, that additional data needs to be flushed so that the
compressed data will be complete.

Custom [Transform][] implementations *may* implement the `transform._flush()`
method. This will be called when there is no more written data to be consumed,
but before the [`'end'`][] event is emitted signaling the end of the
[Readable][] stream.

Within the `transform._flush()` implementation, the `readable.push()` method
may be called zero or more times, as appropriate. The `callback` function must
be called when the flush operation is complete.

The `transform._flush()` method is prefixed with an underscore because it is
internal to the class that defines it, and should never be called directly by
user programs.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The chunk to be transformed. Will **always**
  be a buffer unless the `decodeStrings` option was set to `false`
  or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then this is the
  encoding type. If chunk is a buffer, then this is the special
  value - 'buffer', ignore it in this case.
* `callback` {Function} A callback function (optionally with an error
  argument and data) to be called after the supplied `chunk` has been
  processed.

*Note*: This function MUST NOT be called by application code directly. It
should be implemented by child classes, and called by the internal Readable
class methods only.

All Transform stream implementations must provide a `_transform()`
method to accept input and produce output. The `transform._transform()`
implementation handles the bytes being written, computes an output, then passes
that output off to the readable portion using the `readable.push()` method.

The `transform.push()` method may be called zero or more times to generate
output from a single input chunk, depending on how much is to be output
as a result of the chunk.

It is possible that no output is generated from any given chunk of input data.

The `callback` function must be called only when the current chunk is completely
consumed. The first argument passed to the `callback` must be an `Error` object
if an error occurred while processing the input or `null` otherwise. If a second
argument is passed to the `callback`, it will be forwarded on to the
`readable.push()` method. In other words the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

The `transform._transform()` method is prefixed with an underscore because it
is internal to the class that defines it, and should never be called directly by
user programs.

`transform._transform()` is never called in  parallel; streams implement a
queue mechanism, and to receive the next chunk, `callback` must be
called, either synchronously or asynchronously.

#### Class: stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [Transform][]
stream that simply passes the input bytes across to the output. Its purpose is
primarily for examples and testing, but there are some use cases where
`stream.PassThrough` is useful as a building block for novel sorts of streams.

## Additional Notes

<!--type=misc-->

### Compatibility with Older Node.js Versions

<!--type=misc-->

In versions of Node.js prior to v0.10, the Readable stream interface was
simpler, but also less powerful and less useful.

* Rather than waiting for calls the [`stream.read()`][stream-read] method,
  [`'data'`][] events would begin emitting immediately. Applications that
  would need to perform some amount of work to decide how to handle data
  were required to store read data into buffers so the data would not be lost.
* The [`stream.pause()`][stream-pause] method was advisory, rather than
  guaranteed. This meant that it was still necessary to be prepared to receive
  [`'data'`][] events *even when the stream was in a paused state*.

In Node.js v0.10, the [Readable][] class was added. For backwards compatibility
with older Node.js programs, Readable streams switch into "flowing mode" when a
[`'data'`][] event handler is added, or when the
[`stream.resume()`][stream-resume] method is called. The effect is that, even
when not using the new [`stream.read()`][stream-read] method and
[`'readable'`][] event, it is no longer necessary to worry about losing
[`'data'`][] chunks.

While most applications will continue to function normally, this introduces an
edge case in the following conditions:

* No [`'data'`][] event listener is added.
* The [`stream.resume()`][stream-resume] method is never called.
* The stream is not piped to any writable destination.

For example, consider the following code:

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' method, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

In versions of Node.js prior to v0.10, the incoming message data would be
simply discarded. However, in Node.js v0.10 and beyond, the socket remains
paused forever.

The workaround in this situation is to call the
[`stream.resume()`][stream-resume] method to begin the flow of data:

```js
// Workaround
net.createServer((socket) => {

  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // start the flow of data, discarding it.
  socket.resume();

}).listen(1337);
```

In addition to new Readable streams switching into flowing mode,
pre-v0.10 style streams can be wrapped in a Readable class using the
[`readable.wrap()`][`stream.wrap()`] method.


### `readable.read(0)`

There are some cases where it is necessary to trigger a refresh of the
underlying readable stream mechanisms, without actually consuming any
data. In such cases, it is possible to call `readable.read(0)`, which will
always return `null`.

If the internal read buffer is below the `highWaterMark`, and the
stream is not currently reading, then calling `stream.read(0)` will trigger
a low-level [`stream._read()`][stream-_read] call.

While most applications will almost never need to do this, there are
situations within Node.js where this is done, particularly in the
Readable stream class internals.

### `readable.push('')`

Use of `readable.push('')` is not recommended.

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in
object mode has an interesting side effect. Because it *is* a call to
[`readable.push()`][stream-push], the call will end the reading process.
However, because the argument is an empty string, no data is added to the
readable buffer so there is nothing for a user to consume.

[`'data'`]: #stream_event_data
[`'drain'`]: #stream_event_drain
[`'end'`]: #stream_event_end
[`'finish'`]: #stream_event_finish
[`'readable'`]: #stream_event_readable
[`EventEmitter`]: events.html#events_class_eventemitter
[`Symbol.hasInstance`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
[`fs.createReadStream()`]: fs.html#fs_fs_createreadstream_path_options
[`fs.createWriteStream()`]: fs.html#fs_fs_createwritestream_path_options
[`net.Socket`]: net.html#net_class_net_socket
[`process.stderr`]: process.html#process_process_stderr
[`process.stdin`]: process.html#process_process_stdin
[`process.stdout`]: process.html#process_process_stdout
[`stream.cork()`]: #stream_writable_cork
[`stream.pipe()`]: #stream_readable_pipe_destination_options
[`stream.uncork()`]: #stream_writable_uncork
[`stream.unpipe()`]: #stream_readable_unpipe_destination
[`stream.wrap()`]: #stream_readable_wrap_stream
[`writable.cork()`]: #stream_writable_cork
[`writable.uncork()`]: #stream_writable_uncork
[`zlib.createDeflate()`]: zlib.html#zlib_zlib_createdeflate_options
[API for Stream Consumers]: #stream_api_for_stream_consumers
[API for Stream Implementers]: #stream_api_for_stream_implementers
[Compatibility]: #stream_compatibility_with_older_node_js_versions
[Duplex]: #stream_class_stream_duplex
[HTTP requests, on the client]: http.html#http_class_http_clientrequest
[HTTP responses, on the server]: http.html#http_class_http_serverresponse
[Readable]: #stream_class_stream_readable
[TCP sockets]: net.html#net_class_net_socket
[Transform]: #stream_class_stream_transform
[Writable]: #stream_class_stream_writable
[child process stdin]: child_process.html#child_process_child_stdin
[child process stdout and stderr]: child_process.html#child_process_child_stdout
[crypto]: crypto.html
[fs read streams]: fs.html#fs_class_fs_readstream
[fs write streams]: fs.html#fs_class_fs_writestream
[http-incoming-message]: http.html#http_class_http_incomingmessage
[zlib]: zlib.html
[stream-_flush]: #stream_transform_flush_callback
[stream-_read]: #stream_readable_read_size_1
[stream-_transform]: #stream_transform_transform_chunk_encoding_callback
[stream-_write]: #stream_writable_write_chunk_encoding_callback_1
[stream-_writev]: #stream_writable_writev_chunks_callback
[stream-_final]: #stream_writable_final_callback
[stream-end]: #stream_writable_end_chunk_encoding_callback
[stream-pause]: #stream_readable_pause
[stream-push]: #stream_readable_push_chunk_encoding
[stream-read]: #stream_readable_read_size
[stream-resume]: #stream_readable_resume
[stream-write]: #stream_writable_write_chunk_encoding_callback
[readable-_destroy]: #stream_readable_destroy_err_callback
[writable-_destroy]: #stream_writable_destroy_err_callback