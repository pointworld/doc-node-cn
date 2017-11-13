# Process

<!-- type=global -->

`process` 对象是一个 `global` （全局变量），提供有关信息，控制当前 Node.js 进程。作为一个对象，它对于 Node.js 应用程序始终是可用的，故无需使用 `require()`。

## Process Events

 `process` 对象是[`EventEmitter`][]的实例.


### Event: 'beforeExit'
<!-- YAML
added: v0.11.12
-->

当Node.js的事件循环数组已经为空，并且没有额外的工作被添加进来，事件`'beforeExit'`会被触发。
正常情况下，如果没有额外的工作被添加到事件循环数组，Node.js进程会结束。但是如果`'beforeExit'`事件绑定的监听器的回调函数中，含有一个可以进行异步调用的操作，那么Node.js进程会继续运行。

[`process.exitCode`][] 作为唯一的参数值传递给`'beforeExit'`事件监听器的回调函数。

如果进程由于显式的原因而将要终止，例如直接调用[`process.exit()`][]或抛出未捕获的异常，`'beforeExit'`事件不会被触发。

除非本意就是需要添加额外的工作(比如通过监听器进行异步调用)到事件循环数组，否则不应该用`'beforeExit'`事件替代`'exit'`事件。

### Event: 'disconnect'
<!-- YAML
added: v0.7.7
-->

如果Node.js进程是由IPC channel的方式创建的(see the [Child Process][]
and [Cluster][] documentation)，当IPC channel关闭时，会触发`'disconnect'`事件。

### Event: 'exit'
<!-- YAML
added: v0.1.7
-->

两种情况下`'exit'`事件会被触发：
* 显式调用`process.exit()`方法，使得Node.js进程即将结束；
* Node.js事件循环数组中不再有额外的工作，使得Node.js进程即将结束。

在上述两种情况下，没有任何方法可以阻止事件循环的结束,一旦所有与`'exit'`事件绑定的监听器执行完成，Node.js的进程会终止。

`'exit'`事件监听器的回调函数，只有一个入参，这个参数的值可以是[`process.exitCode`][]的属性值，或者是调用[`process.exit()`]方法时传入的`exitCode`值。

例如:

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

`'exit'`事件监听器的回调函数，**只允许**包含**同步**操作。所有监听器的回调函数被调用后，任何在事件循环数组中排队的工作都会被强制丢弃，然后Nodje.js进程会立即结束。
例如在下例中，timeout操作永远不会被执行(因为不是同步操作)。

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Event: 'message'
<!-- YAML
added: v0.5.10
-->

如果Node.js进程是由IPC channel的方式创建的(see the [Child Process][]，
and [Cluster][] documentation)，当子进程收到父进程的的消息时(消息通过[`childprocess.send()`][]发送），
会触发`'message'`事件。

`'message'`事件监听器的回调函数中被传递的参数如下：
* `message`{Object} 解析的JSON对象，或primitive值
* `sendHandle` {Handle object} 一个[`net.Socket`][] 或 [`net.Server`][]对象，或undefined。



### Event: 'rejectionHandled'
<!-- YAML
added: v1.4.1
-->

如果有Promise被rejected，并且此Promise在Nodje.js事件循环的下次轮询及之后期间，被绑定了一个错误处理器[`例如使用promise.catch()`][])，
会触发`'rejectionHandled'`事件。

此事件监听器的回调函数使用Rejected的`Promise`引用，作为唯一入参。

`Promise`对象应该已经在`'unhandledRejection'`事件触发时被处理，但是在被处理过程中获得了一个rejection处理器。

对于`Promise` chain，没有概念表明在 Promise chain的哪个地方，所有的rejections总是会被处理。
由于本来就是异步的，一个`Promise` rejection可以在将来的某个时间点被处理-可能要远远晚于`'unhandledRejection'`事件被触发及处理的时间。

另一种表述的方式就是，与使用同步代码时会出现不断增长的未处理异常列表不同，使用Promises时，未处理异常列表可能会出现增长然后收缩的情况。

在同步代码情况下，当未处理异常列表增长时，会触发`'uncaughtException'`事件。

在异步代码情况下，当未处理异常列表增长时，会触发`'uncaughtException'`事件，当未处理列表收缩时，会触发`'rejectionHandled'`事件。

例如:

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, p) => {
  unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p) => {
  unhandledRejections.delete(p);
});
```

在上述例子中，`unhandledRejections` `Map`会随着时间增加和缩减，表明rejections开始是未被处理状态，然后变成已处理状态。
可以定时(对于需长期运行的应用，这个可能是最好的方式)或当进程结束时(对脚本的应用可能是最方便的)，在错误日志中记录这些错误信息。


### Event: 'uncaughtException'
<!-- YAML
added: v0.1.18
-->

如果Javascript未捕获的异常，沿着代码调用路径反向传递回event loop，会触发`'uncaughtException'`事件。
Node.js默认情况下会将这些异常堆栈打印到`stderr` 然后进程退出。
为`'uncaughtException'`事件增加监听器会覆盖上述默认行为。

`'uncaughtException'`事件监听器的回调函数，使用`Error` object作为唯一参数值。

例如:

```js
process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}\n`);
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// 故意调用一个不存在的函数，应用会抛出未捕获的异常
nonexistentFunc();
console.log('This will not run.');
```


#### Warning: Using `'uncaughtException'` correctly

需要注意，如果打算使用`'uncaughtException'`事件作为异常处理的最后补救机制，这是非常粗糙的设计方式。
此事件*不应该*当作`出了错误就恢复让它继续`的等价机制。
未处理异常本身就意味着应用已经处于了未定义的状态。如果基于这种状态，尝试恢复应用正常进行，可能会造成未知或不可预测的问题。

此事件的监听器回调函数中抛出的异常，不会被捕获。为了避免出现无限循环的情况，进程会以非零的状态码结束，并打印堆栈信息。

如果在出现未捕获异常时，尝试去恢复应用，可能出现的结果与电脑升级时拔掉电源线出现的结果类似 -- 10次中有9次不会出现问题，但是第10次可能系统会出现错误。

正确使用`'uncaughtException'`事件的方式，是用它在进程结束前执行一些已分配资源(比如文件描述符，句柄等等)的同步清理操作。
**触发`'uncaughtException'`事件后，用它来尝试恢复应用正常运行的操作是不安全的**

