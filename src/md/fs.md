# File System

> 稳定性: 2

<!--name=fs-->

## 简介

### 文件

* 文件定义：计算机文件是以计算机硬盘为载体存储在计算机上的信息集合

* 文件组成：基本信息（文件名，扩展名/类型，大小，描述，路径，创建时间，修改时间，访问时间，状态，模式，权限） + 内容

* 文件分类：

* 单个文件操作：

   * 文件（创建，复制，删除，移动，打开，修改，关闭，监视） 
    
   * 文件信息（重命名，更改扩展名/类型） 
    
   * 文件内容（增删查改，压缩，解压，加密，解密，格式转换，编码，解码） 
    
   * 文件流（读，取，写）
    
* 批量文件操作：


### 文件夹

### 文件系统


### fs 模块

fs 模块是对标准 POSIX 函数的简单封装。
> 引入模块： `require('fs')`

所有的方法都有异步和同步的形式。

异步方法的最后一个参数都是一个回调函数。
传给回调函数的参数取决于具体方法，但回调函数的第一个参数都会保留给异常。
如果操作成功完成，则第一个参数会是 `null` 或 `undefined`。

当使用同步方法时，任何异常都会被立即抛出。
可以使用 `try`/`catch` 来处理异常，或让异常向上冒泡。

异步方法的例子：

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log('成功删除 /tmp/hello');
});
```

同步方法的例子：

```js
const fs = require('fs');

fs.unlinkSync('/tmp/hello');
console.log('成功删除 /tmp/hello');
```

异步的方法不能保证执行顺序。
所以下面的例子可能会出错：

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  console.log('重命名完成');
});
fs.stat('/tmp/world', (err, stats) => {
  if (err) throw err;
  console.log(`文件属性: ${JSON.stringify(stats)}`);
});
```

`fs.stat` 可能在 `fs.rename` 之前执行。
正确的方法是把回调链起来。

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`文件属性: ${JSON.stringify(stats)}`);
  });
});
```

在繁忙的进程中，建议使用异步的方法。
同步的方法会阻塞整个进程，直到完成（停止所有连接）。

可以使用文件名的相对路径。
路径是相对 `process.cwd()` 的。

大多数 fs 函数可以省略回调函数，在这种情况下，会使用默认的回调函数。
若要追踪最初的调用点，可设置 `NODE_DEBUG` 环境变量：

注意：不建议省略异步方法的回调函数，未来的版本可能会导致抛出错误。

```txt
$ cat script.js
function bad() {
  require('fs').readFile('/');
}
bad();

$ env NODE_DEBUG=fs node script.js
fs.js:88
        throw backtrace;
        ^
Error: EISDIR: illegal operation on a directory, read
    <stack trace.>
```

注意：在 Windows 上 `Node.js` 遵循单驱动器工作目录的理念。
当使用驱动器路径且不带反斜杠时就能体验到该特征。
例如，`fs.readdirSync('c:\\')` 可能返回与 `fs.readdirSync('c:')` 不同的结果。
详见 [MSDN 路径文档]。

## Threadpool Usage

Note that all file system APIs except `fs.FSWatcher()` and those that are
explicitly synchronous use libuv's threadpool, which can have surprising and
negative performance implications for some applications, see the
[`UV_THREADPOOL_SIZE`][] documentation for more information.

## WHATWG URL object support
<!-- YAML
added: v7.6.0
-->

> 稳定性: 1 

对于大多数 `fs` 模块的函数， `path` 或者 `filename` 参数可以当作一个 WHATWG [`URL`][] 对象传入。
只有 [`URL`][] 对象使用被支持的 `file:` 协议。

```js
const fs = require('fs');
const { URL } = require('url');
const fileUrl = new URL('file:///tmp/hello');

fs.readFileSync(fileUrl);
```

*注意*： `file:` URLS 必须是绝对路径。

使用 WHATWG [`URL`][] 对象在不同的平台会有特定的行为。

在 Windows 上， 携带主机名的 `file:` URLs 被转换为 UNC 路径， 而有硬盘盘符的 `file:` URLs 会被转换成
本地绝对路径。既没有主机名，也没有盘符的 `file:` URLs 在转换时会抛出错误。

```js
// 在Windows上 :

// - WHATWG标准的URLs会将携带主机名的 file: 转换为 UNC 路径
// file://hostname/p/a/t/h/file => \\hostname\p\a\t\h\file
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));

// - WHATWG标准的URLs会将携带本地磁盘盘符的 file: 转换为 绝对路径
// file:///C:/tmp/hello => C:\tmp\hello
fs.readFileSync(new URL('file:///C:/tmp/hello'));

