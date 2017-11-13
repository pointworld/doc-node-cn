# Errors

<!--type=misc-->

Node.js 中运行的应用程序一般会遇到以下四类错误：

- 标准的 JavaScript 错误：
  - {EvalError} : 当调用 `eval()` 失败时抛出。
  - {SyntaxError} : 当 JavaScript 语法错误时抛出。
  - {RangeError} : 当值不在预期范围内时抛出。
  - {ReferenceError} : 当使用未定义的变量时抛出。
  - {TypeError} : 当传入错误类型的参数时抛出。
  - {URIError} : 当全局的 URI 处理函数被误用时抛出。
- 由底层操作系触发的系统错误，例如试图打开一个不存在的文件、试图通过一个已关闭的 socket 发送数据等。
- 由应用程序代码触发的用户自定义的错误。
- 断言错误是错误的一个特殊类别，每当 Node.js 检测到一个不应该发生的异常逻辑时触发。
  这类错误通常由 `assert` 模块引起。

所有由 Node.js 引起的 JavaScript 错误与系统错误都继承自或实例化自标准的 JavaScript {Error} 类，且保证至少提供类中的属性。

## Error Propagation and Interception

<!--type=misc-->

Node.js 支持几种当应用程序运行时发生的错误的冒泡和处理的机制。
如何报告和处理这些错误完全取决于错误的类型和被调用的 API 的风格。

所有 JavaScript 错误都会被作为异常处理，异常会立即产生并使用标准的 JavaScript `throw` 机制抛出一个错误。
这些都是使用 JavaScript 语言提供的 [`try / catch` 语句]处理的。


```js
// 抛出一个 ReferenceError，因为 z 为 undefined
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // 在这里处理错误。
}
```

JavaScript 的 `throw` 机制的任何使用都会引起异常，异常必须使用 `try / catch` 处理，否则 Node.js 进程会立即退出。

除了少数例外，同步的 API（任何不接受 `callback` 函数的阻塞方法，例如 [`fs.readFileSync`]）会使用 `throw` 报告错误。

异步的 API 中发生的错误可能会以多种方式进行报告：

- 大多数的异步方法都接受一个 `callback` 函数，该函数会接受一个 `Error` 对象传入作为第一个参数。
  如果第一个参数不是 `null` 而是一个 `Error` 实例，则说明发生了错误，应该进行处理。

<!-- eslint-disable no-useless-return -->
  ```js
  const fs = require('fs');
  fs.readFile('一个不存在的文件', (err, data) => {
    if (err) {
      console.error('读取文件出错！', err);
      return;
    }
    // 否则处理数据
  });
  ```
- 当一个异步方法被一个 `EventEmitter` 对象调用时，错误会被分发到对象的 `'error'` 事件上。

  ```js
  const net = require('net');
  const connection = net.connect('localhost');

  // 添加一个 'error' 事件句柄到一个流：
  connection.on('error', (err) => {
    // 如果连接被服务器重置，或无法连接，或发生任何错误，则错误会被发送到这里。 
    console.error(err);
  });

  connection.pipe(process.stdout);
  ```

- Node.js API 中有一小部分普通的异步方法仍可能使用 `throw` 机制抛出异常，且必须使用 `try / catch` 处理。
  这些方法并没有一个完整的列表；请参阅各个方法的文档以确定所需的合适的错误处理机制。

`'error'` 事件机制的使用常见于[基于流]和[基于事件触发器]的 API，它们本身就代表了一系列的异步操作（相对于要么成功要么失败的单一操作）。

对于所有的 `EventEmitter` 对象，如果没有提供一个 `'error'` 事件句柄，则错误会被抛出，并造成 Node.js 进程报告一个未处理的异常且随即崩溃，除非：
适当地使用 [`domain`] 模块或已经注册了一个 [`process.on('uncaughtException')`] 事件的句柄。

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // 这会使进程崩溃，因为还为添加 'error' 事件句柄。
  ee.emit('error', new Error('这会崩溃'));
});
```

这种方式产生的错误无法使用 `try / catch` 截获，因为它们是在调用的代码已经退出后抛出的。

开发者必须查阅各个方法的文档以明确在错误发生时这些方法是如何冒泡的。


### Node.js style callbacks

<!--type=misc-->

大多数由 Node.js 核心 API 暴露出来的异步方法都遵循一个被称为“Node.js 风格的回调”的惯用模式。
使用这种模式，一个回调函数是作为一个参数传给方法的。
当操作完成或发生错误时，回调函数会被调用，并带上错误对象（如果有）作为第一个参数。
如果没有发生错误，则第一个参数为 `null`。


```js
const fs = require('fs');

function nodeStyleCallback(err, data) {
  if (err) {
    console.error('There was an error', err);
    return;
  }
  console.log(data);
}

