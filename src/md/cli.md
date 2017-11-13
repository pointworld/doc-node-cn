# Command Line Options

<!--type=misc-->

Node.js 自带了各种命令行选项。
这些选项开放了内置的调试、执行脚本的多种方式、以及其他有用的运行时选项。

运行 `man node` 可在一个终端中查看操作手册。


## Synopsis

`node [options] [v8 options] [script.js | -e "script" | -] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

执行时不带参数，会启动 [REPL]。

关于 `node debug` 的更多信息，详见[调试器]文档。


## Options

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Print node's version.


### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

打印 node 的命令行选项。
此选项的输出不如本文档详细。



### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

把跟随的参数作为 JavaScript 来执行。
在 REPL 中预定义的模块也可以在 `script` 中使用。



### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

与 `-e` 相同，但会打印结果。


### `-c`, `--check`
<!-- YAML
added:
  - v5.0.0
  - v4.2.0
-->

在不执行的情况下，对脚本进行语法检查。



### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

打开 REPL，即使 stdin 看起来不像终端。



### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

在启动时预加载指定的模块。

遵循 `require()` 的模块解析规则。
`module` 可以是一个文件的路径，或一个 node 模块名称。



### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

在主机端口上激活检查器。默认为127.0.0.1:9229。

V8检查器集成允许Chrome DevTools和IDE等工具调试和配置Node.js实例。 这些工具通过tcp端口附加到Node.js实例，并使用[Chrome Debugging Protocol][]调试协议进行通信.




### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

Activate inspector on host:port and break at start of user script.
Default host:port is 127.0.0.1:9229.


### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

Set the host:port to be used when the inspector is activated.
Useful when activating the inspector by sending the `SIGUSR1` signal.

Default host is 127.0.0.1.


### `--no-deprecation`
<!-- YAML
added: v0.8.0
-->

静默废弃的警告。


### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

打印废弃的堆栈跟踪。


### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

抛出废弃的错误。

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

Emit pending deprecation warnings.

*Note*: Pending deprecations are generally identical to a runtime deprecation
with the notable exception that they are turned *off* by default and will not
be emitted unless either the `--pending-deprecation` command line flag, or the
`NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations
are used to provide a kind of selective "early warning" mechanism that
developers may leverage to detect deprecated API usage.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

静默一切进程警告（包括废弃警告）。

### `--expose-http2`
<!-- YAML
added: v8.4.0
-->

Enable the experimental `'http2'` module.

### `--napi-modules`
<!-- YAML
added: v8.0.0
-->

Enable loading native modules compiled with the ABI-stable Node.js API (N-API)
(experimental).

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

Aborting instead of exiting causes a core file to be generated for post-mortem
analysis using a debugger (such as `lldb`, `gdb`, and `mdb`).

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

打印进程警告的堆栈跟踪（包括废弃警告）。

### `--redirect-warnings=file`
<!-- YAML
added: v8.0.0
-->

Write process warnings to the given file instead of printing to stderr. The
file will be created if it does not exist, and will be appended to if it does.
If an error occurs while attempting to write the warning to the file, the
warning will be written to stderr instead.

### `--trace-sync-io`
<!-- YAML
added: v2.1.0
-->

每当事件循环的第一帧之后检测到同步 I/O 时，打印堆栈跟踪。


### `--trace-events-enabled`
<!-- YAML
added: v7.7.0
-->

Enables the collection of trace event tracing information.

### `--trace-event-categories`
<!-- YAML
added: v7.7.0
-->

A comma separated list of categories that should be traced when trace event
tracing is enabled using `--trace-events-enabled`.

### `--zero-fill-buffers`
<!-- YAML
added: v6.0.0
-->

自动用 0 填充所有新分配的 [Buffer] 和 [SlowBuffer] 实例。


### `--preserve-symlinks`
<!-- YAML
added: v6.3.0
-->

当解析和缓存模块时，命令模块加载器保持符号连接。

默认情况下，当 Node.js 从一个被符号连接到另一块磁盘位置的路径加载一个模块时，Node.js 会解引用该连接，并使用模块的真实磁盘的实际路径，作为定位其他依赖模块的标识符和根路径。
大多数情况下，默认行为是可接受的。
但是，当使用符号连接的同行依赖，如下例子所描述的，如果 `moduleA` 试图引入 `moduleB` 作为一个同行依赖，默认行为就会抛出异常：