// - WHATWG标准的URLs在转换内容时，如果不携带主机名，则必须包含本地磁盘盘符
fs.readFileSync(new URL('file:///notdriveletter/p/a/t/h/file'));
fs.readFileSync(new URL('file:///c/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must be absolute
```

*注意*： 携带盘符的 `file:` URLs 必须使用 `:` 作为盘符后的分隔符。使用其他符号会抛出错误。

在其他所有的平台上， 都不支持携带主机名的 `file:` URLs，且会抛出错误。 

```js
// On other platforms:

// - WHATWG file URLs with hostname are unsupported
// file://hostname/p/a/t/h/file => throw!
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: must be absolute

// - WHATWG file URLs convert to absolute path
// file:///tmp/hello => /tmp/hello
fs.readFileSync(new URL('file:///tmp/hello'));
```

当 `file:` URL 包含已经编码的斜线符号会在所有平台抛出错误。

```js
// On Windows
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */

// On POSIX
fs.readFileSync(new URL('file:///p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
/ characters */
```

在 Windows 上， 携带已编码的反斜线 `file:` URLs 在编码是会抛出错误。

```js
// On Windows
fs.readFileSync(new URL('file:///C:/path/%5C'));
fs.readFileSync(new URL('file:///C:/path/%5c'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */
```


## Buffer API
<!-- YAML
added: v6.0.0
-->

`fs` 函数支持传递和接收字符串路径与 Buffer 路径。
后者的目的是使其可以在允许非 UTF-8 文件名的文件系统中工作。
对于大多数普通用途，使用 Buffer 路径是不必要的，因为字符串 API 会自动与 UTF-8 相互转换。

**注意**，在某些文件系统（如 NTFS 和 HFS+），文件名总是被编码为 UTF-8。
在这些文件系统中，传入非 UTF-8 编码的 Buffer 到 `fs` 函数将无法像预期那样工作。


## Class: fs.FSWatcher
<!-- YAML
added: v0.5.8
-->

从 [`fs.watch()`] 返回的对象是该类型。

提供给 `fs.watch()` 的 `listener` 回调会接收返回的 FSWatcher 的 `change` 事件。

该对象本身可触发以下事件：


### Event: 'change'
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} fs 变化的类型
* `filename` {string|Buffer} 变化的文件名（如果是相关的/可用的）

当一个被监视的目录或文件有变化时触发。
详见 [`fs.watch()`]。

`filename` 参数可能不会被提供，这依赖于操作系统支持。
如果提供了 `filename`，则若 `fs.watch()` 被调用时 `encoding` 选项被设置为 `'buffer'` 则它会是一个 `Buffer`，否则 `filename` 是一个字符串。

```js
// 例子，处理 fs.watch 监听器
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // 输出: <Buffer ...>
  }
});
```


### Event: 'error'
<!-- YAML
added: v0.5.8
-->

* `error` {Error}

当发生错误时触发。


### watcher.close()
<!-- YAML
added: v0.1.93
-->

当 `ReadStream` 底层的文件描述符已被使用 `fs.close()` 方法关闭时触发。


## Class: fs.ReadStream
<!-- YAML
added: v0.1.93
-->

`ReadStream` 是一个[可读流]。


### Event: 'close'
<!-- YAML
added: v0.1.93
-->

Emitted when the `ReadStream`'s underlying file descriptor has been closed
using the `fs.close()` method.

### Event: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} 被 ReadStream 使用的整数文件描述符。

当 ReadStream 文件被打开时触发。


### readStream.bytesRead
<!-- YAML
added: 6.4.0
-->

已读取的字节数。


### readStream.path
<!-- YAML
added: v0.1.93
-->

流正在读取的文件的路径，指定在 `fs.createReadStream()` 的第一个参数。
如果 `path` 传入的是一个字符串，则 `readStream.path` 是一个字符串。
如果 `path` 传入的是一个 `Buffer`，则 `readStream.path` 是一个 `Buffer`。


## Class: fs.Stats
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

从 [`fs.stat()`]、[`fs.lstat()`] 和 [`fs.fstat()`] 及其同步版本返回的对象都是该类型。

 - `stats.isFile()`
 - `stats.isDirectory()`
 - `stats.isBlockDevice()`
 - `stats.isCharacterDevice()`
 - `stats.isSymbolicLink()` (仅对 [`fs.lstat()`] 有效)
 - `stats.isFIFO()`
 - `stats.isSocket()`

对于一个普通文件，[`util.inspect(stats)`] 会返回一个类似如下的字符串：

```console
Stats {
  dev: 2114,
  ino: 48064969,
  mode: 33188,
  nlink: 1,
  uid: 85,
  gid: 100,
  rdev: 0,
  size: 527,
  blksize: 4096,
  blocks: 8,
  atimeMs: 1318289051000.1,
  mtimeMs: 1318289051000.1,
  ctimeMs: 1318289051000.1,
  birthtimeMs: 1318289051000.1,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
  birthtime: Mon, 10 Oct 2011 23:24:11 GMT }
```

*注意*: `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` 是以单位为毫秒保存相对应时间的数字 [numbers][MDN-Number].
他们的精度由所在的平台决定. `atime`, `mtime`, `ctime` 以及 `birthtime` 是表示各个时间的日期对象 `[Date][MDN-Date]`.
`Date` 与 数值并没有关联. 对数值进行重新赋值, 或者改变 `Date` 的值, 不会反映到相对应的表示中.





### Stat Time Values

stat 对象中的时间有以下语义：

* `atime` "访问时间" - 文件数据最近被访问的时间。
  会被 mknod(2)、 utimes(2) 和 read(2) 系统调用改变。
* `mtime` "修改时间" - 文件数据最近被修改的时间。
  会被 mknod(2)、 utimes(2) 和 write(2) 系统调用改变。
* `ctime` "变化时间" - 文件状态最近更改的时间（修改索引节点数据）
  会被 chmod(2)、 chown(2)、 link(2)、 mknod(2)、 rename(2)、 unlink(2)、 utimes(2)、 read(2) 和 write(2) 系统调用改变。
* `birthtime` "创建时间" -  文件创建的时间。
  当文件被创建时设定一次。
  在创建时间不可用的文件系统中，该字段可能被替代为 `ctime` 或 `1970-01-01T00:00Z`（如 Unix 的纪元时间戳 `0`）。
  注意，该值在此情况下可能会大于 `atime` 或 `mtime`。
  在 Darwin 和其它的 FreeBSD 衍生系统中，如果 `atime` 被使用 utimes(2) 系统调用显式地设置为一个比当前 `birthtime` 更早的值，也会有这种情况。

在 Node.js v0.12 之前的版本中，`ctime` 在 Windows 系统中保存 `birthtime`。
注意，在 v0.12 中，`ctime` 不是“创建时间”，并且在 Unix 系统中，它从来都不是。


## Class: fs.WriteStream
<!-- YAML
added: v0.1.93
-->

`WriteStream` is a [Writable Stream][].

### Event: 'close'
<!-- YAML
added: v0.1.93
-->

Emitted when the `WriteStream`'s underlying file descriptor has been closed
using the `fs.close()` method.

### Event: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Integer file descriptor used by the WriteStream.

Emitted when the WriteStream's file is opened.

### writeStream.bytesWritten
<!-- YAML
added: v0.4.7
-->

已写入的字节数。
不包括仍在排队等待写入的数据。


### writeStream.path
<!-- YAML
added: v0.1.93
-->

流正在写入的文件的路径，指定在 `fs.createWriteStream()` 的第一个参数。
如果 `path` 传入的是一个字符串，则 `writeStream.path` 是一个字符串。
如果 `path` 传入的是一个 `Buffer`，则 `writeStream.path` 是一个 `Buffer`。


## fs.access(path[, mode], callback)
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6534
    description: The constants like `fs.R_OK`, etc which were present directly
                 on `fs` were moved into `fs.constants` as a soft deprecation.
                 Thus for Node `< v6.3.0` use `fs` to access those constants, or
                 do something like `(fs.constants || fs).R_OK` to work with all
                 versions.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`
* `callback` {Function}

测试 `path` 指定的文件或目录的用户权限。
`mode` 是一个可选的整数，指定要执行的可访问性检查。
以下常量定义了 `mode` 的可能值。
可以创建由两个或更多个值的位或组成的掩码。

- `fs.constants.F_OK` - `path` 文件对调用进程可见。
这在确定文件是否存在时很有用，但不涉及 `rwx` 权限。
如果没指定 `mode`，则默认为该值。
- `fs.constants.R_OK` - `path` 文件可被调用进程读取。
- `fs.constants.W_OK` - `path` 文件可被调用进程写入。
- `fs.constants.X_OK` - `path` 文件可被调用进程执行。
对 Windows 系统没作用（相当于 `fs.constants.F_OK`）。

最后一个参数 `callback` 是一个回调函数，会带有一个可能的错误参数被调用。
如果可访问性检查有任何的失败，则错误参数会被传入。
下面的例子会检查 `/etc/passwd` 文件是否可以被当前进程读取和写入。

```js
fs.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK, (err) => {
  console.log(err ? 'no access!' : 'can read/write');
});
```

不建议在调用 `fs.open()` 、 `fs.readFile()` 或 `fs.writeFile()` 之前使用 `fs.access()` 检查一个文件的可访问性。
如此处理会造成紊乱情况，因为其他进程可能在两个调用之间改变该文件的状态。
作为替代，用户代码应该直接打开/读取/写入文件，当文件无法访问时再处理错误。

例子：


**写入（不推荐）**

```js
fs.access('myfile', (err) => {
  if (!err) {
    console.error('myfile already exists');
    return;
  }

  fs.open('myfile', 'wx', (err, fd) => {
    if (err) throw err;
    writeMyData(fd);
  });
});
```

**写入（推荐）**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile already exists');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**读取（不推荐）**

```js
fs.access('myfile', (err) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
      return;
    }

    throw err;
  }

  fs.open('myfile', 'r', (err, fd) => {
    if (err) throw err;
    readMyData(fd);
  });
});
```

**读取（推荐）**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

以上**不推荐**的例子检查可访问性之后再使用文件；
**推荐**的例子更好，因为它们直接使用文件并处理任何错误。

通常，仅在文件不会被直接使用时才检查一个文件的可访问性，例如当它的可访问性是来自另一个进程的信号。



## fs.accessSync(path[, mode])
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`

[`fs.access()`] 的同步版本。
如果有任何可访问性检查失败则抛出错误，否则什么也不做。


## fs.appendFile(file, data[, options], callback)
<!-- YAML
added: v0.6.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|number} 文件名或文件描述符
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} 默认为 `'utf8'`
  * `mode` {integer} 默认为 `0o666`
  * `flag` {string} 默认为 `'a'`
* `callback` {Function}

异步地追加数据到一个文件，如果文件不存在则创建文件。
`data` 可以是一个字符串或 buffer。

例子：

```js
fs.appendFile('message.txt', 'data to append', (err) => {
  if (err) throw err;
  console.log('The "data to append" was appended to file!');
});
```

如果 `options` 是一个字符串，则它指定了字符编码。例如：

```js
fs.appendFile('message.txt', 'data to append', 'utf8', callback);
```

任何指定的文件描述符必须为了追加而被打开。

注意：如果文件描述符被指定为 `file`，则不会被自动关闭。



## fs.appendFileSync(file, data[, options])
<!-- YAML
added: v0.6.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|number} 文件名或文件描述符
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} 默认为 `'utf8'`
  * `mode` {integer} 默认为 `0o666`
  * `flag` {string} 默认为 `'a'`

[`fs.appendFile()`] 的同步版本。
返回 `undefined`。


## fs.chmod(path, mode, callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer}
* `callback` {Function}

异步的 chmod(2)。
完成回调只有一个可能的异常参数。


## fs.chmodSync(path, mode)
<!-- YAML
added: v0.6.7
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer}

同步的 chmod(2)。返回 `undefined`。

## fs.chown(path, uid, gid, callback)
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}

异步的 chown(2)。
完成回调只有一个可能的异常参数。

## fs.chownSync(path, uid, gid)
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}

Synchronous chown(2). Returns `undefined`.

## fs.close(fd, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `callback` {Function}

Asynchronous close(2).  No arguments other than a possible exception are given
to the completion callback.

## fs.closeSync(fd)
<!-- YAML
added: v0.1.21
-->

* `fd` {integer}

Synchronous close(2). Returns `undefined`.

## fs.constants

返回一个包含常用文件系统操作的常量的对象。
具体的常量定义在 [FS Constants] 中描述。



## fs.createReadStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `flags` {string}
  * `encoding` {string}
  * `fd` {integer}
  * `mode` {integer}
  * `autoClose` {boolean}
  * `start` {integer}
  * `end` {integer}

返回一个新建的 [`ReadStream`] 对象（详见[可读流]）。

不同于在一个可读流上设置的 `highWaterMark` 默认值（16 kb），该方法在相同参数下返回的流具有 64 kb 的默认值。

`options` 是一个带有以下默认值的对象或字符串：

```js
const defaults = {
  flags: 'r',
  encoding: null,
  fd: null,
  mode: 0o666,
  autoClose: true
};
```

`options` 可以包括 `start` 和 `end` 值，使其可以从文件读取一定范围的字节而不是整个文件。
`start` 和 `end` 都是包括在内的，并且起始值是 0。
如果指定了 `fd` 且 `start` 不传或为 `undefined`，则 `fs.createReadStream()` 从当前文件位置按顺序地读取。
`encoding` 可以是任何可以被 [`Buffer`] 接受的值。

如果指定了 `fd`，则 `ReadStream` 会忽略 `path` 参数并且会使用指定的文件描述符。
这意味着不会触发 `'open'` 事件。
注意，`fd` 应该是阻塞的；非阻塞的 `fd` 们应该传给 [`net.Socket`]。

如果 `autoClose` 为 `false`，则文件描述符不会被关闭，即使有错误。
应用程序需要负责关闭它，并且确保没有文件描述符泄漏。
如果 `autoClose` 被设置为 `true`（默认），则在 `error` 或 `end` 时，文件描述符会被自动关闭。

`mode` 用于设置文件模式（权限和粘结位），但仅限创建文件时。

例子，从一个 100 字节长的文件中读取最后 10 个字节：

```js
fs.createReadStream('sample.txt', { start: 90, end: 99 });
```

如果 `options` 是一个字符串，则它指定了字符编码。


## fs.createWriteStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.5.0
    pr-url: https://github.com/nodejs/node/pull/3679
    description: The `autoClose` option is supported now.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `flags` {string}
  * `defaultEncoding` {string}
  * `fd` {integer}
  * `mode` {integer}
  * `autoClose` {boolean}
  * `start` {integer}

返回一个新建的 [`WriteStream`] 对象（详见[可写流]）。

`options` 是一个带有以下默认值的对象或字符串：

```js
const defaults = {
  flags: 'w',
  defaultEncoding: 'utf8',
  fd: null,
  mode: 0o666,
  autoClose: true
};
```

`options` 也可以包括一个 `start` 选项，使其可以写入数据到文件某个位置。
如果是修改一个文件而不是覆盖它，则需要`flags` 模式为 `r+` 而不是默认的 `w` 模式。
`defaultEncoding` 可以是任何可以被 [`Buffer`] 接受的值。

如果 `autoClose` 被设置为 `true`（默认），则在 `error` 或 `end` 时，文件描述符会被自动关闭。
如果 `autoClose` 为 `false`，则文件描述符不会被关闭，即使有错误。
应用程序需要负责关闭它，并且确保没有文件描述符泄漏。

类似 [`ReadStream`]，如果指定了 `fd`，则 `WriteStream` 会忽略 `path` 参数并且会使用指定的文件描述符。
这意味着不会触发 `'open'` 事件。
注意，`fd` 应该是阻塞的；非阻塞的 `fd` 们应该传给 [`net.Socket`]。

如果 `options` 是一个字符串，则它指定了字符编码。


## fs.fchmod(fd, mode, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `mode` {integer}
* `callback` {Function}

异步的 fchmod(2)。
完成回调只有一个可能的异常参数。


## fs.fchmodSync(fd, mode)
<!-- YAML
added: v0.4.7
-->

* `fd` {integer}
* `mode` {integer}

Synchronous fchmod(2). Returns `undefined`.

## fs.fchown(fd, uid, gid, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}

Asynchronous fchown(2). No arguments other than a possible exception are given
to the completion callback.

## fs.fchownSync(fd, uid, gid)
<!-- YAML
added: v0.4.7
-->

* `fd` {integer}
* `uid` {integer}
* `gid` {integer}

Synchronous fchown(2). Returns `undefined`.

## fs.fdatasync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `callback` {Function}

Asynchronous fdatasync(2). No arguments other than a possible exception are
given to the completion callback.

## fs.fdatasyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd` {integer}

Synchronous fdatasync(2). Returns `undefined`.

## fs.fstat(fd, callback)
<!-- YAML
added: v0.1.95
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `callback` {Function}

Asynchronous fstat(2). The callback gets two arguments `(err, stats)` where
`stats` is an [`fs.Stats`][] object. `fstat()` is identical to [`stat()`][],
except that the file to be stat-ed is specified by the file descriptor `fd`.

## fs.fstatSync(fd)
<!-- YAML
added: v0.1.95
-->

* `fd` {integer}

Synchronous fstat(2). Returns an instance of [`fs.Stats`][].

## fs.fsync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `callback` {Function}

Asynchronous fsync(2). No arguments other than a possible exception are given
to the completion callback.

## fs.fsyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd` {integer}

Synchronous fsync(2). Returns `undefined`.

## fs.ftruncate(fd[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `len` {integer} 默认 = `0`
* `callback` {Function}

异步的 ftruncate(2)。
完成回调只有一个可能的异常参数。

如果文件描述符指向的文件大于 `len` 个字节，则只有前面 `len` 个字节会保留在文件中。

例子，下面的程序会只保留文件前4个字节。

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// 输出: Node.js

// 获取要截断的文件的文件描述符
const fd = fs.openSync('temp.txt', 'r+');

// 截断文件至前4个字节
fs.ftruncate(fd, 4, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt', 'utf8'));
});
// 输出: Node
```

如果前面的文件小于 `len` 个字节，则扩展文件，且扩展的部分用空字节（'\0'）填充。例子：

```js
console.log(fs.readFileSync('temp.txt', 'utf-8'));
// 输出: Node.js

// 获取要截断的文件的文件描述符
const fd = fs.openSync('temp.txt', 'r+');

// 截断文件至前10个字节，但实际大小是7个字节
fs.ftruncate(fd, 10, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt'));
});
// 输出: <Buffer 4e 6f 64 65 2e 6a 73 00 00 00>
// ('Node.js\0\0\0' in UTF8)
```

最后3个字节是空字节（'\0'），用于补充超出的截断。


## fs.ftruncateSync(fd[, len])
<!-- YAML
added: v0.8.6
-->

* `fd` {integer}
* `len` {integer} 默认 = `0`

同步的 ftruncate(2)。返回 `undefined`。


## fs.futimes(fd, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd` {integer}
* `atime` {integer}
* `mtime` {integer}
* `callback` {Function}

改变由所提供的文件描述符所指向的文件的文件时间戳。

*请注意*: 该函数不支持AIX 7.1以下版本，在AIX 7.1以下版本会返回`UV_ENOSYS`错误。


## fs.futimesSync(fd, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd` {integer}
* `atime` {integer}
* `mtime` {integer}

Synchronous version of [`fs.futimes()`][]. Returns `undefined`.

## fs.lchmod(path, mode, callback)
<!-- YAML
deprecated: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer}
* `mode` {integer}
* `callback` {Function}

