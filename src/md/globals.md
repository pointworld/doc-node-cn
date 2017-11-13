# Global Objects

<!-- type=misc -->

全局变量在所有模块中均可使用。
但以下变量的作用域只在模块内，详见 [module文档]：

- [`__dirname`]
- [`__filename`]
- [`exports`]
- [`module`]
- [`require()`]

以下的对象是特定于 Node.js 的。
有些[内置对象]是 JavaScript 语言本身的一部分，它们也是全局的。


## Class: Buffer
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

用于处理二进制数据。详见 [buffer文档]。


## \_\_dirname


详见 [`__dirname`] 文档。


## \_\_filename


详见 [`__filename`] 文档。


## clearImmediate(immediateObject)
<!-- YAML
added: v0.9.1
-->

<!--type=global-->

详见 [`clearImmediate`] 文档。


## clearInterval(intervalObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

详见 [`clearInterval`] 文档。


## clearTimeout(timeoutObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

详见 [`clearTimeout`] 文档。


## console
<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

用于打印 `stdout` 和 `stderr`。
详见 [`console`] 文档。


## exports


详见 [`exports`] 文档。


## global
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} 全局的命名空间对象。

在浏览器中，顶层作用域就是全局作用域。
这意味着在浏览器中，`var something` 会定义一个新的全局变量。
在 Node.js 中则不同，顶层作用域不是全局作用域，`var something` 的作用域只在模块内。

## module


详见 [`module`] 文档。


## process
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

进程对象。
详见 [`process`] 文档。
## require()


详见 [`require()`] 文档。


## setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

详见 [`setImmediate`] 文档。

## setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

详见 [`setInterval`] 文档。

## setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

详见 [`setTimeout`] 文档。
[`__dirname`]: modules.html#modules_dirname
[`__filename`]: modules.html#modules_filename
[`clearImmediate`]: timers.html#timers_clearimmediate_immediate
[`clearInterval`]: timers.html#timers_clearinterval_timeout
[`clearTimeout`]: timers.html#timers_cleartimeout_timeout
[`console`]: console.html
[`exports`]: modules.html#modules_exports
[`module`]: modules.html#modules_module
[`process` object]: process.html#process_process
[`require()`]: modules.html#modules_require
[`setImmediate`]: timers.html#timers_setimmediate_callback_args
[`setInterval`]: timers.html#timers_setinterval_callback_delay_args
[`setTimeout`]: timers.html#timers_settimeout_callback_delay_args
[buffer section]: buffer.html
[built-in objects]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
[module system documentation]: modules.html
[timers]: timers.html

[`process`]: process.html#process_process
[buffer文档]: buffer.html
[内置对象]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
[module文档]: modules.html
[定时器]: timers.html
