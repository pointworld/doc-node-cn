# Net

> 稳定性: 2 - 稳定

`net` 模块提供了创建基于流的 TCP 或 [IPC][] 服务器([`net.createServer()`][])和客户端([`net.createConnection()`][]) 的异步网络 API。

通过以下方式引入:

```js
const net = require('net');
```

## IPC Support

`net` 模块在 Windows 上支持命名管道 IPC，在其他操作系统上支持 UNIX 域套接字。


### Identifying paths for IPC connections

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and
[`socket.connect()`][] take a `path` parameter to identify IPC endpoints.


[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] 和
[`socket.connect()`][] 使用 `path` 参数来识别 IPC 端点。

在 UNIX 上，本地域也称为 UNIX 域。参数 `path` 是文件系统路径名。它被从 `sizeof(sockaddr_un.sun_path) - 1` 处被截断，其长度因操作系统不同而在 91 至 107 字节之间变化。典型值在 Linux 上为 107，在 macOS 上为 103。该路径受到与创建文件相同的命名约定和权限检查。它将在文件系统中可见，并且将持续到取消链接的时候。

在 Windows 上，本地域通过命名管道实现。路径必须是以 `\\?\pipe\` 或 `\\.\pipe\` 为入口。路径允许任何字符，但后面的字符可能会对管道名称进行一些处理，例如解析 `..` 序列。尽管如此，管道空间是平面的。管道不会持续，当最后一次引用关闭时，管道就会被删除。不要忘了 JavaScript 字符串转义需要使用双反斜杠指定路径，例如：

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```


## Class: net.Server
<!-- YAML
added: v0.1.90
-->
这个类用于创建TCP或[IPC][] server.。


### new net.Server([options][, connectionListener])

* 返回: {net.Server}

查看 [`net.createServer([options][, connectionListener])`][`net.createServer()`].

`net.Server` is an [`EventEmitter`][]实现了以下事件:


### Event: 'close'
<!-- YAML
added: v0.5.0
-->

当server关闭的时候触发. 注意,如果connections存在, 直到所有的connections结束才会触发这个事件


### Event: 'connection'
当server关闭的时候触发. 注意,如果connections存在, 直到所有的connections结束才会触发这个事件

### Event: 'error'
<!-- YAML
added: v0.1.90
-->

* {Error}

当错误出现的时候触发. 不同与 [`net.Socket`][], [`'close'`][]
事件不会在这个事件触发后继续触发 除非
[`server.close()`][] 是手动调用. 在
[`server.listen()`][]中的例子.


### Event: 'listening'
<!-- YAML
added: v0.1.90
-->

当服务被绑定后调用 [`server.listen()`][].

### server.address()
<!-- YAML
added: v0.1.90
-->

如果在IP socket上监听,则返回绑定的ip地址, 地址族和操作系统报告的服务端口
在找到操作系统分配的地址时，找到指定的端口是有用的.返回一个有 `port`, `family`, 和 `address` 属性:
`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`的对象

对于在管道或UNIX域套接字上侦听的server,该名称将返回为字符串

例子:

```js
const server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  // handle errors here
  throw err;
});

// grab an arbitrary unused port.
server.listen(() => {
  console.log('opened server on', server.address());
});
```

只有到了 `'listening'` 事件被触发时候.才可以调用 `server.address()` 


### server.close([callback])
<!-- YAML
added: v0.1.90
-->

* 返回: {net.Server}

停止 server接受建立新的connections并保持已经存在的connections.此功能是异步的,当所有的connections关闭同时server响应 [`'close'`][]事件的时候,server将会最终关闭.
一旦`'close'`发生将会调用可选的回调函数. 与该事件不同, 如果服务器在关闭时未打开，则将使用错误作为唯一参数。

返回 `server`。

### server.connections
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Stability: 0 - Deprecated: Use [`server.getConnections()`][] instead.

The number of concurrent connections on the server.

This becomes `null` when sending a socket to a child with
[`child_process.fork()`][]. To poll forks and get current number of active
connections use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)
<!-- YAML
added: v0.9.7
-->