Asynchronous lchmod(2). No arguments other than a possible exception
are given to the completion callback.

Only available on macOS.

## fs.lchmodSync(path, mode)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer}
* `mode` {integer}

Synchronous lchmod(2). Returns `undefined`.

## fs.lchown(path, uid, gid, callback)
<!-- YAML
deprecated: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer}
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}

Asynchronous lchown(2). No arguments other than a possible exception are given
to the completion callback.

## fs.lchownSync(path, uid, gid)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer}
* `uid` {integer}
* `gid` {integer}

Synchronous lchown(2). Returns `undefined`.

## fs.link(existingPath, newPath, callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}

Asynchronous link(2). No arguments other than a possible exception are given to
the completion callback.

## fs.linkSync(existingPath, newPath)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

Synchronous link(2). Returns `undefined`.

## fs.lstat(path, callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}

Asynchronous lstat(2). The callback gets two arguments `(err, stats)` where
`stats` is a [`fs.Stats`][] object. `lstat()` is identical to `stat()`,
except that if `path` is a symbolic link, then the link itself is stat-ed,
not the file that it refers to.

## fs.lstatSync(path)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

Synchronous lstat(2). Returns an instance of [`fs.Stats`][].

## fs.mkdir(path[, mode], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `0o777`
* `callback` {Function}

