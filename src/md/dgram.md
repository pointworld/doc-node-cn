# UDP / Datagram Sockets

> 稳定性: 2 - 稳定的

<!-- name=dgram -->

`dgram`模块提供了 UDP 数据包 socket 的实现。

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`服务器异常：\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`服务器收到：${msg} 来自 ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`服务器监听 ${address.address}:${address.port}`);
});

server.bind(41234);
// 服务器监听 0.0.0.0:41234
```


## Class: dgram.Socket
<!-- YAML
added: v0.1.99
-->

`dgram.Socket`对象是一个封装了数据包函数功能的[`EventEmitter`][]。

`dgram.Socket`实例是由[`dgram.createSocket()`][]创建的。创建`dgram.Socket`实例不需要使用`new`关键字。

### Event: 'close'
<!-- YAML
added: v0.1.99
-->

`'close'`事件将在使用[`close()`][]关闭一个 socket 之后触发。该事件一旦触发，这个 socket 上将不会触发新的`'message'`事件。


### Event: 'error'
<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

当有任何错误发生时，`'error'`事件将被触发。事件发生时，回掉函数仅会接收到一个 Error 参数。


### Event: 'listening'
<!-- YAML
added: v0.1.99
-->

当一个 socket 开始监听数据包信息时，`'listening'`事件将被触发。该事件会在创建 UDP socket 之后被立即触发。


### Event: 'message'
<!-- YAML
added: v0.1.99
-->

当有新的数据包被 socket 接收时，`'message'`事件会被触发。`msg`和`rinfo`会作为参数传递到该事件的处理函数中。
* `msg` {Buffer} - 消息
* `rinfo` {Object} - 远程地址信息
  * `address` {string} 发送方地址 
  * `family` {string} 地址类型 (`'IPv4'` or `'IPv6'`)
  * `port` {number} The sender port
  * `size` {number} The message size


### socket.addMembership(multicastAddress[, multicastInterface])
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}, 可选的

通知内核将`multicastAddress`和`multicastInterface`提供的多路传送集合通过`IP_ADD_MEMBERSHIP`这个 socket 选项结合起来。若`multicastInterface`参数未指定，操作系统将会选择一个接口并向其添加成员。要为所有可用的接口添加成员，可以在每个接口上调用一次`addMembership`方法。


### socket.address()
<!-- YAML
added: v0.1.99
-->

返回一个包含 socket 地址信息的对象。对于 UDP socket，该对象将包含`address`、`family`和`port`属性。


### socket.bind([port][, address][, callback])
<!-- YAML
added: v0.1.99
-->

* `port` {number} - 整数，可选的
* `address` {string}, 可选的
* `callback` {Function} - (没有参数)，可选的。当绑定完成时会被调用。

对于 UDP socket，该方法会令`dgram.Socket`在指定的`port`和可选的`address`上监听数据包信息。若`port`未指定或为 `0`，操作系统会尝试绑定一个随机的端口。若`address`未指定，操作系统会尝试在所有地址上监听。绑定完成时会触发一个`'listening'`事件，并会调用`callback`方法。

注意，同时监听`'listening'`事件和在`socket.bind()`方法中传入`callback`参数并不会带来坏处，但也不是很有用。

一个被绑定的数据包 socket 会令 Node.js 进程保持运行以接收数据包信息。

若绑定失败，一个`'error'`事件会被触发。在极少数的情况下（例如尝试绑定一个已关闭的 socket），一个 [`Error`][] 会被抛出。

一个监听 41234 端口的 UDP 服务器的例子：

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`服务器异常：\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`服务器收到：${msg} 来自 ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`服务器监听 ${address.address}:${address.port}`);
});

server.bind(41234);
// 服务器监听 0.0.0.0:41234
```


### socket.bind(options[, callback])
<!-- YAML
added: v0.11.14
-->

* `options` {Object} - 必要的。包含以下属性：
  * `port` {number} - 可选的。
  * `address` {string} - 可选的。
  * `exclusive` {boolean} - 可选的。
* `callback` {Function} - 可选的。

