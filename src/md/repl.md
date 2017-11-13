# REPL
> 稳定性: 2 - 稳定的

`repl` 模块提供了一种“读取-求值-输出”循环（REPL）的实现，它可作为一个独立的程序或嵌入到其他应用中。
可以通过以下方式使用它：

```js
const repl = require('repl');
```
## Design and Features

`repl` 模块导出了 `repl.REPLServer` 类。
当 `repl.REPLServer` 实例运行时，它接收用户输入的每一行，根据用户定义的解释函数解释这些输入，然后输出结果。
输入可以是 `stdin`，输出可以是 `stdout`，或者也可以连接到其他任何 Node.js [流]。

`repl.REPLServer` 实例支持输入的自动补全、精简 Emacs 风格的行编辑、多行输入、ANSI 风格的输出、当前 REPL 会话状态的保存与恢复、错误校正、以及可定制的解释函数。


### Commands and Special Keys

所有 REPL 的实例都支持下列特殊命令：

* `.break` - 在输入一个多行表达式的过程中，输入 `.break` 命令（或按下 `<ctrl>-C` 组合键）将终止表达式的继续输入。
* `.clear` - 重置 REPL 的 `context` 为一个空对象，并清除当前正输入的所有多行表达式。
* `.exit` - 关闭输入输出流，退出 REPL。
* `.help` - 显示特定命令的帮助列表。
* `.save` - 保存当前 REPL 会话到一个文件：
  `> .save ./file/to/save.js`
* `.load` - 读取一个文件到当前 REPL 会话。
  `> .load ./file/to/load.js`
* `.editor` 进入编辑模式（`<ctrl>-D` 完成，`<ctrl>-C` 取消）

<!-- eslint-skip -->
```js
> .editor
// 进入编辑模式（^D 完成，^C 取消）
function welcome(name) {
  return `你好 ${name}！`;
}

welcome('Node.js 用户');

// ^D
'你好 Node.js 用户！'
>
```

REPL 中下列按键组合有特殊作用：

* `<ctrl>-C` - 当按下一次时，与 `.break` 命令的效果一样。当在空白行按下两次时，与 `.exit` 命令的效果一样。
* `<ctrl>-D` - 与 `.exit` 命令的效果一样。
* `<tab>` - 当在空白行按下时，显示全局和本地作用域内的变量。当在输入时按下，显示相关的自动补全选项。


### Default Evaluation

默认情况下，所有 `repl.REPLServer` 实例使用了一个解释函数，它可以解释 JavaScript 表达式、提供对 Node.js 内置模块的访问。
当 `repl.REPLServer` 实例被创建时可以传入一个替换的解释函数，覆盖其默认的功能。


#### JavaScript Expressions

默认的解释器支持直接解释 JavaScript 表达式：

<!-- eslint-skip -->
```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

除非在块级作用域中或函数中，否则变量不管是隐式地声明还是使用 `const` 、 `let` 或 `var` 关键字声明，都是声明在全局作用域中。


#### Global and Local Scope

默认的解释器提供了获取存在于全局作用域中的任何变量的途径。
可以通过给每个 `REPLServer` 绑定的 `context` 对象指定变量，来显式地把变量暴露给 REPL。
例如：

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

`context` 对象的属性表现为 REPL 中的局部变量：

<!-- eslint-skip -->
```js
$ node repl_test.js
> m
'message'
```

注意，默认情况下 `context` 的属性不是只读的。
要指定只读的全局变量，`context` 的属性必须使用 `Object.defineProperty()` 来定义:

```js
const repl = require('repl');
const msg = 'message';

const r = repl.start('> ');
Object.defineProperty(r.context, 'm', {
  configurable: false,
  enumerable: true,
  value: msg
});
```


#### Accessing Core Node.js Modules

默认的解释器会自动加载被调用的 Node.js 核心模块到 REPL 环境中。
例如，除非被声明为一个全局变量或一个有限范围的变量，否则输入 `fs` 会被解释为 `global.fs = require('fs')`。

<!-- eslint-skip -->
```js
> fs.createReadStream('./some/file');
```


#### Assignment of the `_` (underscore) variable

默认的解释器会把最近一次解释的表达式的结果赋值给变量 `_` （下划线）。
显式地设置 `_` 为某个值能禁用该特性。

<!-- eslint-skip -->
```js
> [ 'a', 'b', 'c' ]
[ 'a', 'b', 'c' ]
> _.length
3
> _ += 1
Expression assignment to _ now disabled.
4
> 1 + 1
2
> _
4
```


### Custom Evaluation Functions

当创建一个新的 `repl.REPLServer` 时，可以提供一个自定义的解释函数。
这可以用于实现完全定制化的 REPL 应用。

例子，一个执行文本翻译的 REPL：

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```