Asynchronous mkdir(2). No arguments other than a possible exception are given
to the completion callback. `mode` defaults to `0o777`.

## fs.mkdirSync(path[, mode])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `0o777`

Synchronous mkdir(2). Returns `undefined`.

## fs.mkdtemp(prefix[, options], callback)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.2.1
    pr-url: https://github.com/nodejs/node/pull/6828
    description: The `callback` parameter is optional now.
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`
* `callback` {Function}

创建一个唯一的临时目录。

生成六位随机字符附加到一个要求的 `prefix` 后面，然后创建一个唯一的临时目录。

创建的目录路径会作为字符串传给回调的第二个参数。

可选的 `options` 参数可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。

例子：

```js
fs.mkdtemp('/tmp/foo-', (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // 输出: /tmp/foo-itXde2
});
```

**注意**：`fs.mkdtemp()` 方法会直接附加六位随机选择的字符串到 `prefix` 字符串。
例如，指定一个目录 `/tmp`，如果目的是要在 `/tmp` 里创建一个临时目录，则 `prefix` **必须** 以一个指定平台的路径分隔符（`require('path').sep`）结尾。

```js
// 新建的临时目录的父目录
const tmpDir = '/tmp';

// 该方法是 *错误的*：
fs.mkdtemp(tmpDir, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // 会输出类似于 `/tmpabc123`。
  // 注意，一个新的临时目录会被创建在文件系统的根目录，而不是在 /tmp 目录里。
});

// 该方法是 *正确的*：
const { sep } = require('path');
fs.mkdtemp(`${tmpDir}${sep}`, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // 会输出类似于 `/tmp/abc123`。
  // 一个新的临时目录会被创建在 /tmp 目录里。
});
```


## fs.mkdtempSync(prefix[, options])
<!-- YAML
added: v5.10.0
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`

[`fs.mkdtemp()`] 的同步版本。
返回创建的目录的路径。

可选的 `options` 参数可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。


## fs.open(path, flags[, mode], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Default:** `0o666`
* `callback` {Function}

异步地打开文件。详见 open(2)。
`flags` 可以是：

* `'r'` - 以读取模式打开文件。如果文件不存在则发生异常。

* `'r+'` - 以读写模式打开文件。如果文件不存在则发生异常。

* `'rs+'` - 以同步读写模式打开文件。命令操作系统绕过本地文件系统缓存。

  这对 NFS 挂载模式下打开文件很有用，因为它可以让你跳过潜在的旧本地缓存。
  它对 I/O 的性能有明显的影响，所以除非需要，否则不要使用此标志。

  注意，这不会使 `fs.open()` 进入同步阻塞调用。
  如果那是你想要的，则应该使用 `fs.openSync()`。

* `'w'` - 以写入模式打开文件。文件会被创建（如果文件不存在）或截断（如果文件存在）。

* `'wx'` - 类似 `'w'`，但如果 `path` 存在，则失败。

* `'w+'` - 以读写模式打开文件。文件会被创建（如果文件不存在）或截断（如果文件存在）。

* `'wx+'` - 类似 `'w+'`，但如果 `path` 存在，则失败。

* `'a'` - 以追加模式打开文件。如果文件不存在，则会被创建。

* `'ax'` - 类似于 `'a'`，但如果 `path` 存在，则失败。

* `'a+'` - 以读取和追加模式打开文件。如果文件不存在，则会被创建。

* `'ax+'` - 类似于 `'a+'`，但如果 `path` 存在，则失败。

`mode` 可设置文件模式（权限和 sticky 位），但只有当文件被创建时才有效。默认为 `0o666`，可读写。

该回调有两个参数 `(err, fd)`。

特有的标志 `'x'`（在 open(2) 中的 `O_EXCL` 标志）确保 `path` 是新创建的。
在 POSIX 操作系统中，`path` 会被视为存在，即使是一个链接到一个不存在的文件的符号。
该特有的标志有可能在网络文件系统中无法使用。

`flags` 也可以是一个数字，[open(2)] 文档中有描述；
常用的常量可从 `fs.constants` 获取。
在 Windows 系统中，标志会被转换为与它等同的替代者，例如，`O_WRONLY` 转换为 `FILE_GENERIC_WRITE`、或 `O_EXCL|O_CREAT` 转换为 `CREATE_NEW`，通过 CreateFileW 接受。