对于 UDP socket，该方法会令`dgram.Socket`在指定的`port`和可选的`address`上监听数据包信息。若`port`未指定或为 `0`，操作系统会尝试绑定一个随机的端口。若`address`未指定，操作系统会尝试在所有地址上监听。绑定完成时会触发一个`'listening'`事件，并会调用`callback`方法。

Note that specifying both a `'listening'` event listener and passing a
`callback` to the `socket.bind()` method is not harmful but not very
useful.

在配合[`cluster`]模块使用`dgram.Socket`对象时，`options`对象可能包含一个附加的`exclusive`属性。当`exclusive`被设为`false`(默认值)时，集群工作单元会使用相同的 socket 句柄来共享连接处理作业。当`exclusive`被设为`true`时，该句柄将不会被共享，而尝试共享端口则会造成错误。

A bound datagram socket keeps the Node.js process running to receive
datagram messages.

If binding fails, an `'error'` event is generated. In rare case (e.g.
attempting to bind with a closed socket), an [`Error`][] may be thrown.

一个不共享端口的 socket 的例子如下文所示。


```js
socket.bind({
  address: 'localhost',
  port: 8000,
  exclusive: true
});
```


### socket.close([callback])
<!-- YAML
added: v0.1.99
-->

关闭该 socket 并停止监听其上的数据。如果提供了一个回调函数，它就相当于为[`'close'`][]事件添加了一个监听器。


### socket.dropMembership(multicastAddress[, multicastInterface])
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}, 可选的

引导内核通过`IP_DROP_MEMBERSHIP`这个 socket 选项删除`multicastAddress`指定的多路传送集合。当 socket 被关闭或进程被终止时，该方法会被内核自动调用，所以大多数的应用都不用自行调用该方法。

若`multicastInterface`未指定，操作系统会尝试删除所有可用接口上的成员。


### socket.ref()
<!-- YAML
added: v0.9.1
-->

By default, binding a socket will cause it to block the Node.js process from
exiting as long as the socket is open. The `socket.unref()` method can be used
to exclude the socket from the reference counting that keeps the Node.js
process active. The `socket.ref()` method adds the socket back to the reference
counting and restores the default behavior.

Calling `socket.ref()` multiples times will have no additional effect.

The `socket.ref()` method returns a reference to the socket so calls can be
chained.

### socket.send(msg, [offset, length,] port [, address] [, callback])
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11985
    description: The `msg` parameter can be an Uint8Array now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10473
    description: The `address` parameter is always optional now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5929
    description: On success, `callback` will now be called with an `error`
                 argument of `null` rather than `0`.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4374
    description: The `msg` parameter can be an array now. Also, the `offset`
                 and `length` parameters are optional now.
-->

* `msg` {Buffer|Uint8Array|string|array} 要发送的消息
* `offset` {number} 整数。可选。指定消息的开头在 buffer 中的偏移量。
* `length` {number} 整数。可选。消息的字节数。
* `port` {number} 整数。目标端口。
* `address` {string} 目标主机名或 IP 地址。可选的。
* `callback` {Function} 当消息被发送时会被调用。可选的。

在 socket 上发送一个数据包。目标`port`和`address`须被指定。

`msg`参数包含了要发送的消息。根据消息的类型可以有不同的做法。如果`msg`是一个`Buffer` 或 `Uint8Array`，则`offset`和`length`指定了消息在`Buffer`中对应的偏移量和字节数。如果`msg`是一个`String`，那么它会被自动地按照`utf8`编码转换为`Buffer`。对于包含了多字节字符的消息，`offset`和`length`会根据对应的[byte length][]进行计算，而不是根据字符的位置。如果`msg`是一个数组，那么`offset`和`length`必须都不能被指定。

`address`参数是一个字符串。若`address`的值是一个主机名，则 DNS 会被用来解析主机的地址。若`address`未提供或是非真值，则`'127.0.0.1'`（用于 `udp4` socket）或`'::1'`（用于 `udp6` socket）会被使用。

