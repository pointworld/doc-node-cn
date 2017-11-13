# Readline

> 稳定性: 2 - 稳定的

`require('readline')` 模块提供了一个接口，用于从[可读流]（如 [`process.stdin`]）读取数据，每次读取一行。
它可以通过以下方式使用：

```js
const readline = require('readline');
```

例子，`readline` 模块的基本用法：

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('你认为 Node.js 中文网怎么样？', (answer) => {
  // 对答案进行处理
  console.log(`多谢你的反馈：${answer}`);

  rl.close();
});
```

注意：当调用该代码时，Node.js 程序不会终止，直到 `readline.Interface` 被关闭，因为接口在等待 `input` 流中要被接收的数据。

## Class: Interface
<!-- YAML
added: v0.1.104
-->

`readline.Interface` 类的实例是使用 `readline.createInterface()` 方法构造的。
每个实例都关联一个 `input` [可读流]和一个 `output` [可写流]。
`output` 流用于为到达的用户输入打印提示，且从 `input` 流读取。


### Event: 'close'
<!-- YAML
added: v0.1.98
-->

当以下之一发生时，触发 `'close'` 事件：

* `rl.close()` 方法被调用，且 `readline.Interface` 实例已撤回对 `input` 流和 `output` 流的控制；
* `input` 流接收到 `'end'` 事件；
* `input` 流接收到表示结束传输的 `<ctrl>-D`；
* `input` 流接收到表示 `SIGINT` 的 `<ctrl>-C`，且 `readline.Interface` 实例上没有注册 `SIGINT` 事件监听器。

监听器函数被调用时不传入任何参数。

当 `'close'` 事件被触发时，`readline.Interface` 实例应当被视为已结束。


### Event: 'line'
<!-- YAML
added: v0.1.98
-->

每当 `input` 流接收到接收行结束符（`\n`、`\r` 或 `\r\n`）时触发 `'line'` 事件。
通常发生在用户按下 `<Enter>` 键或 `<Return>` 键。

监听器函数被调用时会带上一个包含接收的那一行输入的字符串。

例子：

```js
rl.on('line', (input) => {
  console.log(`接收到：${input}`);
});
```


### Event: 'pause'
<!-- YAML
added: v0.7.5
-->

当以下之一发生时触发 `'pause'` 事件：

* `input` 流被暂停。
* `input` 流不是暂停的，且接收到 `SIGCONT` 事件。（详见 [`SIGTSTP`] 事件和 [`SIGCONT`] 事件）

监听器函数被调用时不传入任何参数。

例子：

```js
rl.on('pause', () => {
  console.log('Readline 被暂停。');
});
```


### Event: 'resume'
<!-- YAML
added: v0.7.5
-->

每当 `input` 流被恢复时触发 `'resume'` 事件。

监听器函数被调用时不传入任何参数。

例子：

```js
rl.on('resume', () => {
  console.log('Readline 被恢复。');
});
```


### Event: 'SIGCONT'
<!-- YAML
added: v0.7.5
-->

当一个 Node.js 进程使用 `<ctrl>-Z`（也就是 `SIGTSTP`）移入后台之后再使用 fg(1p) 移回前台时，触发 `'SIGCONT'` 事件。

如果 `input` 流在 `SIGTSTP` 请求之前被暂停，则事件不会被触发。

监听器函数被调用时不传入任何参数。

例子：

```js
rl.on('SIGCONT', () => {
  // `prompt` 会自动恢复流
  rl.prompt();
});
```

注意：Windows 系统不支持 `'SIGCONT'` 事件。


### Event: 'SIGINT'
<!-- YAML
added: v0.3.0
-->

每当 `input` 流接收到一个 `<ctrl>-C` 输入（通常被称为 `SIGINT`）时，触发 `'SIGINT'` 事件。
当 `input` 流接收到一个 `SIGINT` 时，如果没有注册 `'SIGINT'` 事件监听器，则 `'pause'` 事件会被触发。

监听器函数被调用时不传入任何参数。

例子：

```js
rl.on('SIGINT', () => {
  rl.question('确定要退出吗？ ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```


### Event: 'SIGTSTP'
<!-- YAML
added: v0.7.5
-->

每当 `input` 流接收到一个 `<ctrl>-Z` 输入（通常被称为 `SIGTSTP`）时，触发 `'SIGTSTP'` 事件。
当 `input` 流接收到一个 `SIGTSTP` 时，如果没有注册 `'SIGTSTP'` 事件监听器，则 Node.js 进程会被发送到后台。

当程序使用 fg(1p) 恢复时，`'pause'` 和 `SIGCONT` 事件会被触发。
这可被用来恢复 `input` 流。

如果 `input` 流在进程被发送到后台之前被暂停，则 `'pause'` 和 `SIGCONT` 事件不会被触发。

监听器函数被调用时不传入任何参数。

例子：

```js
rl.on('SIGTSTP', () => {
  // 这会重写 SIGTSTP，且防止程序进入后台。
  console.log('捕获 SIGTSTP。');
});
```

注意：Windows 系统不支持 `'SIGTSTP'` 事件。


### rl.close()
<!-- YAML
added: v0.1.98
-->

`rl.close()` 方法会关闭 `readline.Interface` 实例，且撤回对 `input` 和 `output` 流的控制。
但被调用时，`'close'` 事件会被触发。


### rl.pause()
<!-- YAML
added: v0.3.4
-->

`rl.pause()` 方法会暂停 `input` 流，且稍后需要时可被恢复。

调用 `rl.pause()` 不会立刻暂停其他事件（包括 `'line'`）被 `readline.Interface` 实例触发。


### rl.prompt([preserveCursor])
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} 如果为 `true`，则阻止光标落点被设为 `0`。

`rl.prompt()` 方法会在 `output` 流中新的一行写入 `readline.Interface` 实例配置后的 `prompt`，用于为用户提供一个可供输入的新的位置。

当被调用时，如果 `input` 流已被暂停，则 `rl.prompt()` 会恢复 `input` 流。

如果 `readline.Interface` 被创建时 `output` 被设为 `null` 或 `undefined`，则提示不会被写入。


### rl.question(query, callback)
<!-- YAML
added: v0.3.3
-->

* `query` {string} 一个在提示符之前、要写入 `output` 的叙述或询问。
* `callback` {Function} 一个回调函数，它会被调用并带上用户响应 `query` 的输入。

`rl.question()` 方法通过写入到 `output` 来展示 `query`，并等待用户提供到 `input` 的输入，然后调用 `callback` 函数并传入提供的输入作为第一个参数。

当被调用时，如果 `input` 流已被暂停，则 `rl.question()` 会恢复 `input` 流。

如果 `readline.Interface` 被创建时 `output` 被设为 `null` 或 `undefined`，则 `query` 不会被写入。

例子：

```js
rl.question('你最喜欢的食物是什么？ ', (answer) => {
  console.log(`你最喜欢的食物是 ${answer}`);
});
```

注意：传入的 `rl.question()` 的 `callback` 函数不遵循接受一个 `Error` 对象或 `null` 作为第一个参数的标准模式。
`callback` 被调用时只带上提供的答案作为唯一的参数。


### rl.resume()
<!-- YAML
added: v0.3.4
-->

如果 `input` 流已被暂停，则 `rl.resume()` 方法会恢复 `input` 流。


### rl.setPrompt(prompt)
<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

`rl.setPrompt()` 方法用于设置每当 `rl.prompt()` 被调用时要被写入到 `output` 的提示。


### rl.write(data[, key])
<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object}
  * `ctrl` {boolean} 如果为 `true` 则表示 `<ctrl>` 键。
  * `meta` {boolean} 如果为 `true` 则表示 `<Meta>` 键。
  * `shift` {boolean} 如果为 `true` 则表示 `<Shift>` 键。
  * `name` {string} 一个按键的名称。

`rl.write()` 方法会把 `data` 或一个由 `key` 指定的按键序列写入到 `output`。
只有当 `output` 是一个 [TTY] 文本终端时，`key` 参数才被支持。

如果指定了 `key`，则 `data` 会被忽略。

当被调用时，如果 `input` 流已被暂停，则 `rl.write()` 会恢复 `input` 流。

如果 `readline.Interface` 被创建时 `output` 被设为 `null` 或 `undefined`，则 `data` 和 `key` 不会被写入。

例子：

```js
rl.write('删除这个！');
// 模拟 Ctrl+u 删除写入的前一行。
rl.write(null, { ctrl: true, name: 'u' });
```

注意：`rl.write()` 方法会写入数据到 `readline` 接口的 `input`，犹如它是用户提供的。


## readline.clearLine(stream, dir)
<!-- YAML
added: v0.7.7
-->

* `stream` {Writable}
* `dir` {number}
  * `-1` - 光标左边
  * `1` - 光标右边
  * `0` - 整行

`readline.clearLine()` 方法会以 `dir` 指定的方向清除给定的 [TTY] 流的当前行。



## readline.clearScreenDown(stream)
<!-- YAML
added: v0.7.7
-->

* `stream` {Writable}

`readline.clearScreenDown()` 方法会从光标的当前位置向下清除给定的 [TTY] 流。


## readline.createInterface(options)
<!-- YAML
added: v0.1.98
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7125
    description: The `prompt` option is supported now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6352
    description: The `historySize` option can be `0` now.
-->

* `options` {Object}
  * `input` {Readable} 要监听的[可读流]。该选项是必需的。
  * `output` {Writable} 要写入逐行读取数据的[可写流]。
  * `completer` {Function} 一个可选的函数，用于 Tab 自动补全。
  * `terminal` {boolean} 如果 `input` 和 `output` 应被当作一个 TTY，且要写入 ANSI/VT100 转换的代码，则设为 `true`。
    默认为实例化时在 `output` 流上检查 `isTTY`。
  * `historySize` {number} 保留的历史行数的最大数量。
    设为 `0` 可禁用历史记录。
    默认为 `30`。
    该选项只有当 `terminal` 被用户或内部 `output` 设为 `true` 时才有意义，否则历史缓存机制不会被初始化。
  * `prompt` - 要使用的提示字符串。默认为 `'> '`。
  * `crlfDelay` {number} 如果 `\r` 与 `\n` 之间的延迟超过 `crlfDelay` 毫秒，则 `\r` 和 `\n` 都会被当作换行分隔符。
    默认为 `100` 毫秒。
    `crlfDelay` will be coerced to a number no less than `100`. It can be set to
    `Infinity`, in which case `\r` followed by `\n` will always be considered a
    single newline.
  * `removeHistoryDuplicates` {boolean} If `true`, when a new input line added
    to the history list duplicates an older one, this removes the older line
    from the list. Defaults to `false`.

`readline.createInterface()` 方法会创建一个新的 `readline.Interface` 实例。

例子：

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

一旦 `readline.Interface` 实例被创建，最常见的用法是监听 `'line'` 事件：

```js
rl.on('line', (line) => {
  console.log(`接收到：${line}`);
});
```

如果该实例的 `terminal` 为 `true`，则若它定义了一个 `output.columns` 属性则 `output` 流会获得最佳兼容性，且如果或当列发生变化时，`output` 上触发一个 `'resize'` 事件（当它为一个 TTY 时，[`process.stdout`] 会自动处理这个）。


### Use of the `completer` Function

`completer` 函数会获取用户输入的当前行作为参数，并返回一个包含以下两个条目的数组：

* 一个包含匹配补全输入的数组。
* 用于匹配的子字符串。

例如：`[[substr1, substr2, ...], originalsubstring]`。

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // 如果没匹配到则展示全部补全
  return [hits.length ? hits : completions, line];
}
```

如果 `completer` 函数接受两个参数，则可被异步地调用：

```js
function completer(linePartial, callback) {
  callback(null, [['123'], linePartial]);
}
```


## readline.cursorTo(stream, x, y)
<!-- YAML
added: v0.7.7
-->

* `stream` {Writable}
* `x` {number}
* `y` {number}

`readline.cursorTo()` 方法会移动光标到给定的 [TTY] `stream` 中指定的位置。


## readline.emitKeypressEvents(stream[, interface])
<!-- YAML
added: v0.7.7
-->

* `stream` {Readable}
* `interface` {readline.Interface}

`readline.emitKeypressEvents()` 方法使给定的[可写流] `stream` 相应于接收到的输入触发 `'keypress'` 事件。

可选的 `interface` 指定了一个 `readline.Interface` 实例，用于当自动补全被禁用时检测到复制粘贴输入。

如果 `stream` 是一个 [TTY]，则它必须为原始模式。

*Note*: This is automatically called by any readline instance on its `input`
if the `input` is a terminal. Closing the `readline` instance does not stop
the `input` from emitting `'keypress'` events.

```js
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);
```


## readline.moveCursor(stream, dx, dy)
<!-- YAML
added: v0.7.7
-->

* `stream` {Writable}
* `dx` {number}
* `dy` {number}

`readline.moveCursor()` 方法会移动光标到给定的 [TTY] `stream` 中相对当前的位置。


## Example: Tiny CLI

例子，使用 `readline.Interface` 类实现一个简单的命令行界面：

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '请输入> '
});

rl.prompt();

rl.on('line', (line) => {
  switch (line.trim()) {
    case 'hello':
      console.log('world!');
      break;
    default:
      console.log(`你输入的是：'${line.trim()}'`);
      break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('再见!');
  process.exit(0);
});
```


## Example: Read File Stream Line-by-Line

例子，从一个文件系统[可读流]中每次一行地消耗输入：

```js
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt')
});

rl.on('line', (line) => {
  console.log(`文件的单行内容：${line}`);
});
```


[`SIGCONT`]: readline.html#readline_event_sigcont
[`SIGTSTP`]: readline.html#readline_event_sigtstp
[`process.stdin`]: process.html#process_process_stdin
[`process.stdout`]: process.html#process_process_stdout
[Readable]: stream.html#stream_readable_streams
[可读流]: stream.html#stream_readable_streams
[TTY]: tty.html
[Writable]: stream.html#stream_writable_streams
[可写流]: stream.html#stream_writable_streams