在 Linux 中，当文件以追加模式打开时，定位的写入不起作用。
内核会忽略位置参数，并总是附加数据到文件的末尾。

注意：`fs.open()` 某些标志的行为是与平台相关的。
因此，在 macOS 和 Linux 下用 `'a+'` 标志打开一个目录（见下面的例子），会返回一个错误。
与此相反，在 Windows 和 FreeBSD，则会返回一个文件描述符。

```js
// macOS 与 Linux
fs.open('<directory>', 'a+', (err, fd) => {
  // => [Error: EISDIR: illegal operation on a directory, open <directory>]
});

// Windows 与 FreeBSD
fs.open('<directory>', 'a+', (err, fd) => {
  // => null, <fd>
});
```

Some characters (`< > : " / \ | ? *`) are reserved under Windows as documented
by [Naming Files, Paths, and Namespaces][]. Under NTFS, if the filename contains
a colon, Node.js will open a file system stream, as described by
[this MSDN page][MSDN-Using-Streams].

Functions based on `fs.open()` exhibit this behavior as well. eg.
`fs.writeFile()`, `fs.readFile()`, etc.


## fs.openSync(path, flags[, mode])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Default:** `0o666`

[`fs.open()`] 的同步版本。
返回一个表示文件描述符的整数。


## fs.read(fd, buffer, offset, length, position, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}

从 `fd` 指定的文件中读取数据。

`buffer` 是数据将被写入到的 buffer。

`offset` 是 buffer 中开始写入的偏移量。

`length` 是一个整数，指定要读取的字节数。

`position` 指定从文件中开始读取的位置。
如果 `position` 为 `null`，则数据从当前文件读取位置开始读取，且文件读取位置会被更新。
如果 `position` 为一个整数，则文件读取位置保持不变。

回调有三个参数 `(err, bytesRead, buffer)`。

如果调用该方法的 [`util.promisify()`][] 版本，将会返回一个包含 `bytesRead` 和 `buffer` 属性的 Promise。


## fs.readdir(path[, options], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5616
    description: The `options` parameter was added.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`
* `callback` {Function}

异步的 readdir(3)。
读取一个目录的内容。
回调有两个参数 `(err, files)`，其中 `files` 是目录中不包括 `'.'` 和 `'..'` 的文件名的数组。

可选的 `options` 参数用于传入回调的文件名，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的文件名会被作为 `Buffer` 对象传入。


## fs.readdirSync(path[, options])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`

同步的 readdir(3). 
返回一个不包括 `'.'` 和 `'..'` 的文件名的数组。

可选的 `options` 参数用于传入回调的文件名，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的文件名会被作为 `Buffer` 对象传入。


## fs.readFile(path[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: 参数 `path` 可以是一个使用 `file:` 协议的 WHATWG `URL` 对象。
                 该支持目前仍为试验性的。
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: 参数 `callback` 不再是可选的。 
                 不传入它会触发一个警告。
  - version: v5.1.0
    pr-url: https://github.com/nodejs/node/pull/3740
    description: 当成功时，`callback` 被调用时会带上 `null` 作为 `error` 参数的值。
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: 参数 `path` 可以是一个文件描述符。
-->

* `path` {string|Buffer|URL|integer} 文件名或文件描述符。
* `options` {Object|string}
  * `encoding` {string|null} 默认为 `null`。
  * `flag` {string} 默认为 `'r'`。
* `callback` {Function}

异步地读取一个文件的全部内容。
例子：

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

回调有两个参数 `(err, data)`，其中 `data` 是文件的内容。

如果未指定字符编码，则返回原始的 buffer。

如果 `options` 是一个字符串，则它指定了字符编码。
例子：

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```

注意：当 `path` 是一个目录时，`fs.readFile()` 与 [`fs.readFileSync()`] 的行为与平台有关。
在 macOS、Linux 与 Windows 上，会返回一个错误。
在 FreeBSD 上，会返回目录内容的表示。

```js
// 在 macOS、Linux 与 Windows 上：
fs.readFile('<directory>', (err, data) => {
  // => [Error: EISDIR: illegal operation on a directory, read <directory>]
});

//  在 FreeBSD 上：
fs.readFile('<directory>', (err, data) => {
  // => null, <data>
});
```

任何指定的文件描述符必须支持读取。

注意：如果一个文件描述符被指定为 `path`，则它不会被自动关闭。


## fs.readFileSync(path[, options])
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} 文件名或文件描述符
* `options` {Object|string}
  * `encoding` {string|null} 默认 = `null`
  * `flag` {string} 默认 = `'r'`

[`fs.readFile()`] 的同步版本。
返回 `path` 的内容。

如果指定了 `encoding` 选项，则该函数返回一个字符串，否则返回一个 buffer。

*请注意*: 与[`fs.readFile()`][]相似, 当路径是目录时，`fs.readFileSync()`的行为是基于平台的。

```js
// macOS, Linux 和 Windows
fs.readFileSync('<directory>');
// => [Error: EISDIR: illegal operation on a directory, read <directory>]

//  FreeBSD
fs.readFileSync('<directory>'); // => null, <data>
```


## fs.readlink(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`
* `callback` {Function}

异步的 readlink(2)。
回调有两个参数  `(err, linkString)`。

可选的 `options` 参数用于传入回调的链接路径，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的链接路径会被作为 `Buffer` 对象传入。


## fs.readlinkSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`

同步的 readlink(2)。
返回符号链接的字符串值。

可选的 `options` 参数用于传入回调的链接路径，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的链接路径会被作为 `Buffer` 对象传入。


## fs.readSync(fd, buffer, offset, length, position)
<!-- YAML
added: v0.1.21
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd` {integer}
* `buffer` {string|Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

[`fs.read()`] 的同步版本。
返回 `bytesRead` 的数量。


## fs.realpath(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpath` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`
* `callback` {Function}

异步的 realpath(3)。
`callback` 有两个参数 `(err, resolvedPath)`。
可以使用 `process.cwd` 解析相对路径。

只支持可转换成 UTF8 字符串的路径。

可选的 `options` 参数用于传入回调的路径，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的路径会被作为 `Buffer` 对象传入。

*Note*: If `path` resolves to a socket or a pipe, the function will return a
system dependent name for that object.


## fs.realpathSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpathSync` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} 默认 = `'utf8'`

同步的 realpath(3)。
返回解析的路径。

只支持可转换成 UTF8 字符串的路径。

可选的 `options` 参数用于传入回调的路径，它可以是一个字符串并指定一个字符编码，或是一个对象且由一个 `encoding` 属性指定使用的字符编码。
如果 `encoding` 设为 `'buffer'`，则返回的路径会被作为 `Buffer` 对象传入。

*Note*: If `path` resolves to a socket or a pipe, the function will return a
system dependent name for that object.


## fs.rename(oldPath, newPath, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}

异步的 rename(2)。
完成回调只有一个可能的异常参数。


## fs.renameSync(oldPath, newPath)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

同步的 rename(2)。返回 `undefined`。


## fs.rmdir(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}

异步的 rmdir(2)。
完成回调只有一个可能的异常参数。

*请注意*: 在文件上（而不是目录上）使用`fs.rmdir()`，在Windows平台将会导致`ENOENT`错误，而在POSIX平台将会导致`ENOTDIR`错误。


## fs.rmdirSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

同步的 rmdir(2)。返回 `undefined`。