若在之前 socket 未通过调用`bind`方法进行绑定，socket 将会被一个随机的端口号赋值并绑定到“所有接口”的地址上（对于`udp4` socket 是`'0.0.0.0'`，对于`udp6` socket 是`'::0'`）。

可以指定一个可选的`callback`方法来汇报 DNS 错误或判断可以安全地重用`buf`对象的时机。注意，在 Node.js 事件循环中，DNS 查询会对发送造成至少 1 tick 的延迟。

确定数据包被发送的唯一方式就是指定`callback`。若在`callback`被指定的情况下有错误发生，该错误会作为`callback`的第一个参数。若`callback`未被指定，该错误会以`'error'`事件的方式投射到`socket`对象上。

偏移量和长度是可选的，但如其中一个被指定则另一个也必须被指定。另外，他们只在第一个参数是`Buffer` 或 `Uint8Array` 的情况下才能被使用。

一个发送 UDP 包到`localhost`上的某个随机端口的例子：

```js
const dgram = require('dgram');
const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.send(message, 41234, 'localhost', (err) => {
  client.close();
});
```

一个发送包含多个 buffer 的 UDP 包到 `127.0.0.1` 上的某个随机端口的例子：

```js
const dgram = require('dgram');
const buf1 = Buffer.from('Some ');
const buf2 = Buffer.from('bytes');
const client = dgram.createSocket('udp4');
client.send([buf1, buf2], 41234, (err) => {
  client.close();
});
```

发送多个 buffer 的速度取决于应用和操作系统。
It is important to run benchmarks to
determine the optimal strategy on a case-by-case basis. Generally speaking,
however, sending multiple buffers is faster.

**关于 UDP 包大小的注意事项**

`IPv4/v6`数据包的最大尺寸取决于`MTU`(_Maximum Transmission Unit_, 最大传输单元)与`Payload Length`字段大小。

- `Payload Length`字段有`16 位`宽，指一个超过 64K 的_包含_ IP 头部和数据的负载 (65,507 字节 = 65,535 − 8 字节 UDP 头 − 20 字节 IP 头部)；通常对于环回地址来说是这样，但这个长度的数据包对于大多数的主机和网络来说不切实际。

- `MTU`指的是数据链路层为数据包提供的最大大小。对于任意链路，`IPv4`所托管的`MTU`最小为`68`个字节，推荐为`576`（典型地，作为拨号上网应用的推荐值），无论它们是完整地还是分块地抵达。

  对于`IPv6`，`MTU`的最小值是`1280`个字节，然而，受托管的最小的碎片重组缓冲大小为`1500`个字节。现今大多数的数据链路层技术（如以太网），都有`1500`的`MTU`最小值，因而`68`个字节显得非常小。

要提前知道数据包可能经过的每个链路的 MTU 是不可能的。发送大于接受者`MTU`大小的数据包将不会起作用，因为数据包会被静默地丢失，而不会通知发送者该包未抵达目的地。


### socket.setBroadcast(flag)
<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

设置或清除 `SO_BROADCAST` socket 选项。当设置为 `true`, UDP包可能会被发送到一个本地接口的广播地址

### socket.setMulticastLoopback(flag)
<!-- YAML
added: v0.3.8
-->

* `flag` {boolean}

设置或清除 `IP_MULTICAST_LOOP` socket 选项。当设置为 `true`, 多播数据包也将在本地接口接收。



### socket.setMulticastTTL(ttl)
<!-- YAML
added: v0.3.8
-->

* `ttl` {number} Integer

Sets the `IP_MULTICAST_TTL` socket option.  While TTL generally stands for
"Time to Live", in this context it specifies the number of IP hops that a
packet is allowed to travel through, specifically for multicast traffic.  Each
router or gateway that forwards a packet decrements the TTL. If the TTL is
decremented to 0 by a router, it will not be forwarded.

The argument passed to to `socket.setMulticastTTL()` is a number of hops
between 0 and 255. The default on most systems is `1` but can vary.

### socket.setTTL(ttl)
<!-- YAML
added: v0.1.101
-->

* `ttl` {number} Integer