#### Recoverable Errors

当用户正在 REPL 中输入时，按下 `<enter>` 键会把当前行的输入发送到 `eval` 函数。
为了支持多行输入，`eval` 函数可以返回一个 `repl.Recoverable` 实例给提供的回调函数：

```js
function myEval(cmd, context, filename, callback) {
  let result;
  try {
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
  }
  callback(null, result);
}

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}
```


### Customizing REPL Output

默认情况下，在把输出写入到提供的可写流（默认为 `process.stdout`）之前，`repl.REPLServer` 实例会使用 [`util.inspect()`] 方法对输出进行格式化。
使用 `util.inspect()` 方法时，`useColors` 选项可被指定是否在建立默认输出器时使用 ANSI 风格的代码给输出上色。

在构造时，通过在 `writer` 选项传入一个新的函数，可以完全地自定义一个 `repl.REPLServer` 实例的输出。
例子，把输入的任何文本转换为大写：

```js
const repl = require('repl');

const r = repl.start({ prompt: '> ', eval: myEval, writer: myWriter });

function myEval(cmd, context, filename, callback) {
  callback(null, cmd);
}

function myWriter(output) {
  return output.toUpperCase();
}
```


## Class: REPLServer
<!-- YAML
added: v0.1.91
-->

`repl.REPLServer` 类继承自 [`readline.Interface`] 类。
`repl.REPLServer` 的实例由 `repl.start()` 方法创建，不能直接使用 JavaScript 的 `new` 关键字创建。


### Event: 'exit'
<!-- YAML
added: v0.7.7
-->

当接收到 `.exit` 命令、或按下两次 `<ctrl>-C` 发出 `SIGINT` 信号、或按下 `<ctrl>-D` 发出 `'end'` 信号而使 REPL 被退出时，触发 `'exit'` 事件。
监听器的回调函数被调用时不带任何参数。

```js
replServer.on('exit', () => {
  console.log('从 REPL 接收到 "exit" 事件！');
  process.exit();
});
```


### Event: 'reset'
<!-- YAML
added: v0.11.0
-->

当 REPL 的上下文被重置时，触发 `'reset'` 事件。
每当接收到 `.clear` 命令时会触发该事件，除非 REPL 正在使用默认的解释器并且 `repl.REPLServer` 实例被创建时 `useGlobal` 选项被设为 `true`。
监听器的回调函数被调用时会带上 `context` 对象作为惟一的参数。

这主要被用于重新初始化 REPL 上下文，使之达到某些预定义的状态，如下面的例子：

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

当代码被执行时，全局的 `'m'` 变量可以被修改，但随后的 `.clear` 命令会把它重置回初始值：

<!-- eslint-skip -->
```js
$ ./node example.js
> m
'test'
> m = 1
1
> m
1
> .clear
Clearing context...
> m
'test'
>
```

### replServer.defineCommand(keyword, cmd)
<!-- YAML
added: v0.3.0
-->

* `keyword` {string} 命令关键字（开头不带 `.` 字符）。
* `cmd` {Object|Function} 当命令被执行时调用的函数。

`replServer.defineCommand()` 方法用于添加新的前缀为 `.` 的命令到 REPL 实例。
这些命令通过输入一个 `.` 加 `keyword` 来调用。
`cmd` 可以是一个函数或一个具有以下属性的对象：

* `help` {string} 当键入 `.help` 时显示的帮助说明（可选）。
* `action` {Function} 要执行的函数，可接受一个字符串参数。