想让一个已经崩溃的应用正常运行，更可靠的方式应该是启动另外一个进程来监测/探测应用是否出错，
无论`uncaughtException`事件是否被触发，如果监测到应用出错，则恢复或重启应用。


### Event: 'unhandledRejection'
<!-- YAML
added: v1.4.1
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling Promise rejections has been deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled Promise rejections have been will now emit
                 a process warning.
-->

如果在事件循环的一次轮询中，一个`Promise`被rejected，并且此`Promise`没有绑定错误处理器，`'unhandledRejection`事件会被触发。
当使用Promises进行编程时，异常会以"rejected promises"的形式封装。Rejections可以被[`promise.catch()`][]捕获并处理，并且在`Promise` chain
中传播。`'unhandledRejection`事件在探测和跟踪promises被rejected，并且rejections未被处理的场景中是很有用的。

此事件监听器的回调函数被传递如下参数:

* `reason` {Error|any} 此对象包含了promise被rejected的相关信息
  (典型情况下，是一个 [`Error`][] 对象).
* `p` 被rejected的promise对象

例如:

```js
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // note the typo (`pasre`)
}); // no `.catch` or `.then`
```

如下代码也会触发`'unhandledRejection'`事件

```js
function SomeResource() {
  // Initially set the loaded status to a rejected promise
  this.loaded = Promise.reject(new Error('Resource not yet loaded!'));
}

const resource = new SomeResource();
// no .catch or .then on resource.loaded for at least a turn
```

在例子中，可以像在其他`'unhandledRejection'`事件的典型场景中一样，跟踪开发者错误导致的rejection。
为了解决这样的错误，`resource.loaded`中可以加一个不做任何操作的[`.catch(() => { })`][`promise.catch()`]处理器，
这样可以阻止`'unhandledRejection'`事件的触发。或者也可以使用[`'rejectionHandled'`][]事件来解决。


### Event: 'warning'
<!-- YAML
added: v6.0.0
-->

任何时候Node.js发出进程告警，都会触发`'warning'`事件。

进程告警与进程错误的相似之处，在于两者都描述了需要引起用户注意的异常条件。
区别在于，告警不是Node.js和Javascript错误处理流程的正式组成部分。
一旦探测到可能导致应用性能问题，缺陷或安全隐患相关的代码实践，Node.js就可发出告警。

`'warning'`事件监听器的回调函数，参数只有一个，其值为`Error` 对象。此对象有三个重要的属性用来描述告警：
* `name` {string} 告警的名称(目前默认值是 `Warning`)。
* `message` {string} 系统提供的对此告警的描述。
* `stack` {string} 当告警触发时，包含代码位置的堆栈信息。

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Print the warning name
  console.warn(warning.message); // Print the warning message
  console.warn(warning.stack);   // Print the stack trace
});
```

默认Node.js会打印进程告警到`stderr`。使用`--no-warnings`的命令行选项可以阻止默认从console输出信息，
但是`'warning'`事件仍然会被`process`对象发出。

下面的例子展示了当一个事件绑定了太多的监听器时，输出到`stderr`的告警。

```txt
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 2 foo listeners added. Use emitter.setMaxListeners() to increase limit
```

与上述相反，如下例子关闭了默认的告警输出，并且给`'warning'`事件添加了一个定制的处理器。

```txt
$ node --no-warnings
> const p = process.on('warning', (warning) => console.warn('Do not do that!'));
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> Do not do that!
```

`--trace-warnings`命令行选项可以让默认的console输出告警信息时，包含告警的全部堆栈信息。

使用`--throw-deprecation`命令行选项标志启动Node.js，会使得custom deprecation warning作为异常信息抛出来。

使用`--trace-deprecation`命令行选项标志，会使得custom deprecation warning打印到`stderr`，包括其堆栈信息。

使用`--trace-deprecation`命令行选项标志，会阻止报告所有的custom deprecation warning。

`*-deprecation` 命令行选项标志，只会影响使用名字为`DeprecationWarning`的告警。

### Signal Events

<!--type=event-->
<!--name=SIGINT, SIGHUP, etc.-->

当Node.js进程接收到一个信号时，会触发信号事件。 signal(7)列出了标准POSIX的信号名称列表，例如`SIGINT`, `SIGHUP`等等。

每个事件名称，以信号名称的大写表示 (比如事件`'SIGINT'` 对应信号 `SIGINT`).

例如:

```js
// Begin reading from stdin so the process does not exit.
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Received SIGINT.  Press Control-D to exit.');
});
```

*Note*：在大多数终端程序中发送`SIGINT`信号的简单方法是`<Ctrl>-C`。

如下需要重点关注:

* `SIGUSR1` 被Node.js保留用于启动调试器。可以为此事件绑定一个监听器，但是即使这样做也不会阻止调试器的启动。

* `SIGTERM` 和 `SIGINT` 在非windows平台绑定了默认的监听器，这样进程以代码`128 + signal number`结束之前，可以重置终端模式。
  如果这两个事件任意一个绑定了新的监听器，原有默认的行为会被移除(Node.js不会结束)。

* `SIGPIPE` 默认会被忽略。可以给其绑定监听器。

* `SIGHUP` 在Windows平台中当console窗口被关闭时会触发它，在非windows平台中多种相似的条件下也会触发，查看signal(7)。
  可以给其绑定监听器，但是Windows下Node.js会在它触发后10秒钟无条件关闭。
  非windows平台，`SIGHUP`默认的绑定行为是结束Node.js，但是一旦给它绑定了新的监听器，默认行为会被移除。

* `SIGTERM` 在Windows中不支持，可以给其绑定监听器。
* `SIGINT` 在终端运行时，可以被所有平台支持，通常可以通过`CTRL+C`触发(虽然这个不能配置)。
  当终端运行在raw模式，它不会被触发。

* `SIGBREAK` 在Windows中按下`<Ctrl>+<Break>`会被触发，非Windows平台中可以为其绑定监听器，但是没有方式触发或发送此事件。

* `SIGWINCH` 当console被resize时会触发。Windows中只有当光标移动并写入到console，或者以raw模式使用一个可读tty时，才会触发。

* `SIGKILL` 不能绑定监听器，所有平台中出现此事件，都会使得Node.js无条件终止。

* `SIGSTOP` 不能绑定监听器。

* `SIGBUS`, `SIGFPE`, `SIGSEGV` and `SIGILL`, 如果不是通过kill(2)产生，默认会使进程停留在某个状态，在此状态下尝试调用JS监听器是不安全的。
   如果尝试调用JS监听器可能会导致进程在无限循环中挂死，因为使用`process.on()`附加的监听器是以异步的方式被调用，因此不能纠正隐含的问题。

*Note*: Windows不支持发送信号，但是Node.js通过[`process.kill()`][], 和 [`ChildProcess.kill()`][]提供了某些模拟机制。
发送信号`0` 可以测试进程是否存在。发送`SIGINT`, `SIGTERM`, and `SIGKILL` 使得目标进程无条件终止。


## process.abort()
<!-- YAML
added: v0.7.0
-->

`process.abort()`方法会使Node.js进程立即结束，并生成一个core文件。


## process.arch
<!-- YAML
added: v0.5.0
-->

* {string}

`process.arch`属性返回一个标识Node.js在其上运行的处理器架构的字符串。例如
`'arm'`, `'ia32'`, or `'x64'`.

```js
console.log(`This processor architecture is ${process.arch}`);
```


## process.argv
<!-- YAML
added: v0.1.27
-->

* {Array}

`process.argv` 属性返回一个数组，这个数组包含了启动Node.js进程时的命令行参数。第一个元素为[`process.execPath`]。如果需要获取`argv[0]`的值请参见  `process.argv0`。第二个元素为当前执行的JavaScript文件路径。剩余的元素为其他命令行参数。

例如，`process-args.js`文件有以下代码:

```js
// print process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