```text
{appDir}
 ├── app
 │   ├── index.js
 │   └── node_modules
 │       ├── moduleA -> {appDir}/moduleA
 │       └── moduleB
 │           ├── index.js
 │           └── package.json
 └── moduleA
     ├── index.js
     └── package.json
```

`--preserve-symlinks` 命令行标志命令 Node.js 使用模块的符号路径而不是真实路径，是符号连接的同行依赖能被找到。

注意，使用 `--preserve-symlinks` 会有其他方面的影响。
比如，如果符号连接的原生模块在依赖树里来自超过一个位置，它们会加载失败。
（Node.js 会将它们视为两个独立的模块，且会试图多次加载模块，造成抛出异常。）

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

为堆快照追踪堆栈对象的分配。


### `--prof-process`
<!-- YAML
added: v5.2.0
-->

处理 v8 分析器的输出，通过使用 v8 选项 `--prof` 生成。


### `--v8-options`
<!-- YAML
added: v0.1.3
-->

打印 v8 命令行选项。

注意，V8 选项允许单词使用破折号（`-`）或下划线（`_`）分隔。

例如，`--stack-trace-limit` 等同于 `--stack_trace_limit`。


### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

指定备用的默认 TLS 加密列表。
（需要 Node.js 被构建为支持加密。（默认））


### `--enable-fips`
<!-- YAML
added: v6.0.0
-->

启动时启用符合 FIPS 标准的加密。
（需要 Node.js 使用 `./configure --openssl-fips` 构建）


### `--force-fips`
<!-- YAML
added: v6.0.0
-->

启动时强制使用符合 FIPS 标准的加密。
（无法通过脚本代码禁用。）
（要求同 `--enable-fips`）



### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

启动时加载 OpenSSL 配置文件。
在其他用途中，如果 Node.js 使用 `./configure --openssl-fips` 构建，它可以用于启用符合 FIPS 标准的加密。


### `--use-openssl-ca`, `--use-bundled-ca`
<!-- YAML
added: v6.11.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by
current Node.js version. The default store is selectable at build-time.

Using OpenSSL store allows for external modifications of the store. For most
Linux and BSD distributions, this store is maintained by the distribution
maintainers and system administrators. OpenSSL CA store location is dependent on
configuration of the OpenSSL library but this can be altered at runtime using
environment variables.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store
that is fixed at release time. It is identical on all supported platforms.

See `SSL_CERT_DIR` and `SSL_CERT_FILE`.

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

指定 ICU 数据的加载路径。
（覆盖 `NODE_ICU_DATA`）



### `-`
<!-- YAML
added: v8.0.0
-->

Alias for stdin, analogous to the use of - in other command line utilities,
meaning that the script will be read from stdin, and the rest of the options
are passed to that script.


### `--`
<!-- YAML
added: v6.11.0
-->

Indicate the end of node options. Pass the rest of the arguments to the script.
If no script filename or eval/print script is supplied prior to this, then
the next argument will be used as a script filename.

## Environment Variables

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

以 `','` 分隔的应该打印调试信息的核心模块列表。



### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

以 `':'` 分隔的有模块搜索路径作前缀的目录列表。

注意，在 Windows 中，列表是用 `';'` 分隔的。



### `NODE_DISABLE_COLORS=1`
<!-- YAML
added: v0.3.0
-->

当设为 `1` 时，不会在 REPL 中使用颜色。


### `NODE_ICU_DATA=file`
<!-- YAML
added: v0.11.15
-->

ICU（Intl 对象）数据的数据路径。
当使用 `small-icu` 编译时，扩展链接的数据。


### `NODE_NO_WARNINGS=1`
<!-- YAML
added: v6.11.0
-->

When set to `1`, process warnings are silenced.

### `NODE_OPTIONS=options...`
<!-- YAML
added: v8.0.0
-->

A space-separated list of command line options. `options...` are interpreted as
if they had been specified on the command line before the actual command line
(so they can be overridden).  Node will exit with an error if an option that is
not allowed in the environment is used, such as `-p` or a script file.