fs.readFile('/some/file/that/does-not-exist', nodeStyleCallback);
fs.readFile('/some/file/that/does-exist', nodeStyleCallback);
```

JavaScript 的 `try / catch` 机制无法用于捕获由异步 API 引起的错误。
尝试使用 `throw` 而不是一个 Node.js 风格的回调，是初学者常犯的错误：


```js
// 这无法使用：
const fs = require('fs');

try {
  fs.readFile('/some/file/that/does-not-exist', (err, data) => {
    // 假设的错误：在这里抛出
    if (err) {
      throw err;
    }
  });
} catch (err) {
  // 这不会捕获到抛出！
  console.error(err);
}
```

这无法使用，因为传给 `fs.readFile()` 的回调函数是被异步地调用。
当回调被调用时，周围的代码（包括 `try { } catch (err) { }` 区域）已经退出。
大多数情况下，在回调内抛出一个错误会使 Node.js 进程崩溃。
如果[域]已启用，或已在 `process.on('uncaughtException')` 注册了一个句柄，则这些错误可被捕获。


## Class: Error

<!--type=class-->

一个通用的 JavaScript `Error` 对象，它不表示错误发生的具体情况。
`Error` 对象会捕捉一个“堆栈跟踪”，详细说明被实例化的 `Error` 对象在代码中的位置，并可能提供错误的文字描述。

所有由 Node.js 产生的错误，包括所有系统的和 JavaScript 的错误都实例化自或继承自 `Error` 类。


### new Error(message)

* `message` {string}

新建一个 `Error` 实例，并设置 `error.message` 属性以提供文本信息。
如果 `message` 传的是一个对象，则会调用 `message.toString()` 生成文本信息。
`error.stack` 属性表示被调用的 `new Error()` 在代码中的位置。
堆栈跟踪是基于 [V8 的堆栈跟踪 API] 的。
堆栈跟踪只会取（a）异步代码执行的开头或（b）`Error.stackTraceLimit` 属性给出的栈帧中的最小项。


### Error.captureStackTrace(targetObject[, constructorOpt])

* `targetObject` {Object}
* `constructorOpt` {Function}

在 `targetObject` 上创建一个 `.stack` 属性，当访问时返回一个表示代码中调用 `Error.captureStackTrace()` 的位置的字符串。

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // 类似 `new Error().stack`
```

The first line of the trace will be prefixed with `${myObject.name}: ${myObject.message}`.

可选的 `constructorOpt` 参数接受一个函数。
如果提供了，则 `constructorOpt` 之上包括自身在内的全部栈帧都会被生成的堆栈跟踪省略。

`constructorOpt` 参数用在向最终用户隐藏错误生成的具体细节时非常有用。例如：


```js
function MyError() {
  Error.captureStackTrace(this, MyError);
}

// 没传入 MyError 到 captureStackTrace，MyError 帧会显示在 .stack 属性。
// 通过传入构造函数，可以省略该帧，且保留其下面的所有帧。
new MyError().stack;
```


### Error.stackTraceLimit

* {number}

`Error.stackTraceLimit` 属性指定了堆栈跟踪收集的栈帧数量（无论是 `new Error().stack` 或 `Error.captureStackTrace(obj)` 产生的）。

默认值为 `10` ，但可设为任何有效的 JavaScript 数值。
值改变后的变化会影响所有捕获到的堆栈跟踪。

如果设为一个非数值或负数，则堆栈跟踪不会捕捉任何栈帧。


#### error.code

* {string}

`error.code` 属性是标识错误类别的字符标签。详见 [Node.js Error Codes][] 关于特定的错误码

#### error.message

* {string}

`error.message` 属性是错误的字符串描述，通过调用 `new Error(message)` 设置。
传给构造函数的 `message` 也会出现在 `Error` 的堆栈跟踪的第一行。
但是，`Error` 对象创建后改变这个属性可能不会改变堆栈跟踪的第一行（比如当 `error.stack` 在该属性被改变之前被读取）。

```js
const err = new Error('错误信息');
console.error(err.message);
// 打印: 错误信息
```


### error.stack

* {string}

`error.stack` 属性是一个字符串，描述代码中 `Error` 被实例化的位置。

例子：

```txt
Error: Things keep happening!
   at /home/gbusey/file.js:525:2
   at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
   at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
   at increaseSynergy (/home/gbusey/actors.js:701:6)
```

第一行会被格式化为 `<error class name>: <error message>`，且带上一系列栈帧（每一行都以 "at " 开头）。
每一帧描述了一个代码中导致错误生成的调用点。
V8 引擎会试图显示每个函数的名称（变量名、函数名、或对象的方法名），但偶尔也可能找不到一个合适的名称。
如果 V8 引擎没法确定一个函数的名称，则只显示帧的位置信息。
否则，在位置信息的旁边会显示明确的函数名。