运行以下命令，启动进程：

```console
$ node process-args.js one two=three four
```

将输出：

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: one
3: two=three
4: four
```


## process.argv0
<!-- YAML
added: 6.4.0
-->

* {string}

`process.argv0`属性，保存Node.js启动时传入的`argv[0]`参数值的一份只读副本。


```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```


## process.channel
<!-- YAML
added: v7.1.0
-->

如果Node.js进程是由IPC channel(see the [Child Process][] documentation) 方式创建的，`process.channel`属性保存IPC channel的引用。
如果IPC channel不存在，此属性值为`undefined。

## process.chdir(directory)
<!-- YAML
added: v0.1.17
-->

* `directory` {string}

`process.chdir()`方法变更Node.js进程的当前工作目录，如果变更目录失败会抛出异常(例如，如果指定的目录不存在)。

```js
console.log(`Starting directory: ${process.cwd()}`);
try {
  process.chdir('/tmp');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```


## process.config
<!-- YAML
added: v0.7.7
-->

* {Object}

`process.config` 属性返回一个Javascript对象。此对象描述了用于编译当前Node.js执行程序时涉及的配置项信息。
这与执行`./configure`脚本生成的`config.gypi`文件结果是一样的。

可能的输出样例:

<!-- eslint-skip -->
```js
{
  target_defaults:
   { cflags: [],
     default_configuration: 'Release',
     defines: [],
     include_dirs: [],
     libraries: [] },
  variables:
   {
     host_arch: 'x64',
     node_install_npm: 'true',
     node_prefix: '',
     node_shared_cares: 'false',
     node_shared_http_parser: 'false',
     node_shared_libuv: 'false',
     node_shared_zlib: 'false',
     node_use_dtrace: 'false',
     node_use_openssl: 'true',
     node_shared_openssl: 'false',
     strict_aliasing: 'true',
     target_arch: 'x64',
     v8_use_snapshot: 'true'
   }
}
```

*注意*： `process.config`属性值**不是**只读的，在Node.js生态系统中已经有模块扩展，修改或完全替换了`process.config`的值。



## process.connected
<!-- YAML
added: v0.7.2
-->

* {boolean}

如果Node.js进程是由IPC channel方式创建的(see the [Child Process][] and [Cluster][] documentation)，
只要IPC channel保持连接，`process.connected`属性就会返回`true`。
`process.disconnect()`被调用后，此属性会返回`false`。

`process.connected`如果为`false`，则不能通过IPC channel使用`process.send()`发送信息。



## process.cpuUsage([previousValue])
<!-- YAML
added: v6.1.0
-->

* `previousValue` {Object} 上一次调用此方法的返回值
  `process.cpuUsage()`
* Returns: {Object}
    * `user` {integer}
    * `system` {integer}

`process.cpuUsage()`方法返回包含当前进程的用户CPU时间和系统CPU时间的对象。此对象包含`user`和`system`属性，属性值的单位都是微秒(百万分之一秒)。
`user`和`system`属性值分别计算了执行用户程序和系统程序的时间，如果此进程在执行任务时是基于多核CPU，值可能比实际花费的时间要大。

上一次调用`process.cpuUsage()`方法的结果，可以作为参数值传递给此方法，得到的结果是与上一次的差值。

```js
const startUsage = process.cpuUsage();
// { user: 38579, system: 6986 }

// spin the CPU for 500 milliseconds
const now = Date.now();
while (Date.now() - now < 500);

console.log(process.cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```


## process.cwd()
<!-- YAML
added: v0.1.8
-->

* 返回: {string}
 
`process cwd()` 方法返回 Node.js 进程当前工作的目录。

```js
console.log('Current directory: ${process.cwd()}');
```

## process.disconnect()
<!-- YAML
added: v0.1.8
-->

* 返回: {string}
 
`process cwd()` 方法返回 Node.js 进程当前工作的目录。

```js
console.log('Current directory: ${process.cwd()}');
```

## process.emitWarning(warning[, options])
<!-- YAML
added: 8.0.0
-->

* `warning` {string|Error} 发出的警告。
* `options` {Object}
  * `type` {string} 如果 `warning` 是String, `type` 是警告类型的名字。 默认值: `Warning`。
  * `code` {string} 当前警告的唯一标识符。
  * `ctor` {Function} 如果`warning`是String，`ctor`是可选的function，用于限制生成的堆栈信息。默认`process.emitWarning`
  * `detail` {string} error的附加信息。

`process.emitWarning()`方法可用于发出定制的或应用特定的进程警告。
可以通过给[`process.on('warning')`][process_warning]事件增加处理器，监听这些警告。

```js
// Emit a warning with a code and additional detail.
process.emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information'
});
// Emits:
// (node:56338) [MY_WARNING] Warning: Something happened!
// This is some additional information
```