*请注意*: 在文件上（而不是目录上）使用`fs.rmdirSync()`，在Windows平台将会导致`ENOENT`错误，而在POSIX平台将会导致`ENOTDIR`错误。


## fs.stat(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}

异步的 stat(2)。
回调有两个参数 `(err, stats)` 其中 `stats` 是一个 [`fs.Stats`] 对象。

如果发生错误，则 `err.code` 会是[常见系统错误]之一。

不建议在调用 `fs.open()` 、`fs.readFile()` 或 `fs.writeFile()` 之前使用 `fs.stat()` 检查一个文件是否存在。
作为替代，用户代码应该直接打开/读取/写入文件，当文件无效时再处理错误。

如果要检查一个文件是否存在且不操作它，推荐使用 [`fs.access()`]。


## fs.statSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

同步的 stat(2)。
返回一个 [`fs.Stats`] 实例。


## fs.symlink(target, path[, type], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Default:** `'file'`
* `callback` {Function}

异步的 symlink(2)。
完成回调只有一个可能的异常参数。
`type` 参数可以设为 `'dir'`、`'file'` 或 `'junction'`（默认为 `'file'`），且仅在 Windows 上有效（在其他平台上忽略）。
注意，Windows 结点要求目标路径是绝对的。
当使用 `'junction'` 时，`target` 参数会被自动标准化为绝对路径。

例子：

```js
fs.symlink('./foo', './new-port', callback);
```

它创建了一个名为 "new-port" 且指向 "foo" 的符号链接。


## fs.symlinkSync(target, path[, type])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Default:** `'file'`

Synchronous symlink(2). Returns `undefined`.

## fs.truncate(path[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer}
* `len` {integer} **Default:** `0`
* `callback` {Function}
 
异步的 truncate(2)。
完成回调只有一个可能的异常参数。
文件描述符也可以作为第一个参数传入，在这种情况下，`fs.ftruncate()` 会被调用。

## fs.truncateSync(path[, len])
<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer}
* `len` {integer} **Default:** `0`

同步的 truncate(2)。
返回 `undefined`。
文件描述符也可以作为第一个参数传入，在这种情况下，`fs.ftruncateSync()` 会被调用。

## fs.unlink(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}

Asynchronous unlink(2). No arguments other than a possible exception are given
to the completion callback.

## fs.unlinkSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

Synchronous unlink(2). Returns `undefined`.

## fs.unwatchFile(filename[, listener])
<!-- YAML
added: v0.1.31
-->

* `filename` {string|Buffer}
* `listener` {Function|undefined} **Default:** `undefined`

停止监视 `filename` 文件的变化。
如果指定了 `listener`，则只移除特定的监听器。
否则，**所有**的监听器都会被移除，且已经有效地停止监视 `filename`。

调用 `fs.unwatchFile()` 且带上一个未被监视的文件名，将会是一个空操作，而不是一个错误。

注意：[`fs.watch()`] 比 `fs.watchFile()` 和 `fs.unwatchFile()` 更高效。
可能的话，应该使用 `fs.watch()` 而不是 `fs.watchFile()` 和 `fs.unwatchFile()`。


## fs.utimes(path, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {integer}
* `mtime` {integer}
* `callback` {Function}

改变指定的路径所指向的文件的文件时间戳。

注意：`atime` 和 `mtime` 参数遵循以下规则：

- 值应该是一个以秒为单位的 Unix 时间戳。
  例如，`Date.now()` 返回毫秒，所以在传入前应该除以1000。
- 如果值是一个数值字符串，如 `'123456789'`，则该值会被转换为对应的数值。
- 如果值是 `NaN` 、 `Infinity` 或 `-Infinity`，则会抛出错误。


## fs.utimesSync(path, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {integer}
* `mtime` {integer}

Synchronous version of [`fs.utimes()`][]. Returns `undefined`.

## fs.watch(filename[, options][, listener])
<!-- YAML
added: v0.5.10
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
-->

* `filename` {string|Buffer|URL}
* `options` {string|Object}
  * `persistent` {boolean} 指明如果文件正在被监视，进程是否应该继续运行。默认 = `true`
  * `recursive` {boolean} 指明是否全部子目录应该被监视，或只是当前目录。
    适用于当一个目录被指定时，且只在支持的平台（详见 [Caveats]）。默认 = `false`
  * `encoding` {string} 指定用于传给监听器的文件名的字符编码。默认 = `'utf8'`
* `listener` {Function|undefined} **Default:** `undefined`

监视 `filename` 的变化，`filename` 可以是一个文件或一个目录。
返回的对象是一个 [`fs.FSWatcher`]。

第二个参数是可选的。
如果提供的 `options` 是一个字符串，则它指定了 `encoding`。
否则 `options` 应该以一个对象传入。

监听器回调有两个参数 `(eventType, filename)`。
`eventType` 可以是 `'rename'` 或 `'change'`，`filename` 是触发事件的文件的名称。

注意，在大多数平台，当一个文件出现或消失在一个目录里时，`'rename'` 会被触发。

还需要注意，监听器回调是绑定在由 [`fs.FSWatcher`] 触发的 `'change'` 事件上，但它跟 `eventType` 的 `'change'` 值不是同一个东西。


### Caveats

<!--type=misc-->

`fs.watch` API 不是 100％ 跨平台一致的，且在某些情况下不可用。

递归选项只支持 macOS 和 Windows。


#### Availability

<!--type=misc-->

该特性依赖于底层操作系统提供的一种方法来通知文件系统的变化。

* 在 Linux 系统中，使用 [`inotify`]。
* 在 BSD 系统中，使用 [`kqueue`]。
* 在 macOS 系统中，对文件使用 [`kqueue`]，对目录使用 [`FSEvents`]。
* 在 SunOS 系统（包括 Solaris 和 SmartOS）中，使用 [`event ports`]。
* 在 Windows 系统中，该特性依赖 [`ReadDirectoryChangesW`]。
* 在 Aix 系统中，该特性依赖 [`AHAFS`] 必须是启动的。

如果底层功能因某些原因不可用，则 `fs.watch` 也无法正常工作。
例如，当使用虚拟化软件如 Vagrant、Docker 等时，在网络文件系统（NFS、SMB 等）或主文件系统中监视文件或目录可能是不可靠的。

您仍然可以使用基于stat轮询的`fs.watchFile()`，但是这种方法更慢，可靠性也更低。


#### Inodes

<!--type=misc-->

在 Linux 或 macOS 系统中，`fs.watch()` 解析路径到一个[索引节点]，并监视该索引节点。
如果监视的路径被删除或重建，则它会被分配一个新的索引节点。
监视器会发出一个删除事件，但会继续监视**原始的**索引节点。
新建的索引节点的事件不会被触发。
这是正常的行为。

In AIX, save and close of a file being watched causes two notifications -
one for adding new content, and one for truncation. Moreover, save and
close operations on some platforms cause inode changes that force watch
operations to become invalid and ineffective. AIX retains inode for the
lifetime of a file, that way though this is different from Linux / macOS,
this improves the usability of file watching. This is expected behavior.


#### Filename Argument

<!--type=misc-->

回调中提供的 `filename` 参数仅在 Linux、macOS、Windows、以及 AIX 系统上支持。
即使在支持的平台中，`filename` 也不能保证提供。
因此，不要以为 `filename` 参数总是在回调中提供，如果它是空的，需要有一定的后备逻辑。

```js
fs.watch('somedir', (eventType, filename) => {
  console.log(`事件类型是: ${eventType}`);
  if (filename) {
    console.log(`提供的文件名: ${filename}`);
  } else {
    console.log('未提供文件名');
  }
});
```