Node options that are allowed are:
- `--enable-fips`
- `--force-fips`
- `--icu-data-dir`
- `--inspect-brk`
- `--inspect-port`
- `--inspect`
- `--napi-modules`
- `--no-deprecation`
- `--no-warnings`
- `--openssl-config`
- `--redirect-warnings`
- `--require`, `-r`
- `--throw-deprecation`
- `--tls-cipher-list`
- `--trace-deprecation`
- `--trace-events-categories`
- `--trace-events-enabled`
- `--trace-sync-io`
- `--trace-warnings`
- `--track-heap-objects`
- `--use-bundled-ca`
- `--use-openssl-ca`
- `--v8-pool-size`
- `--zero-fill-buffers`

V8 options that are allowed are:
- `--abort-on-uncaught-exception`
- `--max-old-space-size`

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

When set to `1`, emit pending deprecation warnings.

*Note*: Pending deprecations are generally identical to a runtime deprecation
with the notable exception that they are turned *off* by default and will not
be emitted unless either the `--pending-deprecation` command line flag, or the
`NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations
are used to provide a kind of selective "early warning" mechanism that
developers may leverage to detect deprecated API usage.

### `NODE_PRESERVE_SYMLINKS=1`
<!-- YAML
added: v7.1.0
-->

When set to `1`, instructs the module loader to preserve symbolic links when
resolving and caching modules.

### `NODE_REPL_HISTORY=file`
<!-- YAML
added: v3.0.0
-->

用于存储持久性的 REPL 历史记录的文件的路径。
默认路径是 `~/.node_repl_history`，可被该变量覆盖。
将值设为空字符串（`""` 或 `" "`）会禁用持久性的 REPL 历史记录。



### `NODE_EXTRA_CA_CERTS=file`
<!-- YAML
added: v7.3.0
-->

当设置了此选项时，根 CA 证书（如 VeriSign）会被 `file` 指定的证书扩展。
文件应该包括一个或多个可信的 PEM 格式的证书。
如果文件丢失或有缺陷，则 [`process.emitWarning()`] 会触发一个消息。

注意，当一个 TLS 或 HTTPS 的客户端或服务器的 `ca` 选项的属性被显式地指定时，则指定的证书不会被使用。


### `OPENSSL_CONF=file`
<!-- YAML
added: v6.11.0
-->

Load an OpenSSL configuration file on startup. Among other uses, this can be
used to enable FIPS-compliant crypto if Node.js is built with `./configure
--openssl-fips`.

If the [`--openssl-config`][] command line option is used, the environment
variable is ignored.

### `SSL_CERT_DIR=dir`
<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's directory
containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this
environment variable will be inherited by any child processes, and if they use
OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`
<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's file
containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this
environment variable will be inherited by any child processes, and if they use
OpenSSL, it may cause them to trust the same CAs as node.

### `NODE_REDIRECT_WARNINGS=file`
<!-- YAML
added: v8.0.0
-->

When set, process warnings will be emitted to the given file instead of
printing to stderr. The file will be created if it does not exist, and will be
appended to if it does. If an error occurs while attempting to write the
warning to the file, the warning will be written to stderr instead. This is
equivalent to using the `--redirect-warnings=file` command-line flag.

### `UV_THREADPOOL_SIZE=size`

Set the number of threads used in libuv's threadpool to `size` threads.

Asynchronous system APIs are used by Node.js whenever possible, but where they
do not exist, libuv's threadpool is used to create asynchronous node APIs based
on synchronous system APIs. Node.js APIs that use the threadpool are:

- all `fs` APIs, other than the file watcher APIs and those that are explicitly
  synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, unless it is used without a callback
- `crypto.randomFill()`
- `dns.lookup()`
- all `zlib` APIs, other than those that are explicitly synchronous

Because libuv's threadpool has a fixed size, it means that if for whatever
reason any of these APIs takes a long time, other (seemingly unrelated) APIs
that run in libuv's threadpool will experience degraded performance. In order to
mitigate this issue, one potential solution is to increase the size of libuv's
threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value
greater than `4` (its current default value).  For more information, see the
[libuv threadpool documentation][].


[`--openssl-config`]: #cli_openssl_config_file
[Buffer]: buffer.html#buffer_buffer
[Chrome Debugging Protocol]: https://chromedevtools.github.io/debugger-protocol-viewer
[REPL]: repl.html
[SlowBuffer]: buffer.html#buffer_class_slowbuffer
[debugger]: debugger.html
[emit_warning]: process.html#process_process_emitwarning_warning_type_code_ctor

[调试器]: debugger.html
[`process.emitWarning()`]: process.html#process_process_emitwarning_warning_type_code_ctor