在上面例子中，`process.emitWarning()`内部生成了一个`Error`对象，并传递给[`process.on('warning')`][process_warning]事件。

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // 'Warning'
  console.warn(warning.message); // 'Something happened!'
  console.warn(warning.code);    // 'MY_WARNING'
  console.warn(warning.stack);   // Stack trace
  console.warn(warning.detail);  // 'This is some additional information'
});
```

如果`warning`参数值是一个`Error`对象，`options`参数项都会被忽略。


## process.emitWarning(warning[, type[, code]][, ctor])
<!-- YAML
added: v6.0.0
-->

* `warning` {string|Error} 发出的警告。
* `type` {string} 如果 `warning` 是String, `type` 是警告类型的名字。 默认值: `Warning`。
* `code` {string} 当前警告的唯一标识符。
* `ctor` {Function} 如果`warning`是String，`ctor`是可选的function，用于限制生成的堆栈信息。默认`process.emitWarning`

`process.emitWarning()`方法可用于发出定制的或应用特定的进程警告。
可以通过给[`process.on('warning')`][process_warning]事件增加处理器，监听这些警告。

```js
// Emit a warning using a string.
process.emitWarning('Something happened!');
// Emits: (node: 56338) Warning: Something happened!
```

```js
// Emit a warning using a string and a type.
process.emitWarning('Something Happened!', 'CustomWarning');
// Emits: (node:56338) CustomWarning: Something Happened!
```

```js
process.emitWarning('Something happened!', 'CustomWarning', 'WARN001');
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
```

在上面例子中，`process.emitWarning()`内部生成了一个`Error`对象，并传递给[`process.on('warning')`][process_warning]事件。

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

如果`warning`参数值是一个`Error`对象，它会被透传给`process.on('warning')`的事件监听器(可选参数值`type`，`code` and `ctor`会被忽略)：

```js
// Emit a warning using an Error object.
const myWarning = new Error('Something happened!');
// Use the Error name property to specify the type name
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';

process.emitWarning(myWarning);
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
```

如果`warning`的参数值不是string或`Error`，会抛出 `TypeError`。

需要注意的是，使用`Error`对象做为进程警告，**并不是**常用的错误处理机制的替代方式。

如果警告`type`是`DeprecationWarning`，会涉及如下额外的处理：

* 如果命令行标识包含`--throw-deprecation`，deprecation warning会作为异常抛出，而不是作为事件被发出。

* 如果命令行标识包含`--no-deprecation`，deprecation warning会被忽略。

* 如果命令行标识包含`--trace-deprecation`，deprecation warning及其全部堆栈信息会被打印到`stderr`。


### Avoiding duplicate warnings

作为最佳实践，警告应该在每个进程中最多发出一次。
为了达到上述的要求，推荐在使用`emitWarning()`之前用一个简单的布尔值做判断，如下例所示：

```js
function emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true;
    process.emitWarning('Only warn once!');
  }
}
emitMyWarning();
// Emits: (node: 56339) Warning: Only warn once!
emitMyWarning();
// Emits nothing
```


## process.env
<!-- YAML
added: v0.1.27
-->

* {Object}

`process.env`属性返回一个包含用户环境信息的对象
See environ(7).

例如这样的对象:

<!-- eslint-skip -->
```js
{
  TERM: 'xterm-256color',
  SHELL: '/usr/local/bin/bash',
  USER: 'maciej',
  PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/maciej',
  EDITOR: 'vim',
  SHLVL: '1',
  HOME: '/Users/maciej',
  LOGNAME: 'maciej',
  _: '/usr/local/bin/node'
}
```

可以修改这个对象，但是下面例子的做法是不会生效的：

```命令行修改
$ node -e 'process.env.foo = "bar"' && echo $foo
```

下面的做法会生效：

```js文件中修改
process.env.foo = 'bar';
console.log(process.env.foo);
```

在`process.env`中新增一个属性，会将属性值转换成字符串

例如:

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

用 `delete`从`process.env`中删除一个属性

例如:

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

在Windows系统下，环境变量是不区分大小写的

例如:

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```



## process.execArgv
<!-- YAML
added: v0.7.7
-->

* {Object}

`process.execArgv` 属性返回当Node.js进程被启动时，Node.js特定的命令行选项。
这些选项在[`process.argv`][]属性返回的数组中不会出现，并且这些选项中不会包括Node.js的可执行脚本名称或者任何在脚本名称后面出现的选项。
这些选项在创建子进程时是有用的，因为他们包含了与父进程一样的执行环境信息。

例如:

```console
$ node --harmony script.js --version
```

`process.execArgv`的结果:

<!-- eslint-disable semi -->
```js
['--harmony']
```

`process.argv`的结果:

<!-- eslint-disable semi -->
```js
['/usr/local/bin/node', 'script.js', '--version']
```


## process.execPath
<!-- YAML
added: v0.1.100
-->

* {string}

`process.execPath` 属性，返回启动Node.js进程的可执行文件所在的绝对路径。

例如:

<!-- eslint-disable semi -->
```js
'/usr/local/bin/node'
```




## process.exit([code])
<!-- YAML
added: v0.1.13
-->

* `code` {integer} 结束状态码。默认为`0`。

`process.exit()`方法以结束状态码`code`指令Node.js同步终止进程。
如果`code`未提供，此exit方法要么使用'success' 状态码 `0`，要么使用`process.exitCode`属性值，前提是此属性已被设置。
Node.js在所有[`'exit'`]事件监听器都被调用了以后，才会终止进程。

使用一个'failure'状态码结束的例子:

```js
process.exit(1);
```

执行Node.js的shell应该会得到结束状态码`1`。

需要特别注意的是，调用`process.exit()`会强制进程尽快结束，*即使仍然有很多处于等待中的异步操作*没有全部执行完成，
*包括*输出到`process.stdout`和`process.stderr`的I/O操作。

在大多数情况下，显式调用`process.exit()`是没有必要的。如果在事件轮询队列中没有处于等待中的工作，Node.js进程会自行结束。
当进程正常结束时，`process.exitCode`属性可以被设置，以便于告知进程使用哪个结束状态码。

如下例子说明了一个 *错误使用* `process.exit()`方法的场景，会导致输出到stdout的数据清空或丢失：

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