例子，添加两个新命令到 REPL 实例：

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: '打招呼',
  action(name) {
    this.lineParser.reset();
    this.bufferedCommand = '';
    console.log(`你好，${name}！`);
    this.displayPrompt();
  }
});
replServer.defineCommand('saybye', function saybye() {
  console.log('再见！');
  this.close();
});
```

在 REPL 实例中使用新的命令：

```txt
> .sayhello Node.js中文网
你好，Node.js中文网！
> .saybye
再见！
```


### replServer.displayPrompt([preserveCursor])
<!-- YAML
added: v0.1.91
-->

* `preserveCursor` {boolean}

`replServer.displayPrompt()` 方法会让 REPL 实例做好用户输入的准备，打印配置的 `prompt` 到 `output` 中新的一行，然后返回 `input` 等待新的输入。

当正在键入多行输入时，会打印省略号而不是提示符。

当 `preserveCursor` 为 `true` 时，游标位置不会被复位到 `0`。

`replServer.displayPrompt` 方法主要被使用 `replServer.defineCommand()` 方法注册的命令的 `action` 函数调用。


### replServer.clearBufferedCommand()
<!-- YAML
added: REPLACEME
-->

The `replServer.clearBufferedComand()` method clears any command that has been
buffered but not yet executed. This method is primarily intended to be
called from within the action function for commands registered using the
`replServer.defineCommand()` method.

### replServer.parseREPLKeyword(keyword, [rest])
<!-- YAML
added: v0.8.9
deprecated: REPLACEME
-->

* `keyword` {string} the potential keyword to parse and execute
* `rest` {any} any parameters to the keyword command

> Stability: 0 - Deprecated.

An internal method used to parse and execute `REPLServer` keywords.
Returns `true` if `keyword` is a valid keyword, otherwise `false`.

## repl.start([options])
<!-- YAML
added: v0.1.91
changes:
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->

* `options` {Object|string}
  * `prompt` {string} 要显示的输入提示符。默认为 `> `（末尾有一个空格）。
  * `input` {Readable} REPL 输入要被读取的可读流。默认为 `process.stdin`。
  * `output` {Writable} REPL 输出要被写入的可写流。默认为 `process.stdout`。
  * `terminal` {boolean} 如果为 `true`，则指定 `output` 应被当作一个 TTY 终端，并且可以使用 ANSI/VT100 转义码写入。
    默认值为初始化时 `output` 流的 `isTTY` 属性的值。
  * `eval` {Function} 当解释每行输入时使用的函数。默认为 JavaScript `eval()` 函数的异步封装。
    `eval` 函数出错时会返回 `repl.Recoverable`，表明输入不完整并提示用户完成输入。
  * `useColors` {boolean} 如果为 `true`，则指定默认的 `writer` 函数可以在 REPL 输出中包含 ANSI 颜色风格。
    如果提供了自定义的 `writer` 函数，则该参数无效。
    默认为 REPL 实例的 `terminal` 属性的值。
  * `useGlobal` {boolean} 如果为 `true`，则指定默认的解释函数使用 JavaScript `global` 作为上下文，而不是为 REPL 实例创建一个新的独立的上下文。
    The node CLI REPL sets this value to `true`.
    默认为 `false`。
  * `ignoreUndefined` {boolean} 如果为 `true`，则指定默认的输出器不会输出命令返回的 `undefined` 值。
     默认为 `false`。
  * `writer` {Function} 在写入到 `output` 之前，该函数被调用用来格式化每个命令的输出。
    默认为 [`util.inspect()`]。
  * `completer` {Function} 可选的函数，用来自定义 Tab 键的自动补全。
    详见 [`readline.InterfaceCompleter`]。
  * `replMode` {symbol} 一个标志位，指定默认的解释器使用严格模式或默认（sloppy）模式来执行 JavaScript 命令。
    可选的值有：
    * `repl.REPL_MODE_SLOPPY` - 使用默认模式解释表达式。
    * `repl.REPL_MODE_STRICT` - 使用严格模式解释表达式。该模式等同于在每个 repl 声明前加上 `'use strict'`。
    * `repl.REPL_MODE_MAGIC` - This value is **deprecated**, since enhanced
      spec compliance in V8 has rendered magic mode unnecessary. It is now
      equivalent to `repl.REPL_MODE_SLOPPY` (documented above).
  * `breakEvalOnSigint` - 当接收到 `SIGINT` 时停止解释当前代码，比如按下 `Ctrl+C`。
    不能与自定义的 `eval` 函数同时使用。
    默认为 `false`。

`repl.start()` 方法创建并启动一个 `repl.REPLServer` 实例。

如果 `options` 是一个字符串，则它指定了输入提示符：

```js
const repl = require('repl');

