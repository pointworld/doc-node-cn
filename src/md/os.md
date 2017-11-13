# OS

> 稳定性: 2 - 稳定的

`os` 模块提供了一些操作系统相关的实用方法。可以这么引用它:

```js
const os = require('os');
```

## os.EOL
<!-- YAML
added: v0.7.8
-->

* {string}

一个字符串常量,定义操作系统相关的行末标志:

* `\n` 在 POSIX 系统上
* `\r\n` 在 Windows系统上


## os.arch()
<!-- YAML
added: v0.5.0
-->

* 返回: {string}

`os.arch()`方法返回一个字符串, 表明*Node.js 二进制编译* 所用的
操作系统CPU架构.

现在可能的值有: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`,
`'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, `'x64'`,  和
`'x86'`.

等价于 [`process.arch`][].


## os.constants
<!-- YAML
added: v6.3.0
-->

* {Object}

返回一个包含错误码,处理信号等通用的操作系统特定常量的对象.
现在, 这些特定的常量的定义被描述在[OS Constants][].


## os.cpus()
<!-- YAML
added: v6.3.0
-->

* {Object}

返回一个包含错误码,处理信号等通用的操作系统特定常量的对象.
现在, 这些特定的常量的定义被描述在[OS Constants][].


## os.endianness()
<!-- YAML
added: v0.9.4
-->

* Returns: {string}

`os.endianness()`方法返回一个字符串,表明*Node.js二进制编译环境的*字节顺序.

可能的值:

* `'BE'` 大端模式
* `'LE'` 小端模式



## os.freemem()
<!-- YAML
added: v0.3.3
-->

* Returns: {integer}

`os.freemem()` 方法以整数的形式回空闲系统内存
的字节数.



## os.homedir()
<!-- YAML
added: v2.3.0
-->

* Returns: {string}

`os.homedir()` 方法以字符串的形式返回当前用户的home目录.


## os.hostname()
<!-- YAML
added: v2.3.0
-->

* Returns: {string}

`os.homedir()` 方法以字符串的形式返回当前用户的home目录.



## os.loadavg()
<!-- YAML
added: v2.3.0
-->

* Returns: {string}

`os.homedir()` 方法以字符串的形式返回当前用户的home目录.


## os.networkInterfaces()
<!-- YAML
added: v0.6.0
-->

* Returns: {Object}

`os.networkInterfaces()`方法返回一个对象,包含只有被赋予网络地址的网络接口. 

在返回对象的每个关键词都指明了一个网络接口.

返回的值是一个对象数组, 每个都描述了赋予的网络地址.

被赋予网络地址的对象包含的属性:

* `address` {string} 被赋予的 IPv4 或 IPv6 地址
* `netmask` {string}  IPv4 或 IPv6 子网掩码
* `family` {string}  `IPv4` 或 `IPv6`
* `mac` {string} 网络接口的MAC地址
* `internal` {boolean} 如果 网络接口是loopback或相似的远程不能用的接口时,
值为`true`,否则为`false`
* `scopeid` {number} IPv6 数字领域识别码 (只有当 `family`
是`IPv6`时可用)

<!-- eslint-skip -->
```js
{
  lo: [
    {
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true
    },
    {
      address: '::1',
      netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      family: 'IPv6',
      mac: '00:00:00:00:00:00',
      internal: true
    }
  ],
  eth0: [
    {
      address: '192.168.1.108',
      netmask: '255.255.255.0',
      family: 'IPv4',
      mac: '01:02:03:0a:0b:0c',
      internal: false
    },
    {
      address: 'fe80::a00:27ff:fe4e:66a1',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '01:02:03:0a:0b:0c',
      internal: false
    }
  ]
}
```



## os.platform()
<!-- YAML
added: v0.6.0
-->

* Returns: {Object}

`os.networkInterfaces()`方法返回一个对象,包含只有被赋予网络地址的网络接口. 

在返回对象的每个关键词都指明了一个网络接口.

返回的值是一个对象数组, 每个都描述了赋予的网络地址.

被赋予网络地址的对象包含的属性:

* `address` {string} 被赋予的 IPv4 或 IPv6 地址
* `netmask` {string}  IPv4 或 IPv6 子网掩码
* `family` {string}  `IPv4` 或 `IPv6`
* `mac` {string} 网络接口的MAC地址
* `internal` {boolean} 如果 网络接口是loopback或相似的远程不能用的接口时,
值为`true`,否则为`false`
* `scopeid` {number} IPv6 数字领域识别码 (只有当 `family`
是`IPv6`时可用)