这个例子中出现问题的原因在于，Node.js中写入到`process.stdout`的操作有时是异步的，并可能在Node.js事件轮询的多个ticks中出现。
调用`process.exit()`会使得在写入`stdout`的额外操作执行*之前*，进程就被强制结束了。

与直接调用`process.exit()`相比，代码*应该*设置`process.exitCode`并允许进程自然的结束，以免事件轮询队列中存在额外的工作：

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

如果出现错误情况，而有必要结束Node.js进程，抛出一个*uncaught*错误并且允许进程正常结束的处理方式，要比调用`process.exit()`安全的多。


## process.exitCode
<!-- YAML
added: v0.1.13
-->

* `code` {integer} 结束状态码。默认为`0`。

`process.exit()`方法以结束状态码`code`指令Node.js同步终止进程。
如果`code`未提供，此exit方法要么使用'success' 状态码 `0`，要么使用`process.exitCode`属性值，前提是此属性已被设置。
Node.js在所有[`'exit'`]事件监听器都被调用了以后，才会终止进程。

使用一个'failure'状态码结束的例子:

```js
process.exit(1);
```

执行Node.js的shell应该会得到结束状态码`1`。

需要特别注意的是，调用`process.exit()`会强制进程尽快结束，*即使仍然有很多处于等待中的异步操作*没有全部执行完成，
*包括*输出到`process.stdout`和`process.stderr`的I/O操作。

在大多数情况下，显式调用`process.exit()`是没有必要的。如果在事件轮询队列中没有处于等待中的工作，Node.js进程会自行结束。
当进程正常结束时，`process.exitCode`属性可以被设置，以便于告知进程使用哪个结束状态码。

如下例子说明了一个 *错误使用* `process.exit()`方法的场景，会导致输出到stdout的数据清空或丢失：

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

这个例子中出现问题的原因在于，Node.js中写入到`process.stdout`的操作有时是异步的，并可能在Node.js事件轮询的多个ticks中出现。
调用`process.exit()`会使得在写入`stdout`的额外操作执行*之前*，进程就被强制结束了。

与直接调用`process.exit()`相比，代码*应该*设置`process.exitCode`并允许进程自然的结束，以免事件轮询队列中存在额外的工作：

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

如果出现错误情况，而有必要结束Node.js进程，抛出一个*uncaught*错误并且允许进程正常结束的处理方式，要比调用`process.exit()`安全的多。


## process.getegid()
<!-- YAML
added: v0.1.13
-->

* `code` {integer} 结束状态码。默认为`0`。

`process.exit()`方法以结束状态码`code`指令Node.js同步终止进程。
如果`code`未提供，此exit方法要么使用'success' 状态码 `0`，要么使用`process.exitCode`属性值，前提是此属性已被设置。
Node.js在所有[`'exit'`]事件监听器都被调用了以后，才会终止进程。

使用一个'failure'状态码结束的例子:

```js
process.exit(1);
```

执行Node.js的shell应该会得到结束状态码`1`。

需要特别注意的是，调用`process.exit()`会强制进程尽快结束，*即使仍然有很多处于等待中的异步操作*没有全部执行完成，
*包括*输出到`process.stdout`和`process.stderr`的I/O操作。

在大多数情况下，显式调用`process.exit()`是没有必要的。如果在事件轮询队列中没有处于等待中的工作，Node.js进程会自行结束。
当进程正常结束时，`process.exitCode`属性可以被设置，以便于告知进程使用哪个结束状态码。

如下例子说明了一个 *错误使用* `process.exit()`方法的场景，会导致输出到stdout的数据清空或丢失：

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

这个例子中出现问题的原因在于，Node.js中写入到`process.stdout`的操作有时是异步的，并可能在Node.js事件轮询的多个ticks中出现。
调用`process.exit()`会使得在写入`stdout`的额外操作执行*之前*，进程就被强制结束了。

与直接调用`process.exit()`相比，代码*应该*设置`process.exitCode`并允许进程自然的结束，以免事件轮询队列中存在额外的工作：

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

如果出现错误情况，而有必要结束Node.js进程，抛出一个*uncaught*错误并且允许进程正常结束的处理方式，要比调用`process.exit()`安全的多。


## process.geteuid()
<!-- YAML
added: v0.1.13
-->

* `code` {integer} 结束状态码。默认为`0`。

`process.exit()`方法以结束状态码`code`指令Node.js同步终止进程。
如果`code`未提供，此exit方法要么使用'success' 状态码 `0`，要么使用`process.exitCode`属性值，前提是此属性已被设置。
Node.js在所有[`'exit'`]事件监听器都被调用了以后，才会终止进程。

使用一个'failure'状态码结束的例子:

```js
process.exit(1);
```

执行Node.js的shell应该会得到结束状态码`1`。

需要特别注意的是，调用`process.exit()`会强制进程尽快结束，*即使仍然有很多处于等待中的异步操作*没有全部执行完成，
*包括*输出到`process.stdout`和`process.stderr`的I/O操作。

在大多数情况下，显式调用`process.exit()`是没有必要的。如果在事件轮询队列中没有处于等待中的工作，Node.js进程会自行结束。
当进程正常结束时，`process.exitCode`属性可以被设置，以便于告知进程使用哪个结束状态码。

如下例子说明了一个 *错误使用* `process.exit()`方法的场景，会导致输出到stdout的数据清空或丢失：

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

这个例子中出现问题的原因在于，Node.js中写入到`process.stdout`的操作有时是异步的，并可能在Node.js事件轮询的多个ticks中出现。
调用`process.exit()`会使得在写入`stdout`的额外操作执行*之前*，进程就被强制结束了。

与直接调用`process.exit()`相比，代码*应该*设置`process.exitCode`并允许进程自然的结束，以免事件轮询队列中存在额外的工作：

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

如果出现错误情况，而有必要结束Node.js进程，抛出一个*uncaught*错误并且允许进程正常结束的处理方式，要比调用`process.exit()`安全的多。



## process.getgid()
<!-- YAML
added: v0.1.31
-->

* Returns: {Object}

`process.getgid()`方法返回Node.js进程的数字标记的组身份(See getgid(2))。