Sets the `IP_TTL` socket option. While TTL generally stands for "Time to Live",
in this context it specifies the number of IP hops that a packet is allowed to
travel through.  Each router or gateway that forwards a packet decrements the
TTL.  If the TTL is decremented to 0 by a router, it will not be forwarded.
Changing TTL values is typically done for network probes or when multicasting.

The argument to `socket.setTTL()` is a number of hops between 1 and 255.
The default on most systems is 64 but can vary.

### socket.unref()
<!-- YAML
added: v0.9.1
-->

By default, binding a socket will cause it to block the Node.js process from
exiting as long as the socket is open. The `socket.unref()` method can be used
to exclude the socket from the reference counting that keeps the Node.js
process active, allowing the process to exit even if the socket is still
listening.

Calling `socket.unref()` multiple times will have no addition effect.

The `socket.unref()` method returns a reference to the socket so calls can be
chained.

### Change to asynchronous `socket.bind()` behavior

As of Node.js v0.10, [`dgram.Socket#bind()`][] changed to an asynchronous
execution model. Legacy code that assumes synchronous behavior, as in the
following example:

```js
const s = dgram.createSocket('udp4');
s.bind(1234);
s.addMembership('224.0.0.114');
```

Must be changed to pass a callback function to the [`dgram.Socket#bind()`][]
function:

```js
const s = dgram.createSocket('udp4');
s.bind(1234, () => {
  s.addMembership('224.0.0.114');
});
```

## `dgram` module functions

### dgram.createSocket(options[, callback])
<!-- YAML
added: v0.11.13
changes:
  - version: REPLACEME
    pr-url: https://github.com/nodejs/node/pull/14560
    description: The `lookup` option is supported.
-->

* `options` {Object} Available options are:
  * `type` {string} The family of socket. Must be either `'udp4'` or `'udp6'`.
    Required.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the
    address, even if another process has already bound a socket on it. Optional.
    Defaults to `false`.
  * `lookup` {Function} Custom lookup function. Defaults to [`dns.lookup()`][].
    Optional.
* `callback` {Function} Attached as a listener for `'message'` events. Optional.
* Returns: {dgram.Socket}

Creates a `dgram.Socket` object. Once the socket is created, calling
[`socket.bind()`][] will instruct the socket to begin listening for datagram
messages. When `address` and `port` are not passed to  [`socket.bind()`][] the
method will bind the socket to the "all interfaces" address on a random port
(it does the right thing for both `udp4` and `udp6` sockets). The bound address
and port can be retrieved using [`socket.address().address`][] and
[`socket.address().port`][].

### dgram.createSocket(type[, callback])
<!-- YAML
added: v0.1.99
-->

* `type` {string} - Either 'udp4' or 'udp6'
* `callback` {Function} - Attached as a listener to `'message'` events.
  Optional
* Returns: {dgram.Socket}

Creates a `dgram.Socket` object of the specified `type`. The `type` argument
can be either `udp4` or `udp6`. An optional `callback` function can be passed
which is added as a listener for `'message'` events.

Once the socket is created, calling [`socket.bind()`][] will instruct the
socket to begin listening for datagram messages. When `address` and `port` are
not passed to  [`socket.bind()`][] the method will bind the socket to the "all
interfaces" address on a random port (it does the right thing for both `udp4`
and `udp6` sockets). The bound address and port can be retrieved using
[`socket.address().address`][] and [`socket.address().port`][].

[`'close'`]: #dgram_event_close
[`Error`]: errors.html#errors_class_error
[`EventEmitter`]: events.html
[`close()`]: #dgram_socket_close_callback
[`cluster`]: cluster.html
[`dgram.Socket#bind()`]: #dgram_socket_bind_options_callback
[`dgram.createSocket()`]: #dgram_dgram_createsocket_options_callback
[`dns.lookup()`]: dns.html#dns_dns_lookup_hostname_options_callback
[`socket.address().address`]: #dgram_socket_address
[`socket.address().port`]: #dgram_socket_address
[`socket.bind()`]: #dgram_socket_bind_port_address_callback
[byte length]: buffer.html#buffer_class_method_buffer_bytelength_string_encoding