<!-- eslint-skip -->
```js
{
  lo: [
    {
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true
    },
    {
      address: '::1',
      netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      family: 'IPv6',
      mac: '00:00:00:00:00:00',
      internal: true
    }
  ],
  eth0: [
    {
      address: '192.168.1.108',
      netmask: '255.255.255.0',
      family: 'IPv4',
      mac: '01:02:03:0a:0b:0c',
      internal: false
    },
    {
      address: 'fe80::a00:27ff:fe4e:66a1',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '01:02:03:0a:0b:0c',
      internal: false
    }
  ]
}
```


## os.release()
<!-- YAML
added: v0.3.3
-->

* Returns: {string}

`os.release()`方法返回一个字符串, 指定操作系统的发行版.

*注意*: 在POSIX系统上, 操作系统发行版是通过
调用uname(3)得到的. 在 Windows系统上, 用`GetVersionExW()` . 请查看
https://en.wikipedia.org/wiki/Uname#Examples 获取更多信息.


## os.tmpdir()
<!-- YAML
added: v0.9.9
changes:
  - version: v2.0.0
    pr-url: https://github.com/nodejs/node/pull/747
    description: This function is now cross-platform consistent and no longer
                 returns a path with a trailing slash on any platform
-->

* Returns: {string}

`os.tmpdir()`方法返回一个字符串, 表明操作系统的
默认临时文件目录.


## os.totalmem()
<!-- YAML
added: v0.3.3
-->

* Returns: {integer}

`os.totalmem()`方法以整数的形式返回所有系统内存的字节数.


## os.type()
<!-- YAML
added: v0.3.3
-->

* Returns: {string}

`os.type()`方法返回一个字符串,表明操作系统的名字,
由uname(3)返回.举个例子, `'Linux'` 在 Linux系统上, `'Darwin'` 在 macOS 系统上,`'Windows_NT'` 在 Windows系统上.

请查看https://en.wikipedia.org/wiki/Uname#Examples 获取其他关于在不同
操作系统上执行uname(3),得到输出的信息.


## os.uptime()
<!-- YAML
added: v0.3.3
-->

* Returns: {integer}

`os.uptime()` 方法在几秒内返回操作系统的上线时间.

*Note*: On Windows the returned value includes fractions of a second.
Use `Math.floor()` to get whole seconds.

## os.userInfo([options])
<!-- YAML
added: v0.3.3
-->

* Returns: {integer}

`os.uptime()` 方法在几秒内返回操作系统的上线时间.

*Note*: On Windows the returned value includes fractions of a second.
Use `Math.floor()` to get whole seconds.

## OS Constants
<!-- YAML
added: v6.3.0
-->

* {Object}

返回一个包含错误码,处理信号等通用的操作系统特定常量的对象.
现在, 这些特定的常量的定义被描述在[OS Constants][].



### Signal Constants
<!-- YAML
added: v6.3.0
-->

* {Object}

返回一个包含错误码,处理信号等通用的操作系统特定常量的对象.
现在, 这些特定的常量的定义被描述在[OS Constants][].


### Error Constants

下面的错误常量由 `os.constants.errno` 给出:

#### POSIX Error Constants

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>E2BIG</code></td>
    <td>表明参数列表比期望的要长.</td>
  </tr>
  <tr>
    <td><code>EACCES</code></td>
    <td>表明操作没有足够的权限.</td>
  </tr>
  <tr>
    <td><code>EADDRINUSE</code></td>
    <td>表明该网络地址已经在使用.</td>
  </tr>
  <tr>
    <td><code>EADDRNOTAVAIL</code></td>
    <td>表明该网络地址当前不能使用.</td>
  </tr>
  <tr>
    <td><code>EAFNOSUPPORT</code></td>
    <td>表明该网络地址簇不被支持.</td>
  </tr>
  <tr>
    <td><code>EAGAIN</code></td>
    <td>表明当前没有可用数据,稍后再次尝试操作.</td>
  </tr>
  <tr>
    <td><code>EALREADY</code></td>
    <td>表明socket有一个即将发生的连接在进行中.</td>
  </tr>
  <tr>
    <td><code>EBADF</code></td>
    <td>表明一个文件描述符不可用.</td>
  </tr>
  <tr>
    <td><code>EBADMSG</code></td>
    <td>表明一个无效的数据信息.</td>
  </tr>
  <tr>
    <td><code>EBUSY</code></td>
    <td>表明一个设备或资源处于忙碌中.</td>
  </tr>
  <tr>
    <td><code>ECANCELED</code></td>
    <td>表明一个操作被取消.</td>
  </tr>
  <tr>
    <td><code>ECHILD</code></td>
    <td>表明没有子进程.</td>
  </tr>
  <tr>
    <td><code>ECONNABORTED</code></td>
    <td>表明网络连接已经被终止.</td>
  </tr>
  <tr>
    <td><code>ECONNREFUSED</code></td>
    <td>表明网络连接被拒绝.</td>
  </tr>
  <tr>
    <td><code>ECONNRESET</code></td>
    <td>表明网络连接被重置 .</td>
  </tr>
  <tr>
    <td><code>EDEADLK</code></td>
    <td>表明一个资源死锁已经被避免 .</td>
  </tr>
  <tr>
    <td><code>EDESTADDRREQ</code></td>
    <td>表明需要目的地址 .</td>
  </tr>
  <tr>
    <td><code>EDOM</code></td>
    <td>表明参数超过了函数的作用域 .</td>
  </tr>
  <tr>
    <td><code>EDQUOT</code></td>
    <td>表明已经超过磁盘指标 .</td>
  </tr>
  <tr>
    <td><code>EEXIST</code></td>
    <td>表明文件已经存在 .</td>
  </tr>
  <tr>
    <td><code>EFAULT</code></td>
    <td>表明一个无效的指针地址 .</td>
  </tr>
  <tr>
    <td><code>EFBIG</code></td>
    <td>表明文件太大 .</td>
  </tr>
  <tr>
    <td><code>EHOSTUNREACH</code></td>
    <td>表明主机不可达 .</td>
  </tr>
  <tr>
    <td><code>EIDRM</code></td>
    <td>表明识别码已经被移除 .</td>
  </tr>
  <tr>
    <td><code>EILSEQ</code></td>
    <td>表明一个非法的字节序 .</td>
  </tr>
  <tr>
    <td><code>EINPROGRESS</code></td>
    <td>表明一个操作已经在进行中 .</td>
  </tr>
  <tr>
    <td><code>EINTR</code></td>
    <td>表明一个函数调用被中断 .</td>
  </tr>
  <tr>
    <td><code>EINVAL</code></td>
    <td>表明提供了一个无效的参数 .</td>
  </tr>
  <tr>
    <td><code>EIO</code></td>
    <td>表明一个其他的不确定的 I/O 错误.</td>
  </tr>
  <tr>
    <td><code>EISCONN</code></td>
    <td>表明socket已经连接 .</td>
  </tr>
  <tr>
    <td><code>EISDIR</code></td>
    <td>表明路径是目录 .</td>
  </tr>
  <tr>
    <td><code>ELOOP</code></td>
    <td>表明路径上有太多层次的符号连接 .</td>
  </tr>
  <tr>
    <td><code>EMFILE</code></td>
    <td>表明有太多打开的文件 .</td>
  </tr>
  <tr>
    <td><code>EMLINK</code></td>
    <td>表明文件上有太多的硬连接 .</td>
  </tr>
  <tr>
    <td><code>EMSGSIZE</code></td>
    <td>表明提供的信息太长 .</td>
  </tr>
  <tr>
    <td><code>EMULTIHOP</code></td>
    <td>表明多跳被尝试 .</td>
  </tr>
  <tr>
    <td><code>ENAMETOOLONG</code></td>
    <td>表明文件名太长 .</td>
  </tr>
  <tr>
    <td><code>ENETDOWN</code></td>
    <td>表明网络关闭 .</td>
  </tr>
  <tr>
    <td><code>ENETRESET</code></td>
    <td>表明连接被网络终止 .</td>
  </tr>
  <tr>
    <td><code>ENETUNREACH</code></td>
    <td>表明网络不可达 .</td>
  </tr>
  <tr>
    <td><code>ENFILE</code></td>
    <td>表明系统中打开了太多的文件 .</td>
  </tr>
  <tr>
    <td><code>ENOBUFS</code></td>
    <td>表明没有有效的缓存空间 .</td>
  </tr>
  <tr>
    <td><code>ENODATA</code></td>
    <td>表明在流头读取队列上没有可用的信息 .</td>
  </tr>
  <tr>
    <td><code>ENODEV</code></td>
    <td>表明没有这样的设备 .</td>
  </tr>
  <tr>
    <td><code>ENOENT</code></td>
    <td>表明没有这样的文件或目录 .</td>
  </tr>
  <tr>
    <td><code>ENOEXEC</code></td>
    <td>表明一个执行格式错误 .</td>
  </tr>
  <tr>
    <td><code>ENOLCK</code></td>
    <td>表明没有可用的锁 .</td>
  </tr>
  <tr>
    <td><code>ENOLINK</code></td>
    <td>表明链接在服务 .</td>
  </tr>
  <tr>
    <td><code>ENOMEM</code></td>
    <td>表明没有足够的空间 .</td>
  </tr>
  <tr>
    <td><code>ENOMSG</code></td>
    <td>表明想要的数据类型没有信息 .</td>
  </tr>
  <tr>
    <td><code>ENOPROTOOPT</code></td>
    <td>表明给定的协议不可用 .</td>
  </tr>
  <tr>
    <td><code>ENOSPC</code></td>
    <td>表明该设备上没有可用的空间 .</td>
  </tr>
  <tr>
    <td><code>ENOSR</code></td>
    <td>表明没有可用的流资源 .</td>
  </tr>
  <tr>
    <td><code>ENOSTR</code></td>
    <td>表明给定的资源不是流 .</td>
  </tr>
  <tr>
    <td><code>ENOSYS</code></td>
    <td>表明功能没有被实现 .</td>
  </tr>
  <tr>
    <td><code>ENOTCONN</code></td>
    <td>表明socket没有连接 .</td>
  </tr>
  <tr>
    <td><code>ENOTDIR</code></td>
    <td>表明路径不是目录 .</td>
  </tr>
  <tr>
    <td><code>ENOTEMPTY</code></td>
    <td>表明目录是非空的 .</td>
  </tr>
  <tr>
    <td><code>ENOTSOCK</code></td>
    <td>表明给定的项目不是socket .</td>
  </tr>
  <tr>
    <td><code>ENOTSUP</code></td>
    <td>表明给定的操作不受支持 .</td>
  </tr>
  <tr>
    <td><code>ENOTTY</code></td>
    <td>表明一个不适当的 I/O 控制操作.</td>
  </tr>
  <tr>
    <td><code>ENXIO</code></td>
    <td>表明没有该设备或地址 .</td>
  </tr>
  <tr>
    <td><code>EOPNOTSUPP</code></td>
    <td>表明一个操作不被socket所支持.
    注意尽管`ENOTSUP` 和 `EOPNOTSUPP` 在Linux上有相同的值时,
    根据 POSIX.1 规范,这些错误值应该不同.)</td>
  </tr>
  <tr>
    <td><code>EOVERFLOW</code></td>
    <td>表明一个值太大以至于难以用给定的数据类型存储.</td>
  </tr>
  <tr>
    <td><code>EPERM</code></td>
    <td>表明操作没有被许可.</td>
  </tr>
  <tr>
    <td><code>EPIPE</code></td>
    <td>表明破裂的管道 .</td>
  </tr>
  <tr>
    <td><code>EPROTO</code></td>
    <td>表明协议错误 .</td>
  </tr>
  <tr>
    <td><code>EPROTONOSUPPORT</code></td>
    <td>表明一个协议不被支持 .</td>
  </tr>
  <tr>
    <td><code>EPROTOTYPE</code></td>
    <td>表明socket错误的协议类型 .</td>
  </tr>
  <tr>
    <td><code>ERANGE</code></td>
    <td>表明结果太大了 .</td>
  </tr>
  <tr>
    <td><code>EROFS</code></td>
    <td>表明该文件系统是只读的 .</td>
  </tr>
  <tr>
    <td><code>ESPIPE</code></td>
    <td>表明无效的查询操作 .</td>
  </tr>
  <tr>
    <td><code>ESRCH</code></td>
    <td>表明没有这样的进程.</td>
  </tr>
  <tr>
    <td><code>ESTALE</code></td>
    <td>表明该文件处理是稳定的 .</td>
  </tr>
  <tr>
    <td><code>ETIME</code></td>
    <td>表明一个过期的时钟 .</td>
  </tr>
  <tr>
    <td><code>ETIMEDOUT</code></td>
    <td>表明该连接超时 .</td>
  </tr>
  <tr>
    <td><code>ETXTBSY</code></td>
    <td>表明一个文本文件处于忙碌 .</td>
  </tr>
  <tr>
    <td><code>EWOULDBLOCK</code></td>
    <td>表明该操作被屏蔽 .</td>
  </tr>
  <tr>
    <td><code>EXDEV</code></td>
    <td>表明一个不合适的连接 .
  </tr>
</table>


### libuv Constants

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>UV_UDP_REUSEADDR</code></td>
    <td></td>
  </tr>
</table>

[`process.arch`]: process.html#process_process_arch
[`process.platform`]: process.html#process_process_platform
[OS Constants]: #os_os_constants