```js
if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

*注意*：这个函数只在POSIX平台有效(在Windows或Android平台无效)。




## process.getgroups()
<!-- YAML
added: v0.9.4
-->

* Returns: {Array}

`process.getgroups()`方法返回数组，其中包含了补充的组ID。
POSIX leaves it unspecified if the effective group ID is included but
Node.js ensures it always is.

*注意*：这个函数只在POSIX平台有效(在Windows或Android平台无效)。



## process.getuid()
<!-- YAML
added: v0.1.28
-->

* Returns: {integer}

`process.getuid()`方法返回Node.js进程的数字标记的用户身份(See getuid(2))。

```js
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

*注意*：这个函数只在POSIX平台有效(在Windows或Android平台无效)。



## process.hrtime([time])
<!-- YAML
added: v0.7.6
-->

* `time` {Array} 上一次调用`process.hrtime()`的结果
* Returns: {Array}

`process.hrtime()`方法`返回当前时间以[seconds, nanoseconds]` tuple Array表示的高精度解析值，
`nanoseconds`是当前时间无法使用秒的精度表示的剩余部分。

`time` 是可选参数，传入的值是上一次调用`process.hrtime()`返回的结果，用于与当次调用做差值计算。
如果此参数传入的不是一个tuple Array，会抛出`TypeError`。
给此参数传入一个用户定义的数组，而不是传入上次调用`process.hrtime()`的结果，会导致未定义的行为。

`process.hrtime()`返回的时间，都是相对于过去某一时刻的值，与一天中的时钟时间没有关系，因此不受制于时钟偏差。
此方法最主要的作用是衡量间隔操作的性能：

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // benchmark took 1000000552 nanoseconds
}, 1000);
```



## process.initgroups(user, extra_group)
<!-- YAML
added: v0.7.6
-->

* `time` {Array} 上一次调用`process.hrtime()`的结果
* Returns: {Array}

`process.hrtime()`方法`返回当前时间以[seconds, nanoseconds]` tuple Array表示的高精度解析值，
`nanoseconds`是当前时间无法使用秒的精度表示的剩余部分。

`time` 是可选参数，传入的值是上一次调用`process.hrtime()`返回的结果，用于与当次调用做差值计算。
如果此参数传入的不是一个tuple Array，会抛出`TypeError`。
给此参数传入一个用户定义的数组，而不是传入上次调用`process.hrtime()`的结果，会导致未定义的行为。

`process.hrtime()`返回的时间，都是相对于过去某一时刻的值，与一天中的时钟时间没有关系，因此不受制于时钟偏差。
此方法最主要的作用是衡量间隔操作的性能：

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // benchmark took 1000000552 nanoseconds
}, 1000);
```



## process.kill(pid[, signal])
<!-- YAML
added: v0.0.6
-->

* `pid` {number} 进程ID
* `signal` {string|number} 将发送的信号，类型为string或number。默认为`'SIGTERM'`。

`process.kill()`方法将`signal`发送给`pid`标识的进程。

信号名称是如`'SIGINT'` 或 `'SIGHUP'`的字符串。更多信息，查看[Signal Events][] 和 kill(2)。

如果目标`pid`不存在，该方法会抛出错误。作为一个特殊例子，信号`0`可以用于测试进程是否存在。
在Windows平台中，如果`pid`用于kill进程组，会抛出错误。

*注意*：即使这个函数的名称是`process.kill()`,它其实只是发送信号，这点与`kill`系统调用类似。
发送的信号可能是做一些与kill目标进程无关的事情。

例如:

```js
process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
});

setTimeout(() => {
  console.log('Exiting.');
  process.exit(0);
}, 100);

process.kill(process.pid, 'SIGHUP');
```

*注意*: 当Node.js进程接收到了`SIGUSR1`，Node.js会启动debugger，查看[Signal Events][]。



## process.mainModule
<!-- YAML
added: v0.1.17
-->

`process.mainModule`属性提供了一种获取[`require.main`][]的替代方式。
The difference is that if the main module changes at
runtime, [`require.main`][] may still refer to the original main module in modules
that were required before the change occurred.
一般来说，假定[`require.main`][]和`process.mainModule`引用相同的模块是安全的。

就像[`require.main`][]一样，如果没有入口脚本，`process.mainModule`的值是`undefined`。


## process.memoryUsage()
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->

* 返回: {Object}
    * `rss` {integer}
    * `heapTotal` {integer}
    * `heapUsed` {integer}
    * `external` {integer}

`process.memoryUsage()`方法返回Node.js进程的内存使用情况的对象，该对象每个属性值的单位为字节。

例如:

```js
console.log(process.memoryUsage());
```

会得到:

<!-- eslint-skip -->
```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` 和 `heapUsed` 代表V8的内存使用情况。

`external`代表V8管理的，绑定到Javascript的C++对象的内存使用情况。



## process.nextTick(callback[, ...args])
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->

* 返回: {Object}
    * `rss` {integer}
    * `heapTotal` {integer}
    * `heapUsed` {integer}
    * `external` {integer}

`process.memoryUsage()`方法返回Node.js进程的内存使用情况的对象，该对象每个属性值的单位为字节。

例如:

```js
console.log(process.memoryUsage());
```

会得到:

<!-- eslint-skip -->
```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` 和 `heapUsed` 代表V8的内存使用情况。

`external`代表V8管理的，绑定到Javascript的C++对象的内存使用情况。



## process.pid
<!-- YAML
added: v0.1.15
-->

* {integer}

`process.pid`属性返回进程的PID。

```js
console.log(`This process is pid ${process.pid}`);
```


## process.platform
<!-- YAML
added: v0.1.16
-->

* {string}

`process.platform`属性返回字符串，标识Node.js进程运行其上的操作系统平台。
例如`'darwin'`, `'freebsd'`, `'linux'`, `'sunos'` 或 `'win32'`

```js
console.log(`This platform is ${process.platform}`);
```


## process.release
<!-- YAML
added: v3.0.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->

`process.release` 属性返回与当前发布相关的元数据对象，包括源代码和源代码头文件 tarball的URLs。


`process.release`包括如下属性：

* `name` {string} 对于Node.js， 此值始终为`'node'`。对于传统io.js 发布包， 此值为`'io.js'`。

* `sourceUrl` {string} 指向一个_`.tar.gz`_文件的绝对URL，包括了当前发布的源代码。

* `headersUrl`{string} 指向一个_`.tar.gz`_文件的绝对URL，包括了当前发布的源代码的头文件信息。
  这个文件要比全部源代码文件明显小很多，可以用于编译Node.js原生插件。