* Returns {net.Server}

Asynchronously get the number of concurrent connections on the server. Works
when sockets were sent to forks.

Callback should take two arguments `err` and `count`.

### server.listen()

为connections启动一个 server 监听. 一个 `net.Server` 可以是一个 TCP 或者 
一个 [IPC][] server，这取决于它监听什么。

Possible signatures:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]
  for [IPC][] servers
* [`server.listen([port][, host][, backlog][, callback])`][`server.listen(port, host)`]
  for TCP servers

这个函数是异步的。当 server 开始监听，[`'listening'`][] 事件会触发。最后一个参数
`callback` 将会被添加为[`'listening'`][] 事件的监听器。


所有的 `listen()` 方法可以传入一个 `backlog` 参数来指定待连接队列的最大长度。
实际长度将通过 OS 的 sysctl 设置， 例如 linux 里的 `tcp_max_syn_backlog` 和 `somaxconn`。
这个参数的默认值是511 (不是512）

*说明*：

* 所有的[`net.Socket`][] 被设置为 `So_REUSEADDR` (详见 [socket(7)][])

* `server.listen()` 方法可能会被调用多次. 通过先前提供的选项, 每个 subsequent call 将会 *re-open* 该 server

监听时，其中一个最常引发的错误是 `EADDRINUSE`。
这发生在当另一个 server 已经监听了该请求中的 `port` / `path` / `handle`。
处理这种情况的一种方法是在一定时间后重试：

```js
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);
  }
});
```


#### server.listen(handle[, backlog][, callback])
<!-- YAML
added: v0.5.10
-->

* `handle` {Object}
* `backlog` {number} Common parameter of [`server.listen()`][] functions
* `callback` {Function} Common parameter of [`server.listen()`][] functions
* Returns: {net.Server}

Start a server listening for connections on a given `handle` that has
already been bound to a port, a UNIX domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an
underlying `_handle` member), or an object with an `fd` member that is a
valid file descriptor.

*Note*: Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Required. Supports the following properties:
  * `port` {number}
  * `host` {string}
  * `path` {string} Will be ignored if `port` is specified. See
    [Identifying paths for IPC connections][].
  * `backlog` {number} Common parameter of [`server.listen()`][]
    functions
  * `exclusive` {boolean} Default to `false`
* `callback` {Function} Common parameter of [`server.listen()`][]
  functions
* Returns: {net.Server}

If `port` is specified, it behaves the same as
[`server.listen([port][, hostname][, backlog][, callback])`][`server.listen(port, host)`].
Otherwise, if `path` is specified, it behaves the same as
[`server.listen(path[, backlog][, callback])`][`server.listen(path)`].
If none of them is specified, an error will be thrown.

If `exclusive` is `false` (default), then cluster workers will use the same
underlying handle, allowing connection handling duties to be shared. When
`exclusive` is `true`, the handle is not shared, and attempted port sharing
results in an error. An example which listens on an exclusive port is
shown below.

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

#### server.listen(path[, backlog][, callback])
<!-- YAML
added: v0.1.90
-->

* `path` {String} Path the server should listen to. See
  [Identifying paths for IPC connections][].
* `backlog` {number} Common parameter of [`server.listen()`][] functions
* `callback` {Function} Common parameter of [`server.listen()`][] functions
* Returns: {net.Server}

Start a [IPC][] server listening for connections on the given `path`.

#### server.listen([port][, host][, backlog][, callback])
<!-- YAML
added: v0.1.90
-->
* `port` {number}
* `host` {string}
* `backlog` {number} Common parameter of [`server.listen()`][] functions
* `callback` {Function} Common parameter of [`server.listen()`][] functions
* Returns: {net.Server}

Start a TCP server listening for connections on the given `port` and `host`.

If `port` is omitted or is 0, the operating system will assign an arbitrary
unused port, which can be retrieved by using `server.address().port`
after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the
[unspecified IPv6 address][] (`::`) when IPv6 is available, or the
[unspecified IPv4 address][] (`0.0.0.0`) otherwise.

