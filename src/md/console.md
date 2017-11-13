# Console

> 稳定性: 2

`console` 模块提供了一个简单的调试控制台，类似于 Web 浏览器提供的 JavaScript 控制台。

该模块导出了两个特定的组件：

* 一个 `Console` 类，包含 `console.log()` 、 `console.error()` 和 `console.warn()` 等方法，可以被用于写入到任何 Node.js 流。
* 一个全局的 `console` 实例，可被用于写入到 [`process.stdout`] 和 [`process.stderr`]。
  全局的 `console` 使用时无需调用 `require('console')`。

注意：全局的 console 对象的方法既不总是同步的（如浏览器中类似的 API），也不总是异步的（如其他 Node.js 流）。
详见 [进程 I/O]。

例子，使用全局的 `console`：

```js
console.log('你好世界');
// 打印: '你好世界'到 stdout。
console.log('你好%s', '世界');
// 打印: '你好世界'到 stdout。
console.error(new Error('错误信息'));
// 打印: [Error: 错误信息]到 stderr。

const name = '描述';
console.warn(`警告${name}`);
// 打印: '警告描述'到 stderr。
```

例子，使用 `Console` 类：

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('你好世界');
// 打印: '你好世界'到 out。
myConsole.log('你好%s', '世界');
// 打印: '你好世界'到 out。
myConsole.error(new Error('错误信息'));
// 打印: [Error: 错误信息]到 err。

const name = '描述';
myConsole.warn(`警告${name}`);
// 打印: '警告描述'到 err。
```

## Class: Console
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: Errors that occur while writing to the underlying streams
                 will now be ignored.
-->

<!--type=class-->

`Console` 类可用于创建一个具有可配置的输出流的简单记录器，可以通过 `require('console').Console` 或 `console.Console` 使用：

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```


### new Console(stdout[, stderr])

* `stdout` {Writable}
* `stderr` {Writable}

通过传入一个或两个可写流实例，创建一个新的 `Console` 对象。
`stdout` 是一个可写流，用于打印日志或输出信息。
`stderr` 用于输出警告或错误。
如果没有传入 `stderr` ，则警告或错误输出会被发送到 `stdout` 。


```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// 自定义的简单记录器
const logger = new Console(output, errorOutput);
// 像 console 一样使用
const count = 5;
logger.log('count: %d', count);
// stdout.log 中打印: count 5
```

全局的 `console` 是一个特殊的 `Console` 实例，它的输出会发送到 [`process.stdout`] 和 [`process.stderr`]。
相当于调用：

```js
new Console(process.stdout, process.stderr);
```


### console.assert(value[, message][, ...args])
<!-- YAML
added: v0.1.101
-->
* `value` {any}
* `message` {any}
* `...args` {any}

一个简单的断言测试，验证 `value` 是否为真。
如果不为真，则抛出 `AssertionError`。
如果提供了 `message`，则使用 [`util.format()`] 格式化并作为错误信息使用。

```js
console.assert(true, 'does nothing');
// 通过
console.assert(false, 'Whoops %s', 'didn\'t work');
// AssertionError: Whoops didn't work
```

注意：Node.js 中的 `console.assert()` 方法与[在浏览器中]的 `console.assert()` 方法的实现是不一样的。

具体地说，在浏览器中，用非真的断言调用 `console.assert()` 会导致 `message` 被打印到控制台但不会中断后续代码的执行。
而在 Node.js 中，非真的断言会导致抛出 `AssertionError`。

可以通过扩展 Node.js 的 `console` 并重写 `console.assert()` 方法来实现与浏览器中类似的功能。

例子，创建一个简单的模块，并扩展与重写了 Node.js 中 `console` 的默认行为。

<!-- eslint-disable func-name-matching -->
```js
'use strict';

// 用一个新的不带补丁的 assert 实现来创建一个简单的 console 扩展。
const myConsole = Object.create(console, {
  assert: {
    value: function assert(assertion, message, ...args) {
      try {
        console.assert(assertion, message, ...args);
      } catch (err) {
        console.error(err.stack);
      }
    },
    configurable: true,
    enumerable: true,
    writable: true,
  },
});

module.exports = myConsole;
```

然后可以用来直接替换内置的 console：

```js
const console = require('./myConsole');
console.assert(false, '会打印这个消息，但不会抛出错误');
console.log('这个也会打印');
```


### console.clear()
<!-- YAML
added: v8.3.0
-->

当 `stdout` 是一个 TTY 时，调用 `console.clear()` 将尝试清除 TTY。 当 `stdout` 不是一个TTY时，该方法什么都不做。

*注意*：`console.clear()` 的具体行为可能因操作系统和终端类型而异。 对于大多数Linux操作系统，`console.clear()` 与 `clear` shell 命令行为类似。 在Windows上，`console.clear()` 将只清除当前终端视图中Node.js二进制文件的输出。

### console.count([label])
<!-- YAML
added: v8.3.0
-->

* `label` {string} 计数器的显示标签。 默认为 `'default'`。

维护一个指定 `label` 的内部计数器并且输出到 `stdout` 指定 `label` 调用 `console.count()` 的次数。

<!-- eslint-skip -->
```js
> console.count()
default: 1
undefined
> console.count('default')
default: 2
undefined
> console.count('abc')
abc: 1
undefined
> console.count('xyz')
xyz: 1
undefined
> console.count('abc')
abc: 2
undefined
> console.count()
default: 3
undefined
>
```



### console.countReset([label = 'default'])
<!-- YAML
added: v8.3.0
-->

* `label` {string} 计数器的显示标签。 默认为 `'default'`。

重置指定 `label` 的内部计数器。

<!-- eslint-skip -->
```js
> console.count('abc');
abc: 1
undefined
> console.countReset('abc');
undefined
> console.count('abc');
abc: 1
undefined
>
```


### console.dir(obj[, options])
<!-- YAML
added: v0.1.101
-->
* `obj` {any}
* `options` {Object}
  * `showHidden` {boolean}
  * `depth` {number}
  * `colors` {boolean}

在 `obj` 上使用 [`util.inspect()`] 并打印结果字符串到 `stdout`。
该函数会绕过任何定义在 `obj` 上的自定义的 `inspect()` 函数。
可选的 `options` 对象可以传入用于改变被格式化的字符串：

- `showHidden` - 如果为 `true`，则该对象中的不可枚举属性和 symbol 属性也会显示。默认为 `false`。

- `depth` - 告诉 [`util.inspect()`] 函数当格式化对象时要递归多少次。
这对于检查较大的复杂对象很有用。
默认为 `2`。
设为 `null` 可无限递归。

- `colors` - 如果为 `true`，则输出会带有 ANSI 颜色代码。
默认为 `false`。
颜色是可定制的，详见[定制 `util.inspect()` 颜色]。


### console.error([data][, ...args])
<!-- YAML
added: v0.1.100
-->
* `data` {any}
* `...args` {any}

打印到 `stderr`，并带上换行符。
可以传入多个参数，第一个参数作为主要信息，其他参数作为类似于 printf(3) 中的代替值（参数都会传给 [`util.format()`]）。

```js
const code = 5;
console.error('error #%d', code);
// 打印: error #5 到 stderr
console.error('error', code);
// 打印: error 5 到 stderr
```

如果在第一个字符串中没有找到格式化元素（如 `%d`），则在每个参数上调用 [`util.inspect()`] 并将结果字符串值拼在一起。
详见 [`util.format()`]。


### console.group([...label])
<!-- YAML
added: REPLACEME
-->

* `label` {any}

Increases indentation of subsequent lines by two spaces.

If one or more `label`s are provided, those are printed first without the
additional indentation.

### console.groupCollapsed()
<!-- YAML
  added: REPLACEME
-->

An alias for [`console.group()`][].

### console.groupEnd()
<!-- YAML
added: REPLACEME
-->

Decreases indentation of subsequent lines by two spaces.

### console.info([data][, ...args])
<!-- YAML
added: v0.1.100
-->
* `data` {any}
* `...args` {any}

`console.info()` 函数是 [`console.log()`] 的一个别名。

### console.log([data][, ...args])
<!-- YAML
added: v0.1.100
-->
* `data` {any}
* `...args` {any}

打印到 `stdout`，并带上换行符。
可以传入多个参数，第一个参数作为主要信息，其他参数作为类似于 printf(3) 中的代替值（参数都会传给 [`util.format()`]）。

```js
const count = 5;
console.log('count: %d', count);
// 打印: count: 5 到 stdout
console.log('count:', count);
// 打印: count: 5 到 stdout
```

详见 [`util.format()`]。


### console.time(label)
<!-- YAML
added: v0.1.104
-->
* `label` {string}

启动一个定时器，用以计算一个操作的持续时间。
定时器由一个唯一的 `label` 标识。
当调用 [`console.timeEnd()`] 时，可以使用相同的 `label` 来停止定时器，并以毫秒为单位将持续时间输出到 `stdout`。
定时器持续时间精确到亚毫秒。


### console.timeEnd(label)
<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->
* `label` {string}

停止之前通过调用 [`console.time()`] 启动的定时器，并打印结果到 `stdout`：

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// 打印 100-elements: 225.438ms
```

注意：从 Node.js v6.0.0 开始，`console.timeEnd()` 删除了计时器以避免泄漏。
在旧版本上，计时器依然保留。
它允许 `console.timeEnd()` 可以多次调用同一标签。
此功能是非计划中的，不再被支持。


### console.trace([message][, ...args])
<!-- YAML
added: v0.1.104
-->
* `message` {any}
* `...args` {any}

打印字符串 `'Trace :'` 到 `stderr` ，并通过 [`util.format()`] 格式化消息与堆栈跟踪在代码中的当前位置。

```js
console.trace('Show me');
// 打印: (堆栈跟踪会根据被调用的跟踪的位置而变化)
//  Trace: Show me
//    at repl:2:9
//    at REPLServer.defaultEval (repl.js:248:27)
//    at bound (domain.js:287:14)
//    at REPLServer.runBound [as eval] (domain.js:300:12)
//    at REPLServer.<anonymous> (repl.js:412:12)
//    at emitOne (events.js:82:20)
//    at REPLServer.emit (events.js:169:7)
//    at REPLServer.Interface._onLine (readline.js:210:10)
//    at REPLServer.Interface._line (readline.js:549:8)
//    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```


### console.warn([data][, ...args])
<!-- YAML
added: v0.1.100
-->
* `data` {any}
* `...args` {any}

The `console.warn()` function is an alias for [`console.error()`][].
[`console.error()`]: #console_console_error_data_args
[`console.log()`]: #console_console_log_data_args
[`console.time()`]: #console_console_time_label
[`console.timeEnd()`]: #console_console_timeend_label
[`process.stderr`]: process.html#process_process_stderr
[`process.stdout`]: process.html#process_process_stdout
[`util.format()`]: util.html#util_util_format_format_args
[`util.inspect()`]: util.html#util_util_inspect_object_options
[customizing `util.inspect()` colors]: util.html#util_customizing_util_inspect_colors
[note on process I/O]: process.html#process_a_note_on_process_i_o
[web-api-assert]: https://developer.mozilla.org/en-US/docs/Web/API/console/assert

[定制 `util.inspect()` 颜色]: util.html#util_customizing_util_inspect_colors
[进程 I/O]: process.html#process_a_note_on_process_i_o
[在浏览器中]: https://developer.mozilla.org/en-US/docs/Web/API/console/assert