## fs.watchFile(filename[, options], listener)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `filename` {string|Buffer|URL}
* `options` {Object}
  * `persistent` {boolean} **Default:** `true`
  * `interval` {integer} **Default:** `5007`
* `listener` {Function}

监视 `filename` 的变化。
回调 `listener` 会在每次访问文件时被调用。

`options` 参数可被省略。
如果提供的话，它应该是一个对象。
`options` 对象可能包含一个名为 `persistent` 的布尔值，表明当文件正在被监视时，进程是否应该继续运行。
`options` 对象可以指定一个 `interval` 属性，表示目标应该每隔多少毫秒被轮询。
默认值为 `{ persistent: true, interval: 5007 }`。

`listener` 有两个参数，当前的状态对象和以前的状态对象：

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  console.log(`the previous mtime was: ${prev.mtime}`);
});
```

These stat objects are instances of `fs.Stat`.
这里的状态对象是 `fs.Stat` 实例。

如果你想在文件被修改而不只是访问时得到通知，则需要比较 `curr.mtime` 和 `prev.mtime`。

注意：当一个 `fs.watchFile` 的运行结果是一个 `ENOENT` 错误时，它会调用监听器一次，且将所有字段置零（或将日期设为 Unix 纪元）。
在 Windows 中，`blksize` 和 `blocks` 字段会是 `undefined` 而不是零。
如果文件是在那之后创建的，则监听器会被再次调用，且带上最新的状态对象。
这是在 v0.10 版之后在功能上的变化。

注意：[`fs.watch()`] 比 `fs.watchFile` 和 `fs.unwatchFile` 更高效。
可能的话，应该使用 `fs.watch` 而不是 `fs.watchFile` 和 `fs.unwatchFile`。


## fs.write(fd, buffer[, offset[, length[, position]]], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}

写入 `buffer` 到 `fd` 指定的文件。

`offset` 决定 buffer 中被写入的部分，`length` 是一个整数，指定要写入的字节数。

`position` 指向从文件开始写入数据的位置的偏移量。
如果 `typeof position !== 'number'`，则数据从当前位置写入。详见 pwrite(2)。

回调有三个参数 `(err, bytesWritten, buffer)`，其中 `bytesWritten` 指定从 `buffer` 写入了多少**字节**。

If this method is invoked as its [`util.promisify()`][]ed version, it returns
a Promise for an object with `bytesWritten` and `buffer` properties.

注意，多次对同一文件使用 `fs.write` 且不等待回调，是不安全的。
对于这种情况，强烈推荐使用 `fs.createWriteStream`。

在 Linux 上，当文件以追加模式打开时，指定位置的写入是不起作用的。
内核会忽略位置参数，并总是将数据追加到文件的末尾。


## fs.write(fd, string[, position[, encoding]], callback)
<!-- YAML
added: v0.11.5
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}
* `callback` {Function}

写入 `string` 到 `fd` 指定的文件。
如果 `string` 不是一个字符串，则该值将被强制转换为一个字符串。

`position` 指向从文件开始写入数据的位置的偏移量。
如果 `typeof position !== 'number'`，则数据从当前位置写入。详见 pwrite(2)。

`encoding` 是期望的字符串编码。

回调有三个参数 `(err, written, string)`，其中 `written` 指定传入的字符串被写入多少字节。
注意，写入的字节与字符串的字符是不同的。详见 [`Buffer.byteLength`]。

不同于写入 `buffer`，该方法整个字符串必须被写入。
不能指定子字符串。
这是因为结果数据的字节偏移量可能与字符串的偏移量不同。

注意，多次对同一文件使用 `fs.write` 且不等待回调，是不安全的。
对于这种情况，强烈推荐使用 `fs.createWriteStream`。

在 Linux 上，当文件以追加模式打开时，指定位置的写入是不起作用的。
内核会忽略位置参数，并总是将数据追加到文件的末尾。


## fs.writeFile(file, data[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|integer} 文件名或文件描述符
* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} 默认 = `'utf8'`
  * `mode` {integer} 默认 = `0o666`
  * `flag` {string} 默认 = `'w'`
* `callback` {Function}

异步地写入数据到文件，如果文件已经存在，则替代文件。
`data` 可以是一个字符串或一个 buffer。

如果 `data` 是一个 buffer，则忽略 `encoding` 选项。它默认为 `'utf8'`。

例子：

```js
fs.writeFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
```

如果 `options` 是一个字符串，则它指定了字符编码。例如：

```js
fs.writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
```

任何指定的文件描述符必须支持写入。

注意，多次对同一文件使用 `fs.writeFile` 且不等待回调，是不安全的。
对于这种情况，强烈推荐使用 `fs.createWriteStream`。

**注意：如果 `file` 指定为一个文件描述符，则它不会被自动关闭。**


## fs.writeFileSync(file, data[, options])
<!-- YAML
added: v0.1.29
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|integer} filename or file descriptor
* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'w'`

The synchronous version of [`fs.writeFile()`][]. Returns `undefined`.

## fs.writeSync(fd, buffer[, offset[, length[, position]]])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

## fs.writeSync(fd, string[, position[, encoding]])
<!-- YAML
added: v0.11.5
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
-->

* `fd` {integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}

Synchronous versions of [`fs.write()`][]. Returns the number of bytes written.

## FS Constants

以下常量由 `fs.constants` 输出。

**注意：**不是所有的常量在每一个操作系统上都是可用的。


### File Access Constants

以下常量用于 [`fs.access()`]。

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>F_OK</code></td>
    <td>该标志表明文件对于调用进程是可见的。</td>
  </tr>
  <tr>
    <td><code>R_OK</code></td>
    <td>该标志表明文件可被调用进程读取。</td>
  </tr>
  <tr>
    <td><code>W_OK</code></td>
    <td>该标志表明文件可被调用进程写入。</td>
  </tr>
  <tr>
    <td><code>X_OK</code></td>
    <td>该标志表明文件可被调用进程执行。</td>
  </tr>
</table>


### File Open Constants

以下常量用于 `fs.open()`。

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>O_RDONLY</code></td>
    <td>该标志表明打开一个文件用于只读访问。</td>
  </tr>
  <tr>
    <td><code>O_WRONLY</code></td>
    <td>该标志表明打开一个文件用于只写访问。</td>
  </tr>
  <tr>
    <td><code>O_RDWR</code></td>
    <td>该标志表明打开一个文件用于读写访问。</td>
  </tr>
  <tr>
    <td><code>O_CREAT</code></td>
    <td>该标志表明如果文件不存在则创建一个文件。</td>
  </tr>
  <tr>
    <td><code>O_EXCL</code></td>
    <td>该标志表明如果设置了 <code>O_CREAT</code> 标志且文件已经存在，则打开一个文件应该失败。</td>
  </tr>
  <tr>
    <td><code>O_NOCTTY</code></td>
    <td>该标志表明如果路径是一个终端设备，则打开该路径不应该造成该终端变成进程的控制终端（如果进程还没有终端）。</td>
  </tr>
  <tr>
    <td><code>O_TRUNC</code></td>
    <td>该标志表明如果文件存在且为一个常规文件、且文件被成功打开为写入访问，则它的长度应该被截断至零。</td>
  </tr>
  <tr>
    <td><code>O_APPEND</code></td>
    <td>该标志表明数据会被追加到文件的末尾。</td>
  </tr>
  <tr>
    <td><code>O_DIRECTORY</code></td>
    <td>该标志表明如果路径不是一个目录，则打开应该失败。</td>
  </tr>
  <tr>
  <td><code>O_NOATIME</code></td>
    <td>该标志表明文件系统的读取访问权不再引起相关文件 `atime` 信息的更新。该标志只在 Linux 操作系统有效。</td>
  </tr>
  <tr>
    <td><code>O_NOFOLLOW</code></td>
    <td>该标志表明如果路径是一个符号链接，则打开应该失败。</td>
  </tr>
  <tr>
    <td><code>O_SYNC</code></td>
    <td>该标志表明文件打开用于同步 I/O。</td>
  </tr>
  <tr>
    <td><code>O_SYMLINK</code></td>
    <td>该标志表明打开符号链接自身，而不是它指向的资源。</td>
  </tr>
  <tr>
    <td><code>O_DIRECT</code></td>
    <td>当设置它时，会尝试最小化文件 I/O 的缓存效果。</td>
  </tr>
  <tr>
    <td><code>O_NONBLOCK</code></td>
    <td>该标志表明当可能时以非阻塞模式打开文件。</td>
  </tr>