// 一个 Unix 风格的提示符
repl.start('$ ');
```


## The Node.js REPL

Node.js 自身也使用 `repl` 模块为执行 JavaScript 代码提供交互接口。
可以通过不带任何参数（或使用 `-i` 参数）地执行 Node.js 二进制文件来使用它：

<!-- eslint-skip -->
```js
$ node
> const a = [1, 2, 3];
undefined
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### Environment Variable Options

使用以下环境变量，可以自定义 Node.js REPL 的各种行为：

 - `NODE_REPL_HISTORY` - 当给定了一个有效的路径，则 REPL 的历史记录将被保存到指定的文件，而不是用户目录下的 `.node_repl_history` 文件。
  设为 `""` 将禁用 REPL 历史记录。
  值两头的空格键会被去掉。
 - `NODE_REPL_HISTORY_SIZE` - 默认为 `1000`。控制历史记录的最大行数。必须是正数。
 - `NODE_REPL_MODE` - 可以是 `sloppy`、`strict` 或 `magic`。
  Defaults to `sloppy`, which will allow non-strict mode code to be run. `magic` is
   **deprecated** and treated as an alias of `sloppy`.


### Persistent History

默认情况下，Node.js REPL 模块会把 `node` REPL 会话之间的历史记录保存到用户目录中的 `.node_repl_history` 文件。
修改环境变量 `NODE_REPL_HISTORY=""` 可以禁用该功能。


#### NODE_REPL_HISTORY_FILE
<!-- YAML
added: v2.0.0
deprecated: v3.0.0
-->

> 稳定性: 0 - 废弃的: 使用 [NODE_REPL_HISTORY] 代替。

Node.js/io.js v2.x 之前，REPL 的历史记录使用 `NODE_REPL_HISTORY_FILE` 变量来控制，且历史记录以 JSON 格式保存。
该变量已被废弃，旧的 JSON 格式的 REPL 历史记录文件会被自动转换为一种精简的纯文本格式。
这个新的文件会被保存到用户目录下或由 `NODE_REPL_HISTORY` 变量定义的目录下，详见[环境变量选项]。


### Using the Node.js REPL with advanced line-editors

对于高级的行编辑器，可以使用环境变量 `NODE_NO_READLINE=1` 来启动 Node.js。
这会以标准的终端配置来启动主 REPL 和调试 REPL，可以使用 `rlwrap`。

例如，可以在 `.bashrc` 文件中添加：

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```



### Starting multiple REPL instances against a single running instance

可以在一个 Node.js 实例中创建并运行多个 REPL 实例，它们共享一个 `global` 对象但有独立的 I/O 接口。

例子，在 `stdin`、Unix socket、和 TCP socket 上分别提供了独立的 REPL：

```js
const net = require('net');
const repl = require('repl');
let connections = 0;

repl.start({
  prompt: 'Node.js 使用 stdin> ',
  input: process.stdin,
  output: process.stdout
});

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js 使用 Unix socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen('/tmp/node-repl-sock');

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js 使用 TCP socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen(5001);
```

从命令行运行这个应用会在 stdin 上启动一个 REPL。
其他 REPL 客户端可以通过 Unix socket 或 TCP socket 进行连接。
例如，可以使用 `telnet` 连接到 TCP socket，使用 `socat` 连接到 Unix socket 或 TCP socket。

通过从一个基于 Unix socket 的服务器（而不是 stdin）启动一个 REPL，可以连接到一个长期运行的 Node.js 进程而无需重启它。

例子，在一个 `net.Server` 实例和一个 `net.Socket` 实例上运行一个全特性的（`terminal`）REPL，详见：https://gist.github.com/2209310

例子，在 [curl(1)][] 上运行一个 REPL 实例，详见：https://gist.github.com/2053342

[`readline.InterfaceCompleter`]: readline.html#readline_use_of_the_completer_function
[`readline.Interface`]: readline.html#readline_class_interface
[`util.inspect()`]: util.html#util_util_inspect_object_options
[curl(1)]: https://curl.haxx.se/docs/manpage.html
[stream]: stream.html
[流]: stream.html
[NODE_REPL_HISTORY]: #repl_environment_variable_options
[环境变量选项]: #repl_environment_variable_options