注意，帧只由 JavaScript 函数产生。
例如，同步地执行一个名为 `cheetahify` 的 C++ 插件，且插件自身调用一个 JavaScript 函数，代表 `cheetahify` 回调的栈帧不会出现在堆栈跟踪里：


```js
const cheetahify = require('./native-binding.node');

function makeFaster() {
  // cheetahify 同步地调用 speedy.
  cheetahify(function speedy() {
    throw new Error('oh no!');
  });
}

makeFaster();
// will throw:
//   /home/gbusey/file.js:6
//       throw new Error('oh no!');
//           ^
//   Error: oh no!
//       at speedy (/home/gbusey/file.js:6:11)
//       at makeFaster (/home/gbusey/file.js:5:3)
//       at Object.<anonymous> (/home/gbusey/file.js:10:1)
//       at Module._compile (module.js:456:26)
//       at Object.Module._extensions..js (module.js:474:10)
//       at Module.load (module.js:356:32)
//       at Function.Module._load (module.js:312:12)
//       at Function.Module.runMain (module.js:497:10)
//       at startup (node.js:119:16)
//       at node.js:906:3
```

位置信息会是其中之一：

* `native`，帧表示一个 V8 引擎内部的调用（比如，`[].forEach`）。
* `plain-filename.js:line:column`，帧表示一个 Node.js 内部的调用。
* `/absolute/path/to/file.js:line:column`，帧表示一个用户程序或其依赖的调用。

代表堆栈跟踪的字符串是在 `error.stack` 属性被访问时才生成的。

堆栈跟踪捕获的帧的数量是由 `Error.stackTraceLimit` 或当前事件循环中可用的帧数量的最小值界定的。

系统级的错误是由扩展的 `Error` 实例产生的，详见[系统错误]。


## Class: AssertionError

A subclass of `Error` that indicates the failure of an assertion. Such errors
commonly indicate inequality of actual and expected value.

For example:

```js
assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: 1 === 2
```

## Class: RangeError

`Error` 的一个子类，表明一个函数的一个给定的参数的值不在可接受的集合或范围内；
无论是一个数字范围还是给定函数参数的选项的集合。

例子：

```js
require('net').connect(-1);
// 抛出 "RangeError: "port" option should be >= 0 and < 65536: -1"
```

Node.js 会生成并以参数校验的形式立即抛出 `RangeError` 实例。


## Class: ReferenceError

`Error` 的一个子类，表明试图访问一个未定义的变量。
这些错误通常表明代码有拼写错误或程序已损坏。

虽然客户端代码可能产生和传播这些错误，但在实践中，只有 V8 引擎会这么做。

```js
doesNotExist;
// 抛出 ReferenceError，在这个程序中 doesNotExist 不是一个变量。
```

除非应用程序是动态生成并运行的代码，否则 `ReferenceError` 实例应该始终被视为代码中或其依赖中的错误。


## Class: SyntaxError

`Error` 的一个子类，表明程序不是有效的 JavaScript 代码。
这些错误是代码执行的结果产生和传播的。
代码执行可能产生自 `eval`、`Function`、`require` 或 [vm]。
这些错误几乎都表明程序已损坏。


```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // err 是一个 SyntaxError
}
```

`SyntaxError` 实例在创建它们的上下文中是不可恢复的。
它们只可被其他上下文捕获。


## Class: TypeError

`Error` 的一个子类，表明提供的参数不是一个被允许的类型。
例如，将一个函数传给一个期望字符串的参数会被视为一个 `TypeError`。

```js
require('url').parse(() => { });
// 抛出 TypeError，因为它期望的是一个字符串
```

Node.js 会生成并以参数校验的形式立即抛出 `TypeError` 实例。


## Exceptions vs. Errors

<!--type=misc-->

JavaScript 异常是一个作为一个无效操作的结果或作为一个 `throw` 声明的目标所抛出的值。
虽然它不要求这些值是 `Error` 的实例或继承自 `Error` 的类的实例，但所有通过 Node.js 或 JavaScript 运行时抛出的异常都是 `Error` 实例。

有些异常在 JavaScript 层是无法恢复的。
这些异常总会引起 Node.js 进程的崩溃。
例如 `assert()` 检测或在 C++ 层调用的 `abort()`。


## System Errors

系统错误是当程序运行环境中发生异常时产生的。
特别是，当应用程序违反了操作系统的限制时发生的操作错误，例如试图读取一个不存在的文件或用户没有足够的权限。

系统错误通常产生于系统调用层级。
在大多数 Unix 系统上，可通过运行 `man 2 intro`、`man 3 errno`、或[在线文档]获取错误代码的详细清单和含义。

系统错误是由扩展的 `Error` 对象加上附加属性表现的。


### Class: System Error

#### error.code

* {string}

The `error.code` property is a string representing the error code, which is
typically `E` followed by a sequence of capital letters.

#### error.errno

* {string|number}

`error.errno` 属性是一个数值或字符串。
如果返回一个数值，则数值是一个负数，对应 [`libuv 错误处理`] 中定义的错误码。
详见 uv-errno.h 头文件（Node.js 源代码中的 `deps/uv/include/uv-errno.h`）。
如果返回一个字符串，则同 `error.code`。


#### error.syscall

* {string}

`error.syscall` 属性是一个字符串，描述失败的 [系统调用]。


#### error.path

* {string}

When present (e.g. in `fs` or `child_process`), the `error.path` property is a
string containing a relevant invalid pathname.

#### error.address

* {string}

When present (e.g. in `net` or `dgram`), the `error.address` property is a
string describing the address to which the connection failed.

#### error.port

* {number}

When present (e.g. in `net` or `dgram`), the `error.port` property is a number
representing the connection's port that is not available.

### Common System Errors

以下列表是不完整的，但列举了编写 Node.js 程序时会遇到的一些常见的系统错误。
详细的列表可从 [ERRNO 文档]找到。

- `EACCES` (拒绝访问): 试图以被一个文件的访问权限禁止的方式访问一个文件。

- `EADDRINUSE` (地址已被使用):  试图绑定一个服务器（[`net`]、[`http`] 或 [`https`]）到本地地址，但因另一个本地系统的服务器已占用了该地址而导致失败。

- `ECONNREFUSED` (连接被拒绝): 无法连接，因为目标机器积极拒绝。
  这通常是因为试图连接到外部主机上的废弃的服务。

- `ECONNRESET` (连接被重置): 一个连接被强行关闭。
  这通常是因为连接到远程 socket 超时或重启。
  常发生于 [`http`] 和 [`net`] 模块。

- `EEXIST` (文件已存在): 一个操作的目标文件已存在，而要求目标不存在。

- `EISDIR` (是一个目录): 一个操作要求一个文件，但给定的路径是一个目录。

- `EMFILE` (系统打开了太多文件): 已达到系统[文件描述符]允许的最大数量，且描述符的请求不能被满足直到至少关闭其中一个。
  当一次并行打开多个文件时会发生这个错误，尤其是在进程的文件描述限制数量较低的操作系统（如 macOS）。
  要解决这个限制，可在运行 Node.js 进程的同一 shell 中运行 `ulimit -n 2048`。

- `ENOENT` (无此文件或目录): 通常是由 [`fs`] 操作引起的，表明指定的路径不存在，即给定的路径找不到文件或目录。

- `ENOTDIR` (不是一个目录): 给定的路径虽然存在，但不是一个目录。
  通常是由 [`fs.readdir`] 引起的。

- `ENOTEMPTY` (目录非空): 一个操作的目标是一个非空的目录，而要求的是一个空目录。
  通常是由 [`fs.unlink`] 引起的。

- `EPERM` (操作不被允许): 试图执行一个需要更高权限的操作。

- `EPIPE` (管道损坏): 写入一个管道、socket 或 FIFO 时没有进程读取数据。
  常见于 [`net`] 和 [`http`] 层，表明远端要写入的流已被关闭。

- `ETIMEDOUT` (操作超时): 一个连接或发送的请求失败，因为连接方在一段时间后没有做出合适的响应。
  常见于 [`http`] 或 [`net`]。
  往往标志着 `socket.end()` 没有被正确地调用。

<a id="nodejs-error-codes"></a>


## Node.js Error Codes

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

Used generically to identify that an iterable argument (i.e. a value that works
with `for...of` loops) is required, but not provided to a Node.js API.

<a id="ERR_ASSERTION"></a>
### ERR_ASSERTION

Used as special type of error that can be triggered whenever Node.js detects an
exceptional logic violation that should never occur. These are raised typically
by the `assert` module.

<a id="ERR_BUFFER_OUT_OF_BOUNDS"></a>
### ERR_BUFFER_OUT_OF_BOUNDS

Used when attempting to perform an operation outside the bounds of a `Buffer`.

<a id="ERR_CHILD_CLOSED_BEFORE_REPLY"></a>
### ERR_CHILD_CLOSED_BEFORE_REPLY

Used when a child process is closed before the parent received a reply.

<a id="ERR_CONSOLE_WRITABLE_STREAM"></a>
### ERR_CONSOLE_WRITABLE_STREAM

Used when `Console` is instantiated without `stdout` stream or when `stdout` or
`stderr` streams are not writable.

<a id="ERR_CPU_USAGE"></a>
### ERR_CPU_USAGE

Used when the native call from `process.cpuUsage` cannot be processed properly.

<a id="ERR_DNS_SET_SERVERS_FAILED"></a>
### ERR_DNS_SET_SERVERS_FAILED

Used when `c-ares` failed to set the DNS server.

<a id="ERR_FALSY_VALUE_REJECTION"></a>
### ERR_FALSY_VALUE_REJECTION

Used by the `util.callbackify()` API when a callbackified `Promise` is rejected
with a falsy value (e.g. `null`).

<a id="ERR_HTTP_HEADERS_SENT"></a>
### ERR_HTTP_HEADERS_SENT

Used when headers have already been sent and another attempt is made to add
more headers.

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>
### ERR_HTTP_INVALID_STATUS_CODE

Used for status codes outside the regular status code ranges (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>
### ERR_HTTP_TRAILER_INVALID

Used when the `Trailer` header is set even though the transfer encoding does not
support that.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>
### ERR_HTTP2_CONNECT_AUTHORITY

For HTTP/2 requests using the `CONNECT` method, the `:authority` pseudo-header
is required.

<a id="ERR_HTTP2_CONNECT_PATH"></a>
### ERR_HTTP2_CONNECT_PATH

For HTTP/2 requests using the `CONNECT` method, the `:path` pseudo-header is
forbidden.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>
### ERR_HTTP2_CONNECT_SCHEME

The HTTP/2 requests using the `CONNECT` method, the `:scheme` pseudo-header is
forbidden.

<a id="ERR_HTTP2_ERROR"></a>
### ERR_HTTP2_ERROR

A non-specific HTTP/2 error has occurred.

<a id="ERR_HTTP2_FRAME_ERROR"></a>
### ERR_HTTP2_FRAME_ERROR

Used when a failure occurs sending an individual frame on the HTTP/2
session.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>
### ERR_HTTP2_HEADERS_OBJECT

Used when an HTTP/2 Headers Object is expected.

<a id="ERR_HTTP2_HEADERS_SENT"></a>
### ERR_HTTP2_HEADERS_SENT

Used when an attempt is made to send multiple response headers.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>
### ERR_HTTP2_HEADER_SINGLE_VALUE

Used when multiple values have been provided for an HTTP header field that
required to have only a single value.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>
### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND

HTTP/2 Informational headers must only be sent *prior* to calling the
`Http2Stream.prototype.respond()` method.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>
### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

Informational HTTP status codes (`1xx`) may not be set as the response status
code on HTTP/2 responses.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>
### ERR_HTTP2_INVALID_CONNECTION_HEADERS

HTTP/1 connection specific headers are forbidden to be used in HTTP/2
requests and responses.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>
### ERR_HTTP2_INVALID_HEADER_VALUE

Used to indicate that an invalid HTTP/2 header value has been specified.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>
### ERR_HTTP2_INVALID_INFO_STATUS

An invalid HTTP informational status code has been specified. Informational
status codes must be an integer between `100` and `199` (inclusive).

<a id="ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH"></a>

Input `Buffer` and `Uint8Array` instances passed to the
`http2.getUnpackedSettings()` API must have a length that is a multiple of
six.

<a id="ERR_HTTP2_INVALID_PSEUDOHEADER"></a>
### ERR_HTTP2_INVALID_PSEUDOHEADER

Only valid HTTP/2 pseudoheaders (`:status`, `:path`, `:authority`, `:scheme`,
and `:method`) may be used.

<a id="ERR_HTTP2_INVALID_SESSION"></a>
### ERR_HTTP2_INVALID_SESSION

Used when any action is performed on an `Http2Session` object that has already
been destroyed.

<a id="ERR_HTTP2_INVALID_SETTING_VALUE"></a>
### ERR_HTTP2_INVALID_SETTING_VALUE

An invalid value has been specified for an HTTP/2 setting.

<a id="ERR_HTTP2_INVALID_STREAM"></a>
### ERR_HTTP2_INVALID_STREAM

Used when an operation has been performed on a stream that has already been
destroyed.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>
### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Whenever an HTTP/2 `SETTINGS` frame is sent to a connected peer, the peer is
required to send an acknowledgement that it has received and applied the new
SETTINGS. By default, a maximum number of un-acknowledged `SETTINGS` frame may
be sent at any given time. This error code is used when that limit has been
reached.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>
### ERR_HTTP2_OUT_OF_STREAMS

Used when the maximum number of streams on a single HTTP/2 session have been
created.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>
### ERR_HTTP2_PAYLOAD_FORBIDDEN

Used when a message payload is specified for an HTTP response code for which
a payload is forbidden.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>
### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

Used to indicate that an HTTP/2 pseudo-header has been used inappropriately.
Pseudo-headers are header key names that begin with the `:` prefix.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>
### ERR_HTTP2_PUSH_DISABLED

Used when push streams have been disabled by the client but an attempt to
create a push stream is made.

<a id="ERR_HTTP2_SEND_FILE"></a>
### ERR_HTTP2_SEND_FILE

Used when an attempt is made to use the
`Http2Stream.prototype.responseWithFile()` API to send a non-regular file.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>
### ERR_HTTP2_SOCKET_BOUND

Used when an attempt is made to connect a `Http2Session` object to a
`net.Socket` or `tls.TLSSocket` that has already been bound to another
`Http2Session` object.

<a id="ERR_HTTP2_STATUS_101"></a>
### ERR_HTTP2_STATUS_101

Use of the `101` Informational status code is forbidden in HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>
### ERR_HTTP2_STATUS_INVALID

An invalid HTTP status code has been specified. Status codes must be an integer
between `100` and `599` (inclusive).

<a id="ERR_HTTP2_STREAM_CLOSED"></a>
### ERR_HTTP2_STREAM_CLOSED

Used when an action has been performed on an HTTP/2 Stream that has already
been closed.

<a id="ERR_HTTP2_STREAM_ERROR"></a>
### ERR_HTTP2_STREAM_ERROR

Used when a non-zero error code has been specified in an `RST_STREAM` frame.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>
### ERR_HTTP2_STREAM_SELF_DEPENDENCY

When setting the priority for an HTTP/2 stream, the stream may be marked as
a dependency for a parent stream. This error code is used when an attempt is
made to mark a stream and dependent of itself.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>
### ERR_HTTP2_UNSUPPORTED_PROTOCOL

Used when `http2.connect()` is passed a URL that uses any protocol other than
`http:` or `https:`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>
### ERR_INDEX_OUT_OF_RANGE

Used when a given index is out of the accepted range (e.g. negative offsets).

<a id="ERR_INVALID_ARG_TYPE"></a>
### ERR_INVALID_ARG_TYPE

Used generically to identify that an argument of the wrong type has been passed
to a Node.js API.

<a id="ERR_INVALID_ARRAY_LENGTH"></a>
### ERR_INVALID_ARRAY_LENGTH

Used when an Array is not of the expected length or in a valid range.

<a id="ERR_INVALID_BUFFER_SIZE"></a>
### ERR_INVALID_BUFFER_SIZE

Used when performing a swap on a `Buffer` but it's size is not compatible with the operation.

<a id="ERR_INVALID_CALLBACK"></a>
### ERR_INVALID_CALLBACK

Used generically to identify that a callback function is required and has not
been provided to a Node.js API.

<a id="ERR_INVALID_CHAR"></a>
### ERR_INVALID_CHAR

Used when invalid characters are detected in headers.

<a id="ERR_INVALID_CURSOR_POS"></a>
### ERR_INVALID_CURSOR_POS

The `'ERR_INVALID_CURSOR_POS'` is thrown specifically when a cursor on a given
stream is attempted to move to a specified row without a specified column.

<a id="ERR_INVALID_DOMAIN_NAME"></a>
### ERR_INVALID_DOMAIN_NAME

Used when `hostname` can not be parsed from a provided URL.

<a id="ERR_INVALID_FD"></a>
### ERR_INVALID_FD

Used when a file descriptor ('fd') is not valid (e.g. it has a negative value).

<a id="ERR_INVALID_FILE_URL_HOST"></a>
### ERR_INVALID_FILE_URL_HOST

Used when a Node.js API that consumes `file:` URLs (such as certain functions in
the [`fs`][] module) encounters a file URL with an incompatible host. Currently,
this situation can only occur on Unix-like systems, where only `localhost` or an
empty host is supported.

<a id="ERR_INVALID_FILE_URL_PATH"></a>
### ERR_INVALID_FILE_URL_PATH

Used when a Node.js API that consumes `file:` URLs (such as certain
functions in the [`fs`][] module) encounters a file URL with an incompatible
path. The exact semantics for determining whether a path can be used is
platform-dependent.

<a id="ERR_INVALID_HANDLE_TYPE"></a>
### ERR_INVALID_HANDLE_TYPE

Used when an attempt is made to send an unsupported "handle" over an IPC
communication channel to a child process. See [`subprocess.send()`] and
[`process.send()`] for more information.

<a id="ERR_INVALID_HTTP_TOKEN"></a>
### ERR_INVALID_HTTP_TOKEN

Used when `options.method` received an invalid HTTP token.

<a id="ERR_INVALID_IP_ADDRESS"></a>
### ERR_INVALID_IP_ADDRESS

Used when an IP address is not valid.

<a id="ERR_INVALID_OPT_VALUE"></a>
### ERR_INVALID_OPT_VALUE

Used generically to identify when an invalid or unexpected value has been
passed in an options object.

<a id="ERR_INVALID_OPT_VALUE_ENCODING"></a>
### ERR_INVALID_OPT_VALUE_ENCODING

Used when an invalid or unknown file encoding is passed.

<a id="ERR_INVALID_PROTOCOL"></a>
### ERR_INVALID_PROTOCOL

Used when an invalid `options.protocol` is passed.

<a id="ERR_INVALID_REPL_EVAL_CONFIG"></a>
### ERR_INVALID_REPL_EVAL_CONFIG

Used when both `breakEvalOnSigint` and `eval` options are set
in the REPL config, which is not supported.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>
### ERR_INVALID_SYNC_FORK_INPUT

Used when a `Buffer`, `Uint8Array` or `string` is provided as stdio input to a
synchronous fork. See the documentation for the
[`child_process`](child_process.html) module for more information.

<a id="ERR_INVALID_THIS"></a>
### ERR_INVALID_THIS

Used generically to identify that a Node.js API function is called with an
incompatible `this` value.

Example:

```js
const { URLSearchParams } = require('url');
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TUPLE"></a>
### ERR_INVALID_TUPLE

Used when an element in the `iterable` provided to the [WHATWG][WHATWG URL
API] [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] does not
represent a `[name, value]` tuple – that is, if an element is not iterable, or
does not consist of exactly two elements.

<a id="ERR_INVALID_URL"></a>
### ERR_INVALID_URL

Used when an invalid URL is passed to the [WHATWG][WHATWG URL API]
[`URL` constructor][`new URL(input)`] to be parsed. The thrown error object
typically has an additional property `'input'` that contains the URL that failed
to parse.

<a id="ERR_INVALID_URL_SCHEME"></a>
### ERR_INVALID_URL_SCHEME

Used generically to signify an attempt to use a URL of an incompatible scheme
(aka protocol) for a specific purpose. It is currently only used in the
[WHATWG URL API][] support in the [`fs`][] module (which only accepts URLs with
`'file'` scheme), but may be used in other Node.js APIs as well in the future.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>
### ERR_IPC_CHANNEL_CLOSED

Used when an attempt is made to use an IPC communication channel that has
already been closed.

<a id="ERR_IPC_DISCONNECTED"></a>
### ERR_IPC_DISCONNECTED

Used when an attempt is made to disconnect an already disconnected IPC
communication channel between two Node.js processes. See the documentation for
the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>
### ERR_IPC_ONE_PIPE

Used when an attempt is made to create a child Node.js process using more than
one IPC communication channel. See the documentation for the
[`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>
### ERR_IPC_SYNC_FORK

Used when an attempt is made to open an IPC communication channel with a
synchronous forked Node.js process. See the documentation for the
[`child_process`](child_process.html) module for more information.

<a id="ERR_METHOD_NOT_IMPLEMENTED"></a>
### ERR_METHOD_NOT_IMPLEMENTED

Used when a method is required but not implemented.

<a id="ERR_MISSING_ARGS"></a>
### ERR_MISSING_ARGS

Used when a required argument of a Node.js API is not passed. This is only used
for strict compliance with the API specification (which in some cases may accept
`func(undefined)` but not `func()`). In most native Node.js APIs,
`func(undefined)` and `func()` are treated identically, and the
[`ERR_INVALID_ARG_TYPE`][] error code may be used instead.

<a id="ERR_MULTIPLE_CALLBACK"></a>
### ERR_MULTIPLE_CALLBACK

Used when a callback is called more then once.

*Note*: A callback is almost always meant to only be called once as the query
can either be fulfilled or rejected but not both at the same time. The latter
would be possible by calling a callback more then once.

<a id="ERR_NO_CRYPTO"></a>
### ERR_NO_CRYPTO

Used when an attempt is made to use crypto features while Node.js is not
compiled with OpenSSL crypto support.

<a id="ERR_NO_ICU"></a>
### ERR_NO_ICU

Used when an attempt is made to use features that require [ICU][], while
Node.js is not compiled with ICU support.

<a id="ERR_NO_LONGER_SUPPORTED"></a>
### ERR_NO_LONGER_SUPPORTED

Used when a Node.js API is called in an unsupported manner.

For example: `Buffer.write(string, encoding, offset[, length])`

<a id="ERR_PARSE_HISTORY_DATA"></a>
### ERR_PARSE_HISTORY_DATA

<a id="ERR_SOCKET_ALREADY_BOUND"></a>
### ERR_SOCKET_ALREADY_BOUND

Used when an attempt is made to bind a socket that has already been bound.

<a id="ERR_SOCKET_BAD_PORT"></a>
### ERR_SOCKET_BAD_PORT

Used when an API function expecting a port > 0 and < 65536 receives an invalid
value.

<a id="ERR_SOCKET_BAD_TYPE"></a>
### ERR_SOCKET_BAD_TYPE

Used when an API function expecting a socket type (`udp4` or `udp6`) receives an
invalid value.

<a id="ERR_SOCKET_CANNOT_SEND"></a>
### ERR_SOCKET_CANNOT_SEND

Used when data cannot be sent on a socket.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>
### ERR_SOCKET_DGRAM_NOT_RUNNING

Used when a call is made and the UDP subsystem is not running.

<a id="ERR_STDERR_CLOSE"></a>
### ERR_STDERR_CLOSE

Used when an attempt is made to close the `process.stderr` stream. By design,
Node.js does not allow `stdout` or `stderr` Streams to be closed by user code.

<a id="ERR_STDOUT_CLOSE"></a>
### ERR_STDOUT_CLOSE

Used when an attempt is made to close the `process.stdout` stream. By design,
Node.js does not allow `stdout` or `stderr` Streams to be closed by user code.

<a id="ERR_STREAM_WRAP"></a>
### ERR_STREAM_WRAP

Used to prevent an abort if a string decoder was set on the Socket or if in
`objectMode`.

Example
```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf-8');
```

<a id="ERR_UNKNOWN_BUILTIN_MODULE"></a>
### ERR_UNKNOWN_BUILTIN_MODULE

Used to identify a specific kind of internal Node.js error that should not
typically be triggered by user code. Instances of this error point to an
internal bug within the Node.js binary itself.

<a id="ERR_UNESCAPED_CHARACTERS"></a>
### ERR_UNESCAPED_CHARACTERS

Used when a string that contains unescaped characters was received.

<a id="ERR_UNKNOWN_ENCODING"></a>
### ERR_UNKNOWN_ENCODING

Used when an invalid or unknown encoding option is passed to an API.

<a id="ERR_UNKNOWN_SIGNAL"></a>
### ERR_UNKNOWN_SIGNAL

Used when an invalid or unknown process signal is passed to an API expecting a
valid signal (such as [`subprocess.kill()`][]).

<a id="ERR_UNKNOWN_STDIN_TYPE"></a>
### ERR_UNKNOWN_STDIN_TYPE

Used when an attempt is made to launch a Node.js process with an unknown `stdin`
file type. Errors of this kind cannot *typically* be caused by errors in user
code, although it is not impossible. Occurrences of this error are most likely
an indication of a bug within Node.js itself.

<a id="ERR_UNKNOWN_STREAM_TYPE"></a>
### ERR_UNKNOWN_STREAM_TYPE

Used when an attempt is made to launch a Node.js process with an unknown
`stdout` or `stderr` file type. Errors of this kind cannot *typically* be caused
by errors in user code, although it is not impossible. Occurrences of this error
are most likely an indication of a bug within Node.js itself.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>
### ERR_VALUE_OUT_OF_RANGE

Used when a number value is out of range.

<a id="ERR_V8BREAKITERATOR"></a>
### ERR_V8BREAKITERATOR

Used when the V8 BreakIterator API is used but the full ICU data set is not
installed.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>
### ERR_VALUE_OUT_OF_RANGE

Used when a given value is out of the accepted range.
[`ERR_INVALID_ARG_TYPE`]: #ERR_INVALID_ARG_TYPE
[`subprocess.kill()`]: child_process.html#child_process_subprocess_kill_signal
[`subprocess.send()`]: child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
[`fs.readFileSync`]: fs.html#fs_fs_readfilesync_path_options
[`fs.readdir`]: fs.html#fs_fs_readdir_path_options_callback
[`fs.unlink`]: fs.html#fs_fs_unlink_path_callback
[`fs`]: fs.html
[`http`]: http.html
[`https`]: https.html
[`libuv Error handling`]: http://docs.libuv.org/en/v1.x/errors.html
[`net`]: net.html
[`new URL(input)`]: url.html#url_constructor_new_url_input_base
[`new URLSearchParams(iterable)`]: url.html#url_constructor_new_urlsearchparams_iterable
[`process.on('uncaughtException')`]: process.html#process_event_uncaughtexception
[`process.send()`]: process.html#process_process_send_message_sendhandle_options_callback
[ICU]: intl.html#intl_internationalization_support
[Node.js Error Codes]: #nodejs-error-codes
[V8's stack trace API]: https://github.com/v8/v8/wiki/Stack-Trace-API
[WHATWG URL API]: url.html#url_the_whatwg_url_api
[domains]: domain.html
[event emitter-based]: events.html#events_class_eventemitter
[file descriptors]: https://en.wikipedia.org/wiki/File_descriptor
[online]: http://man7.org/linux/man-pages/man3/errno.3.html
[stream-based]: stream.html
[syscall]: http://man7.org/linux/man-pages/man2/syscall.2.html
[try-catch]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
[vm]: vm.html

[`libuv 错误处理`]: http://docs.libuv.org/en/v1.x/errors.html
[V8 的堆栈跟踪 API]: https://github.com/v8/v8/wiki/Stack-Trace-API
[域]: domain.html
[`domain`]: domain.html
[基于事件触发器]: events.html#events_class_eventemitter
[文件描述符]: https://en.wikipedia.org/wiki/File_descriptor
[在线文档]: http://man7.org/linux/man-pages/man3/errno.3.html
[ERRNO 文档]: http://man7.org/linux/man-pages/man3/errno.3.html
[基于流]: stream.html
[系统调用]: http://man7.org/linux/man-pages/man2/syscall.2.html
[`try / catch` 语句]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
[系统错误]: #errors_system_errors