</table>



### File Type Constants

以下常量用于 [`fs.Stats`] 对象中用于决定一个文件的类型的 `mode` 属性。

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>S_IFMT</code></td>
    <td>用于提取文件类型码的位掩码。</td>
  </tr>
  <tr>
    <td><code>S_IFREG</code></td>
    <td>表示一个常规文件的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>表示一个目录的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFCHR</code></td>
    <td>表示一个面向字符的设备文件的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFBLK</code></td>
    <td>表示一个面向块的设备文件的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFIFO</code></td>
    <td>表示一个 FIFO/pipe 的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFLNK</code></td>
    <td>表示一个符号链接的文件类型常量。</td>
  </tr>
  <tr>
    <td><code>S_IFSOCK</code></td>
    <td>表示一个 socket 的文件类型常量。</td>
  </tr>
</table>



### File Mode Constants

以下常量用于 [`fs.Stats`] 对象中用于决定一个文件访问权限的 `mode` 属性。

<table>
  <tr>
    <th>常量</th>
    <th>描述</th>
  </tr>
  <tr>
    <td><code>S_IRWXU</code></td>
    <td>该文件模式表明可被所有者读取、写入、执行。</td>
  </tr>
  <tr>
    <td><code>S_IRUSR</code></td>
    <td>该文件模式表明可被所有者读取。</td>
  </tr>
  <tr>
    <td><code>S_IWUSR</code></td>
    <td>该文件模式表明可被所有者写入。</td>
  </tr>
  <tr>
    <td><code>S_IXUSR</code></td>
    <td>该文件模式表明可被所有者执行。</td>
  </tr>
  <tr>
    <td><code>S_IRWXG</code></td>
    <td>该文件模式表明可被群组读取、写入、执行。</td>
  </tr>
  <tr>
    <td><code>S_IRGRP</code></td>
    <td>该文件模式表明可被群组读取。</td>
  </tr>
  <tr>
    <td><code>S_IWGRP</code></td>
    <td>该文件模式表明可被群组写入。</td>
  </tr>
  <tr>
    <td><code>S_IXGRP</code></td>
    <td>该文件模式表明可被群组执行。</td>
  </tr>
  <tr>
    <td><code>S_IRWXO</code></td>
    <td>该文件模式表明可被其他人读取、写入、执行。</td>
  </tr>
  <tr>
    <td><code>S_IROTH</code></td>
    <td>该文件模式表明可被其他人读取。</td>
  </tr>
  <tr>
    <td><code>S_IWOTH</code></td>
    <td>该文件模式表明可被其他人写入。</td>
  </tr>
  <tr>
    <td><code>S_IXOTH</code></td>
    <td>该文件模式表明可被其他人执行。</td>
  </tr>
</table>


[`AHAFS`]: https://www.ibm.com/developerworks/aix/library/au-aix_event_infrastructure/
[`Buffer.byteLength`]: buffer.html#buffer_class_method_buffer_bytelength_string_encoding
[`Buffer`]: buffer.html#buffer_buffer
[`FSEvents`]: https://developer.apple.com/library/mac/documentation/Darwin/Conceptual/FSEvents_ProgGuide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40005289-CH1-SW1
[`ReadDirectoryChangesW`]: https://msdn.microsoft.com/en-us/library/windows/desktop/aa365465%28v=vs.85%29.aspx
[`ReadStream`]: #fs_class_fs_readstream
[`URL`]: url.html#url_the_whatwg_url_api
[`WriteStream`]: #fs_class_fs_writestream
[`event ports`]: http://illumos.org/man/port_create
[`fs.FSWatcher`]: #fs_class_fs_fswatcher
[`fs.Stats`]: #fs_class_fs_stats
[`fs.access()`]: #fs_fs_access_path_mode_callback
[`fs.appendFile()`]: fs.html#fs_fs_appendfile_file_data_options_callback
[`fs.exists()`]: fs.html#fs_fs_exists_path_callback
[`fs.fstat()`]: #fs_fs_fstat_fd_callback
[`fs.futimes()`]: #fs_fs_futimes_fd_atime_mtime_callback
[`fs.lstat()`]: #fs_fs_lstat_path_callback
[`fs.mkdtemp()`]: #fs_fs_mkdtemp_prefix_options_callback
[`fs.open()`]: #fs_fs_open_path_flags_mode_callback
[`fs.read()`]: #fs_fs_read_fd_buffer_offset_length_position_callback
[`fs.readFile()`]: #fs_fs_readfile_path_options_callback
[`fs.readFileSync()`]: #fs_fs_readfilesync_path_options
[`fs.stat()`]: #fs_fs_stat_path_callback
[`fs.utimes()`]: #fs_fs_utimes_path_atime_mtime_callback
[`fs.watch()`]: #fs_fs_watch_filename_options_listener
[`fs.write()`]: #fs_fs_write_fd_buffer_offset_length_position_callback
[`fs.writeFile()`]: #fs_fs_writefile_file_data_options_callback
[`inotify`]: http://man7.org/linux/man-pages/man7/inotify.7.html
[`kqueue`]: https://www.freebsd.org/cgi/man.cgi?kqueue
[`net.Socket`]: net.html#net_class_net_socket
[`stat()`]: fs.html#fs_fs_stat_path_callback
[`util.inspect(stats)`]: util.html#util_util_inspect_object_options
[`util.promisify()`]: util.html#util_util_promisify_original
[Caveats]: #fs_caveats
[Common System Errors]: errors.html#errors_common_system_errors
[FS Constants]: #fs_fs_constants_1
[MDN-Date]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
[MDN-Number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[MSDN-Rel-Path]: https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths
[Readable Stream]: stream.html#stream_class_stream_readable
[Writable Stream]: stream.html#stream_class_stream_writable
[inode]: https://en.wikipedia.org/wiki/Inode
[Naming Files, Paths, and Namespaces]: https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
[MSDN-Using-Streams]: https://msdn.microsoft.com/en-us/library/windows/desktop/bb540537.aspx

[常见系统错误]: errors.html#errors_common_system_errors
[`getTime()`]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/getTime
[MDN JavaScript 手册]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
[`Date`]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
[可读流]: stream.html#stream_class_stream_readable
[可写流]: stream.html#stream_class_stream_writable
[索引节点]: https://en.wikipedia.org/wiki/Inode
[`fs.readFileSync()`]: #fs_fs_readfilesync_path_options
[MSDN 路径文档]: https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths