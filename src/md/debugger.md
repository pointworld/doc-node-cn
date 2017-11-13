# Debugger

> 稳定性: 2 - 稳定的

<!-- type=misc -->

Node.js 包含一个进程外的调试工具，可以通过一个基于 TCP 协议且内置的调试客户端访问。
要使用它，需要以 `inspect` 参数启动 Node.js，并带上需要调试的脚本的路径；然后会出现一个提示，表明已成功启动调试器：

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   console.log('world');
debug>
```

Node.js 的调试器客户端还未支持全部特性，但可以做些简单的步骤和检测。

在脚本的源代码中插入 `debugger;` 语句，则会在代码的那个位置启用一个断点：

<!-- eslint-disable no-debugger -->
```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('世界');
}, 1000);
console.log('你好');
```

一旦运行调试器，则在第 3 行会出现一个断点：
```
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   debugger;
debug> cont
< 你好
break in myscript.js:3
  1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
> 3   debugger;
  4   console.log('世界');
  5 }, 1000);
debug> next
break in myscript.js:4
  2 setTimeout(() => {
  3   debugger;
> 4   console.log('世界');
  5 }, 1000);
  6 console.log('你好');
debug> repl
Press Ctrl + C to leave debug repl
> x
5
> 2+2
4
debug> next
< 世界
break in myscript.js:5
  3   debugger;
  4   console.log('世界');
> 5 }, 1000);
  6 console.log('你好');
  7
debug> .exit
```

`repl` 命令用于运行代码。
`next` 命令用于步入下一行。
输入 `help` 可查看其他可用的命令。

按下 `enter` 键且不输入命令，则可重复上一个调试命令。


## Watchers

可以在调试时监视表达式和变量的值。
在每个断点上，监视器列表中的每个表达式都会在当前上下文中被执行，并在断点的源代码列表之前立即显示。

输入 `watch('my_expression')` 开始监视一个表达式。
`watchers` 命令会打印已激活的监视器。
输入 `unwatch('my_expression')` 来移除一个监视器。


## Command reference

### Stepping

* `cont`, `c` - 继续执行
* `next`, `n` - 下一步
* `step`, `s` - 跳进函数
* `out`, `o` - 跳出函数
* `pause` - 暂停运行代码（类似开发者工具中的暂停按钮）


### Breakpoints

* `setBreakpoint()`, `sb()` - 在当前行设置断点
* `setBreakpoint(line)`, `sb(line)` - 在指定行设置断点
* `setBreakpoint('fn()')`, `sb(...)` - 在函数体的第一条语句设置断点
* `setBreakpoint('script.js', 1)`, `sb(...)` - 在 script.js 的第 1 行设置断点
* `clearBreakpoint('script.js', 1)`, `cb(...)` - 清除 script.js 第 1 行的断点

也可以在一个还未被加载的文件（模块）中设置断点：

```txt
$ node inspect test/fixtures/break-in-module/main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in test/fixtures/break-in-module/main.js:1
> 1 (function (exports, require, module, __filename, __dirname) { const mod = require('./mod.js');
  2 mod.hello();
  3 mod.hello();
debug> setBreakpoint('mod.js', 22)
Warning: script 'mod.js' was not loaded yet.
debug> c
break in test/fixtures/break-in-module/mod.js:22
 20 // USE OR OTHER DEALINGS IN THE SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Information

* `backtrace`, `bt` - 打印当前执行框架的回溯
* `list(5)` - 列出脚本源代码的 5 行上下文（前后各 5 行）
* `watch(expr)` - 添加表达式到监视列表
* `unwatch(expr)` - 从监视列表移除表达式
* `watchers` - 列出所有监视器和它们的值（每个断点会自动列出）
* `repl` - 打开调试器的 repl，用于在所调试的脚本的上下文中进行执行
* `exec expr` - 在所调试的脚本的上下文中执行一个表达式


### Execution control

* `run` - 运行脚本（调试器开始时自动运行）
* `restart` - 重新启动脚本
* `kill` - 终止脚本


### Various

* `scripts` - 列出所有已加载的脚本
* `version` - 显示 V8 引擎的版本号


## Advanced Usage

### V8 Inspector Integration for Node.js

V8 的检查器集成可以附加 Chrome 的开发者工具到 Node.js 实例以用于调试和性能分析。
It uses the [Chrome Debugging Protocol][].

当启动一个 Node.js 应用时，V8 检查器可以通过传入 `--inspect` 标志启用。
也可以通过该标志提供一个自定义的端口，如 `--inspect=9222` 会在 9222 端口接受开发者工具连接。

要想在应用代码的第一行断开，可以传入 `--inspect-brk` 标志而不是 `--inspect`。

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
at the end of the URL is generated on the fly, it varies in different
debugging sessions.)


[Chrome Debugging Protocol]: https://chromedevtools.github.io/debugger-protocol-viewer/
[TCP-based protocol]: #debugger_tcp_based_protocol

[基于 TCP 协议]: #debugger_tcp_based_protocol