* `libUrl` {string} 指向一个_`node.lib`_文件的绝对URL，匹配当前发布的结构和版本信息。此文件用于编译Node.js本地插件。
  _这个属性只在Windows版本中存在，在其他平台中无效。

* `lts` {string} 标识当前发布的[LTS][]标签的字符串。 如果Node.js发布不是一个LTS发布，此值为`undefined`。

例如：

<!-- eslint-skip -->
```js
{
  name: 'node',
  lts: 'Argon',
  sourceUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v4.4.5/win-x64/node.lib'
}
```

从源码树的非发布版本中构建的定制版本，可能只有`name`属性有效。其他的属性不一定会存在。


## process.send(message[, sendHandle[, options]][, callback])
<!-- YAML
added: v0.5.9
-->

* `message` {Object}
* `sendHandle` {Handle object}
* `options` {Object}
* `callback` {Function}
* Returns: {boolean}

If Node.js is spawned with an IPC channel, the `process.send()` method can be
used to send messages to the parent process. Messages will be received as a
[`'message'`][] event on the parent's [`ChildProcess`][] object.

If Node.js was not spawned with an IPC channel, `process.send()` will be
`undefined`.

*Note*: This function uses [`JSON.stringify()`][] internally to serialize the
`message`.

## process.setegid(id)
<!-- YAML
added: v2.0.0
-->

* `id` {string|number} A group name or ID

The `process.setegid()` method sets the effective group identity of the process.
(See setegid(2).) The `id` can be passed as either a numeric ID or a group
name string. If a group name is specified, this method blocks while resolving
the associated a numeric ID.

```js
if (process.getegid && process.setegid) {
  console.log(`Current gid: ${process.getegid()}`);
  try {
    process.setegid(501);
    console.log(`New gid: ${process.getegid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows
or Android).


## process.seteuid(id)
<!-- YAML
added: v2.0.0
-->

* `id` {string|number} A user name or ID

The `process.seteuid()` method sets the effective user identity of the process.
(See seteuid(2).) The `id` can be passed as either a numeric ID or a username
string.  If a username is specified, the method blocks while resolving the
associated numeric ID.

```js
if (process.geteuid && process.seteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
  try {
    process.seteuid(501);
    console.log(`New uid: ${process.geteuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows
or Android).

## process.setgid(id)
<!-- YAML
added: v0.1.31
-->

* `id` {string|number} The group name or ID

The `process.setgid()` method sets the group identity of the process. (See
setgid(2).)  The `id` can be passed as either a numeric ID or a group name
string. If a group name is specified, this method blocks while resolving the
associated numeric ID.

```js
if (process.getgid && process.setgid) {
  console.log(`Current gid: ${process.getgid()}`);
  try {
    process.setgid(501);
    console.log(`New gid: ${process.getgid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows
or Android).

## process.setgroups(groups)
<!-- YAML
added: v0.9.4
-->

* `groups` {Array}

The `process.setgroups()` method sets the supplementary group IDs for the
Node.js process. This is a privileged operation that requires the Node.js process
to have `root` or the `CAP_SETGID` capability.

The `groups` array can contain numeric group IDs, group names or both.

*Note*: This function is only available on POSIX platforms (i.e. not Windows
or Android).

## process.setuid(id)
<!-- YAML
added: v0.1.28
-->

The `process.setuid(id)` method sets the user identity of the process. (See
setuid(2).)  The `id` can be passed as either a numeric ID or a username string.
If a username is specified, the method blocks while resolving the associated
numeric ID.

```js
if (process.getuid && process.setuid) {
  console.log(`Current uid: ${process.getuid()}`);
  try {
    process.setuid(501);
    console.log(`New uid: ${process.getuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows
or Android).


## process.stderr


* {Stream}

`process.stderr` 属性返回连接到`stderr`(fd `2`)的流。 
它是一个[`net.Socket`][](它是一个[Duplex][]流)，除非 fd `2`指向一个文件，在这种情况下它是一个[可写][]流。

*注意*: `process.stderr` 与其他 Node.js 流有重要的区别，详见 [note on process I/O][]。


## process.stdin

* {Stream}

The `process.stdin` property returns a stream connected to
`stdin` (fd `0`). It is a [`net.Socket`][] (which is a [Duplex][]
stream) unless fd `0` refers to a file, in which case it is
a [Readable][] stream.

`process.stdin` 属性返回连接到`stdin`(fd `0`)的流。 
它是一个[`net.Socket`][](它是一个[Duplex][]流)，除非 fd `0`指向一个文件，在这种情况下它是一个[可读][]流。

举个例子:

```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```

`process.stdin` 返回的 [Duplex] 流, 可以在`旧`模式下使用,兼容node v0.10。
更多信息查看[流的兼容性]。

*注意*: 在"旧模式下" `stdin`流 默认是暂停的.所以必须通过执行`.stdin.resume()`来恢复它.
同时`process.stdin.resume()`会切换到`旧模式`

## process.stdout

* {Stream}

`process.stdout` 属性返回连接到 `stdout` (fd `1`)的流。 
它是一个[`net.Socket`][] (它是一个[Duplex][]流)， 除非 fd `1` 指向一个文件，在这种情况下它是一个[可写][]流。

例1： 将输入流数据输出到输出流，即输出到终端。

```js
process.stdin.pipe(process.stdout);
```
例2： 要求用户输入两个数值，然后把和输出到终端。

```js
/*1:声明变量*/
var num1, num2;
/*2：向屏幕输出，提示信息，要求输入num1*/
process.stdout.write('请输入num1的值：');
/*3：监听用户的输入*/
process.stdin.on('data', function (chunk) {
    if (!num1) {
        num1 = Number(chunk);
        /*4：向屏幕输出，提示信息，要求输入num2*/
        process.stdout.write('请输入num2的值');
    } else {
        num2 = Number(chunk);
        process.stdout.write('结果是：' + (num1 + num2));
    }
});
```

注意:  重要的是`process.stdout`不同于 Node.js 的其他流,
详情可以参考[note on process I/O][] .


## process.title
<!-- YAML
added: v0.1.104
-->

* {string}

The `process.title` property returns the current process title (i.e. returns
the current value of `ps`). Assigning a new value to `process.title` modifies
the current value of `ps`.

*Note*: When a new value is assigned, different platforms will impose
different maximum length restrictions on the title. Usually such restrictions
are quite limited. For instance, on Linux and macOS, `process.title` is limited
to the size of the binary name plus the length of the command line arguments
because setting the `process.title` overwrites the `argv` memory of the
process.  Node.js v0.8 allowed for longer process title strings by also
overwriting the `environ` memory but that was potentially insecure and
confusing in some (rather obscure) cases.

## process.umask([mask])
<!-- YAML
added: v0.1.19
-->

* `mask` {number}

The `process.umask()` method sets or returns the Node.js process's file mode
creation mask. Child processes inherit the mask from the parent process. Invoked
without an argument, the current mask is returned, otherwise the umask is set to
the argument value and the previous mask is returned.

```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```


## process.uptime()
<!-- YAML
added: v0.5.0
-->

* Returns: {number}

`process.uptime()` 方法返回当前 Node.js 进程运行时间秒长

*注意*: 该返回值包含秒的分数。 使用 `Math.floor()` 来得到整秒钟。


## process.version
<!-- YAML
added: v0.5.0
-->

* Returns: {number}

`process.uptime()` 方法返回当前 Node.js 进程运行时间秒长

*注意*: 该返回值包含秒的分数。 使用 `Math.floor()` 来得到整秒钟。


## process.versions
<!-- YAML
added: v0.5.0
-->

* Returns: {number}

`process.uptime()` 方法返回当前 Node.js 进程运行时间秒长

*注意*: 该返回值包含秒的分数。 使用 `Math.floor()` 来得到整秒钟。


## Exit Codes

Node.js will normally exit with a `0` status code when no more async
operations are pending.  The following status codes are used in other
cases:

* `1` **Uncaught Fatal Exception** - There was an uncaught exception,
  and it was not handled by a domain or an [`'uncaughtException'`][] event
  handler.
* `2` - Unused (reserved by Bash for builtin misuse)
* `3` **Internal JavaScript Parse Error** - The JavaScript source code
  internal in Node.js's bootstrapping process caused a parse error.  This
  is extremely rare, and generally can only happen during development
  of Node.js itself.
* `4` **Internal JavaScript Evaluation Failure** - The JavaScript
  source code internal in Node.js's bootstrapping process failed to
  return a function value when evaluated.  This is extremely rare, and
  generally can only happen during development of Node.js itself.
* `5` **Fatal Error** - There was a fatal unrecoverable error in V8.
  Typically a message will be printed to stderr with the prefix `FATAL
  ERROR`.
* `6` **Non-function Internal Exception Handler** - There was an
  uncaught exception, but the internal fatal exception handler
  function was somehow set to a non-function, and could not be called.
* `7` **Internal Exception Handler Run-Time Failure** - There was an
  uncaught exception, and the internal fatal exception handler
  function itself threw an error while attempting to handle it.  This
  can happen, for example, if a [`'uncaughtException'`][] or
  `domain.on('error')` handler throws an error.
* `8` - Unused.  In previous versions of Node.js, exit code 8 sometimes
  indicated an uncaught exception.
* `9` - **Invalid Argument** - Either an unknown option was specified,
  or an option requiring a value was provided without a value.
* `10` **Internal JavaScript Run-Time Failure** - The JavaScript
  source code internal in Node.js's bootstrapping process threw an error
  when the bootstrapping function was called.  This is extremely rare,
  and generally can only happen during development of Node.js itself.
* `12` **Invalid Debug Argument** - The `--inspect` and/or `--inspect-brk`
  options were set, but the port number chosen was invalid or unavailable.
* `>128` **Signal Exits** - If Node.js receives a fatal signal such as
  `SIGKILL` or `SIGHUP`, then its exit code will be `128` plus the
  value of the signal code.  This is a standard Unix practice, since
  exit codes are defined to be 7-bit integers, and signal exits set
  the high-order bit, and then contain the value of the signal code.
  For example, signal `SIGABRT` has value `6`, so the expected exit
  code will be `128` + `6`, or `134`.

[`'exit'`]: #process_event_exit
[`'finish'`]: stream.html#stream_event_finish
[`'message'`]: child_process.html#child_process_event_message
[`'rejectionHandled'`]: #process_event_rejectionhandled
[`'uncaughtException'`]: #process_event_uncaughtexception
[`ChildProcess.disconnect()`]: child_process.html#child_process_child_disconnect
[`ChildProcess.kill()`]: child_process.html#child_process_child_kill_signal
[`ChildProcess.send()`]: child_process.html#child_process_child_send_message_sendhandle_options_callback
[`ChildProcess`]: child_process.html#child_process_class_childprocess
[`Error`]: errors.html#errors_class_error
[`EventEmitter`]: events.html#events_class_eventemitter
[`JSON.stringify()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[`console.error()`]: console.html#console_console_error_data_args
[`console.log()`]: console.html#console_console_log_data_args
[`end()`]: stream.html#stream_writable_end_chunk_encoding_callback
[`net.Server`]: net.html#net_class_net_server
[`net.Socket`]: net.html#net_class_net_socket
[`process.argv`]: #process_process_argv
[`process.execPath`]: #process_process_execpath
[`process.exit()`]: #process_process_exit_code
[`process.exitCode`]: #process_process_exitcode
[`process.kill()`]: #process_process_kill_pid_signal
[`promise.catch()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
[`require.main`]: modules.html#modules_accessing_the_main_module
[`setTimeout(fn, 0)`]: timers.html#timers_settimeout_callback_delay_args
[Child Process]: child_process.html
[Cluster]: cluster.html
[Duplex]: stream.html#stream_duplex_and_transform_streams
[LTS]: https://github.com/nodejs/LTS/
[Readable]: stream.html#stream_readable_streams
[可读流]: stream.html#stream_readable_streams
[Signal Events]: #process_signal_events
[Stream compatibility]: stream.html#stream_compatibility_with_older_node_js_versions
[流的兼容性]: stream.html#stream_compatibility_with_older_node_js_versions
[TTY]: tty.html#tty_tty
[Writable]: stream.html#stream_writable_streams
[note on process I/O]: process.html#process_a_note_on_process_i_o
[process_emit_warning]: #process_process_emitwarning_warning_type_code_ctor
[process_warning]: #process_event_warning