*Note*: In most operating systems, listening to the
[unspecified IPv6 address][] (`::`) may cause the `net.Server` to also listen on
the [unspecified IPv4 address][] (`0.0.0.0`).

### server.listening
<!-- YAML
added: v5.7.0
-->

一个布尔值， 表明 server 是否正在监听连接


### server.maxConnections
<!-- YAML
added: v0.2.0
-->

设置该属性使得当 server 连接数过多时拒绝连接。

一旦将一个套接字发送给[`child process.fork()`][]生成的子进程， 不推荐使用该选项。



### server.ref()
<!-- YAML
added: v0.9.1
-->

* Returns: {net.Server}

Opposite of `unref`, calling `ref` on a previously `unref`d server will *not*
let the program exit if it's the only server left (the default behavior). If
the server is `ref`d calling `ref` again will have no effect.

### server.unref()
<!-- YAML
added: v0.9.1
-->

* Returns: {net.Server}

Calling `unref` on a server will allow the program to exit if this is the only
active server in the event system. If the server is already `unref`d calling
`unref` again will have no effect.

## Class: net.Socket
<!-- YAML
added: v0.3.4
-->

This class is an abstraction of a TCP socket or a streaming [IPC][] endpoint
(uses named pipes on Windows, and UNIX domain sockets otherwise). A
`net.Socket` is also a [duplex stream][], so it can be both readable and
writable, and it is also a [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with
a server. For example, it is returned by [`net.createConnection()`][],
so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection
is received. For example, it is passed to the listeners of a
[`'connection'`][] event emitted on a [`net.Server`][], so the user can use
it to interact with the client.

### new net.Socket([options])
<!-- YAML
added: v0.3.4
-->

Creates a new socket object.

* `options` {Object} Available options are:
  * `fd`: {number} If specified, wrap around an existing socket with
    the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections
    are allowed. See [`net.createServer()`][] and the [`'end'`][] event
    for details. Defaults to `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed,
    otherwise ignored. Defaults to `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed,
    otherwise ignored. Defaults to `false`.
* Returns: {net.Socket}

The newly created socket can be either a TCP socket or a streaming [IPC][]
endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Event: 'close'
<!-- YAML
added: v0.1.90
-->

* `had_error` {boolean} `true` if the socket had a transmission error.

Emitted once the socket is fully closed. The argument `had_error` is a boolean
which says if the socket was closed due to a transmission error.

### Event: 'connect'
<!-- YAML
added: v0.1.90
-->

Emitted when a socket connection is successfully established.
See [`net.createConnection()`][].

### Event: 'data'
<!-- YAML
added: v0.1.90
-->

* {Buffer}

Emitted when data is received.  The argument `data` will be a `Buffer` or
`String`.  Encoding of data is set by `socket.setEncoding()`.
(See the [Readable Stream][] section for more information.)

Note that the **data will be lost** if there is no listener when a `Socket`
emits a `'data'` event.

### Event: 'drain'
<!-- YAML
added: v0.1.90
-->

Emitted when the write buffer becomes empty. Can be used to throttle uploads.

See also: the return values of `socket.write()`

### Event: 'end'
<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the
readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet
back and destroy its file descriptor once it has written out its pending
write queue. However, if `allowHalfOpen` is set to `true`, the socket will
not automatically [`end()`][`socket.end()`] its writable side, allowing the
user to write arbitrary amounts of data. The user must call
[`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a
FIN packet back).

### Event: 'error'
<!-- YAML
added: v0.1.90
-->

* {Error}

Emitted when an error occurs.  The `'close'` event will be called directly
following this event.

### Event: 'lookup'
<!-- YAML
added: v0.11.3
changes:
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emitted after resolving the hostname but before connecting.
Not applicable to UNIX sockets.

* `err` {Error|null} The error object.  See [`dns.lookup()`][].
* `address` {string} The IP address.
* `family` {string|null} The address type.  See [`dns.lookup()`][].
* `host` {string} The hostname.

### Event: 'timeout'
<!-- YAML
added: v0.1.90
-->

Emitted if the socket times out from inactivity. This is only to notify that
the socket has been idle. The user must manually close the connection.

See also: [`socket.setTimeout()`][]

### socket.address()
<!-- YAML
added: v0.1.90
-->

Returns the bound address, the address family name and port of the
socket as reported by the operating system. Returns an object with
three properties, e.g.
`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize
<!-- YAML
added: v0.3.8
-->

`net.Socket` has the property that `socket.write()` always works. This is to
help users get up and running quickly. The computer cannot always keep up
with the amount of data that is written to a socket - the network connection
simply might be too slow. Node.js will internally queue up the data written to a
socket and send it out over the wire when it is possible. (Internally it is
polling on the socket's file descriptor for being writable).

The consequence of this internal buffering is that memory may grow. This
property shows the number of characters currently buffered to be written.
(Number of characters is approximately equal to the number of bytes to be
written, but the buffer may contain strings, and the strings are lazily
encoded, so the exact number of bytes is not known.)

Users who experience large or growing `bufferSize` should attempt to
"throttle" the data flows in their program with
[`socket.pause()`][] and [`socket.resume()`][].

### socket.bytesRead
<!-- YAML
added: v0.5.3
-->

The amount of received bytes.

### socket.bytesWritten
<!-- YAML
added: v0.5.3
-->

The amount of bytes sent.

### socket.connect()

Initiate a connection on a given socket.

Possible signatures:

* [socket.connect(options[, connectListener])][`socket.connect(options)`]
* [socket.connect(path[, connectListener])][`socket.connect(path)`]
  for [IPC][] connections.
* [socket.connect(port[, host][, connectListener])][`socket.connect(port, host)`]
  for TCP connections.
* Returns: {net.Socket} The socket itself.

This function is asynchronous. When the connection is established, the
[`'connect'`][] event will be emitted. If there is a problem connecting,
instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with
the error passed to the [`'error'`][] listener.
The last parameter `connectListener`, if supplied, will be added as a listener
for the [`'connect'`][] event **once**.

#### socket.connect(options[, connectListener])
<!-- YAML
added: v0.1.90
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6021
    description: The `hints` option defaults to `0` in all cases now.
                 Previously, in the absence of the `family` option it would
                 default to `dns.ADDRCONFIG | dns.V4MAPPED`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6000
    description: The `hints` option is supported now.
-->

* `options` {Object}
* `connectListener` {Function} Common parameter of [`socket.connect()`][]
  methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate a connection on a given socket. Normally this method is not needed,
the socket should be created and opened with [`net.createConnection()`][]. Use
this only when implementing a custom Socket.

For TCP connections, available `options` are:

* `port` {number} Required. Port the socket should connect to.
* `host` {string} Host the socket should connect to. Defaults to `'localhost'`.
* `localAddress` {string} Local address the socket should connect from.
* `localPort` {number} Local port the socket should connect from.
* `family` {number}: Version of IP stack, can be either 4 or 6. Defaults to 4.
* `hints` {number} Optional [`dns.lookup()` hints][].
* `lookup` {Function} Custom lookup function. Defaults to [`dns.lookup()`][].

For [IPC][] connections, available `options` are:

* `path` {string} Required. Path the client should connect to.
  See [Identifying paths for IPC connections][].

Returns `socket`.

#### socket.connect(path[, connectListener])

* `path` {string} Path the client should connect to. See
  [Identifying paths for IPC connections][].
* `connectListener` {Function} Common parameter of [`socket.connect()`][]
  methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate an [IPC][] connection on the given socket.

Alias to
[`socket.connect(options[, connectListener])`][`socket.connect(options)`]
called with `{ path: path }` as `options`.

Returns `socket`.

#### socket.connect(port[, host][, connectListener])
<!-- YAML
added: v0.1.90
-->

* `port` {number} Port the client should connect to.
* `host` {string} Host the client should connect to.
* `connectListener` {Function} Common parameter of [`socket.connect()`][]
  methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate a TCP connection on the given socket.

Alias to
[`socket.connect(options[, connectListener])`][`socket.connect(options)`]
called with `{port: port, host: host}` as `options`.

Returns `socket`.

### socket.connecting
<!-- YAML
added: v6.1.0
-->

If `true` -
[`socket.connect(options[, connectListener])`][`socket.connect(options)`]
was called and haven't yet finished. Will be set to `false` before emitting
`connect` event and/or calling
[`socket.connect(options[, connectListener])`][`socket.connect(options)`]'s
callback.

### socket.destroy([exception])
<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket}

Ensures that no more I/O activity happens on this socket. Only necessary in
case of errors (parse error or so).

If `exception` is specified, an [`'error'`][] event will be emitted and any
listeners for that event will receive `exception` as an argument.

### socket.destroyed

A Boolean value that indicates if the connection is destroyed or not. Once a
connection is destroyed no further data can be transferred using it.

### socket.end([data][, encoding])
<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Half-closes the socket. i.e., it sends a FIN packet. It is possible the
server will still send some data.

If `data` is specified, it is equivalent to calling
`socket.write(data, encoding)` followed by [`socket.end()`][].

### socket.localAddress
<!-- YAML
added: v0.9.6
-->

The string representation of the local IP address the remote client is
connecting on. For example, in a server listening on `'0.0.0.0'`, if a client
connects on `'192.168.1.1'`, the value of `socket.localAddress` would be
`'192.168.1.1'`.

### socket.localPort
<!-- YAML
added: v0.9.6
-->

The numeric representation of the local port. For example,
`80` or `21`.

### socket.pause()

* Returns: {net.Socket} The socket itself.

Pauses the reading of data. That is, [`'data'`][] events will not be emitted.
Useful to throttle back an upload.

### socket.ref()
<!-- YAML
added: v0.9.1
-->

* Returns: {net.Socket} The socket itself.

Opposite of `unref`, calling `ref` on a previously `unref`d socket will *not*
let the program exit if it's the only socket left (the default behavior). If
the socket is `ref`d calling `ref` again will have no effect.

### socket.remoteAddress
<!-- YAML
added: v0.5.10
-->

The string representation of the remote IP address. For example,
`'74.125.127.100'` or `'2001:4860:a005::68'`. Value may be `undefined` if
the socket is destroyed (for example, if the client disconnected).

### socket.remoteFamily
<!-- YAML
added: v0.11.14
-->

The string representation of the remote IP family. `'IPv4'` or `'IPv6'`.

### socket.remotePort
<!-- YAML
added: v0.5.10
-->

The numeric representation of the remote port. For example,
`80` or `21`.

### socket.resume()

* Returns: {net.Socket} The socket itself.

Resumes reading after a call to [`socket.pause()`][].

### socket.setEncoding([encoding])
<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Set the encoding for the socket as a [Readable Stream][]. See
[`stream.setEncoding()`][] for more information.

### socket.setKeepAlive([enable][, initialDelay])
<!-- YAML
added: v0.1.92
-->

* Returns: {net.Socket} The socket itself.

Enable/disable keep-alive functionality, and optionally set the initial
delay before the first keepalive probe is sent on an idle socket.
`enable` defaults to `false`.

Set `initialDelay` (in milliseconds) to set the delay between the last
data packet received and the first keepalive probe. Setting 0 for
initialDelay will leave the value unchanged from the default
(or previous) setting. Defaults to `0`.

### socket.setNoDelay([noDelay])
<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Disables the Nagle algorithm. By default TCP connections use the Nagle
algorithm, they buffer data before sending it off. Setting `true` for
`noDelay` will immediately fire off data each time `socket.write()` is called.
`noDelay` defaults to `true`.

### socket.setTimeout(timeout[, callback])
<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Sets the socket to timeout after `timeout` milliseconds of inactivity on
the socket. By default `net.Socket` do not have a timeout.

When an idle timeout is triggered the socket will receive a [`'timeout'`][]
event but the connection will not be severed. The user must manually call
[`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

If `timeout` is 0, then the existing idle timeout is disabled.

The optional `callback` parameter will be added as a one time listener for the
[`'timeout'`][] event.

### socket.unref()
<!-- YAML
added: v0.9.1
-->

* Returns: {net.Socket} The socket itself.

Calling `unref` on a socket will allow the program to exit if this is the only
active socket in the event system. If the socket is already `unref`d calling
`unref` again will have no effect.

### socket.write(data[, encoding][, callback])
<!-- YAML
added: v0.1.90
-->

Sends data on the socket. The second parameter specifies the encoding in the
case of a string--it defaults to UTF8 encoding.

Returns `true` if the entire data was flushed successfully to the kernel
buffer. Returns `false` if all or part of the data was queued in user memory.
[`'drain'`][] will be emitted when the buffer is again free.

The optional `callback` parameter will be executed when the data is finally
written out - this may not be immediately.

## net.connect()

Aliases to
[`net.createConnection()`][`net.createConnection()`].

Possible signatures:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC][]
  connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`]
  for TCP connections.

### net.connect(options[, connectListener])
<!-- YAML
added: v0.7.0
-->
Alias to
[`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### net.connect(path[, connectListener])
<!-- YAML
added: v0.1.90
-->

Alias to
[`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### net.connect(port[, host][, connectListener])
<!-- YAML
added: v0.1.90
-->

Alias to
[`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## net.createConnection()

A factory function, which creates a new [`net.Socket`][],
immediately initiates connection with [`socket.connect()`][],
then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted
on the returned socket. The last parameter `connectListener`, if supplied,
will be added as a listener for the [`'connect'`][] event **once**.

Possible signatures:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`]
  for [IPC][] connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`]
  for TCP connections.

*Note*: The [`net.connect()`][] function is an alias to this function.

### net.createConnection(options[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `options` {Object} Required. Will be passed to both the
  [`new net.Socket([options])`][`new net.Socket(options)`] call and the
  [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
  method.
* `connectListener` {Function} Common parameter of the
  [`net.createConnection()`][] functions. If supplied, will be added as
  a listener for the [`'connect'`][] event on the returned socket once.
* Returns: {net.Socket} The newly created socket used to start the connection.

For available options, see
[`new net.Socket([options])`][`new net.Socket(options)`]
and [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Additional options:

* `timeout` {number} If set, will be used to call
  [`socket.setTimeout(timeout)`][] after the socket is created, but before
  it starts the connection.

Following is an example of a client of the echo server described
in the [`net.createServer()`][] section:

```js
const net = require('net');
const client = net.createConnection({ port: 8124 }, () => {
  //'connect' listener
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
```

To connect on the socket `/tmp/echo.sock` the second line would just be
changed to

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### net.createConnection(path[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `path` {string} Path the socket should connect to. Will be passed to
  [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
  See [Identifying paths for IPC connections][].
* `connectListener` {Function} Common parameter of the
  [`net.createConnection()`][] functions, an "once" listener for the
  `'connect'` event on the initiating socket. Will be passed to
  [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Returns: {net.Socket} The newly created socket used to start the connection.

Initiates an [IPC][] connection.

This function creates a new [`net.Socket`][] with all options set to default,
immediately initiates connection with
[`socket.connect(path[, connectListener])`][`socket.connect(path)`],
then returns the `net.Socket` that starts the connection.

### net.createConnection(port[, host][, connectListener])
<!-- YAML
added: v0.1.90
-->

* `port` {number} Port the socket should connect to. Will be passed to
  [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} Host the socket should connect to. Defaults to `'localhost'`.
  Will be passed to
  [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `connectListener` {Function} Common parameter of the
  [`net.createConnection()`][] functions, an "once" listener for the
  `'connect'` event on the initiating socket. Will be passed to
  [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* Returns: {net.Socket} The newly created socket used to start the connection.

Initiates a TCP connection.

This function creates a new [`net.Socket`][] with all options set to default,
immediately initiates connection with
[`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`],
then returns the `net.Socket` that starts the connection.

## net.createServer([options][, connectionListener])
<!-- YAML
added: v0.5.0
-->

Creates a new TCP or [IPC][] server.

* `options` {Object}
  * `allowHalfOpen` {boolean} Default to `false`. Indicates whether half-opened
    TCP connections are allowed.
  * `pauseOnConnect` {boolean} Default to `false`. Indicates whether the socket
    should be paused on incoming connections.
* `connectionListener` {Function} Automatically set as a listener for the
  [`'connection'`][] event
* Returns: {net.Server}

If `allowHalfOpen` is set to `true`, when the other end of the socket
sends a FIN packet, the server will only send a FIN packet back when
[`socket.end()`][] is explicitly called, until then the connection is
half-closed (non-readable but still writable). See [`'end'`][] event
and [RFC 1122][half-closed] for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each
incoming connection will be paused, and no data will be read from its handle.
This allows connections to be passed between processes without any data being
read by the original process. To begin reading data from a paused socket, call
[`socket.resume()`][].

The server can be a TCP server or a [IPC][] server, depending on what it
[`listen()`][`server.listen()`] to.

Here is an example of an TCP echo server which listens for connections
on port 8124:

```js
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' listener
  console.log('client connected');
  c.on('end', () => {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});
```

Test this by using `telnet`:

```console
$ telnet localhost 8124
```

To listen on the socket `/tmp/echo.sock` the third line from the last would
just be changed to

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Use `nc` to connect to a UNIX domain socket server:

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)
<!-- YAML
added: v0.3.0
-->

Tests if input is an IP address. Returns 0 for invalid strings,
returns 4 for IP version 4 addresses, and returns 6 for IP version 6 addresses.


## net.isIPv4(input)
<!-- YAML
added: v0.3.0
-->

Returns true if input is a version 4 IP address, otherwise returns false.


## net.isIPv6(input)
<!-- YAML
added: v0.3.0
-->

Returns true if input is a version 6 IP address, otherwise returns false.

[`'close'`]: #net_event_close
[`'connect'`]: #net_event_connect
[`'connection'`]: #net_event_connection
[`'data'`]: #net_event_data
[`'drain'`]: #net_event_drain
[`'end'`]: #net_event_end
[`'error'`]: #net_event_error_1
[`'listening'`]: #net_event_listening
[`'timeout'`]: #net_event_timeout
[`child_process.fork()`]: child_process.html#child_process_child_process_fork_modulepath_args_options
[`connect()`]: #net_socket_connect_options_connectlistener
[`destroy()`]: #net_socket_destroy_exception
[`dns.lookup()`]: dns.html#dns_dns_lookup_hostname_options_callback
[`dns.lookup()` hints]: dns.html#dns_supported_getaddrinfo_flags
[`end()`]: #net_socket_end_data_encoding
[`EventEmitter`]: events.html#events_class_eventemitter
[`net.createServer()`]: #net_net_createserver_options_connectionlistener
[`net.Socket`]: #net_class_net_socket
[`pause()`]: #net_socket_pause
[`resume()`]: #net_socket_resume
[`server.getConnections()`]: #net_server_getconnections_callback
[`server.listen(port, host, backlog, callback)`]: #net_server_listen_port_hostname_backlog_callback
[`server.listen()`]: #net_server_listen_port_hostname_backlog_callback
[`server.close()`]: #net_server_close_callback
[`socket.connect(options, connectListener)`]: #net_socket_connect_options_connectlistener
[`socket.connect`]: #net_socket_connect_options_connectlistener
[`socket.setTimeout()`]: #net_socket_settimeout_timeout_callback
[`stream.setEncoding()`]: stream.html#stream_readable_setencoding_encoding
[Readable Stream]: stream.html#stream_class_stream_readable
