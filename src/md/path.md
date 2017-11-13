# Path

<!--introduced_in=v0.10.0-->

> 稳定性: 2 - 稳定的

`path` 模块提供了一些工具函数，用于处理文件与目录的路径。可以通过以下方式使用：

```js
const path = require('path');
```

## Windows vs. POSIX

`path` 模块的默认操作会根据 Node.js 应用程序运行的操作系统的不同而变化。
比如，当运行在 Windows 操作系统上时，`path` 模块会认为使用的是 Windows 风格的路径。

例如，对 Windows 文件路径 `C:\temp\myfile.html` 使用 `path.basename()` 函数，运行在 POSIX 上与运行在 Windows 上会产生不同的结果：

在 POSIX 上:

```js
path.basename('C:\\temp\\myfile.html');
// 返回: 'C:\\temp\\myfile.html'
```

在 Windows 上:

```js
path.basename('C:\\temp\\myfile.html');
// 返回: 'myfile.html'
```

要想在任何操作系统上处理 Windows 文件路径时获得一致的结果，可以使用 [`path.win32`]：

在 POSIX 和 Windows 上:

```js
path.win32.basename('C:\\temp\\myfile.html');
// 返回: 'myfile.html'
```

要想在任何操作系统上处理 POSIX 文件路径时获得一致的结果，可以使用 [`path.posix`]：

在 POSIX 和 Windows 上:

```js
path.posix.basename('/tmp/myfile.html');
// 返回: 'myfile.html'
```

注意：在 Windows 上 Node.js 遵循单驱动器工作目录的理念。
当使用驱动器路径且不带反斜杠时就能体验到该特征。
例如，`fs.readdirSync('c:\\')` 可能返回与 `fs.readdirSync('c:')` 不同的结果。
详见 [MSDN 路径文档]。

## path.basename(path[, ext])
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} 可选的文件扩展名
* 返回: {string}

`path.basename()` 方法返回一个 `path` 的最后一部分，类似于 Unix 中的 `basename` 命令。
Trailing directory separators are ignored, see [`path.sep`][].

例子：

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// 返回: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// 返回: 'quux'
```

如果 `path` 不是一个字符串或提供了 `ext` 但不是一个字符串，则抛出 [`TypeError`]。

## path.delimiter
<!-- YAML
added: v0.9.3
-->

* {string}

提供平台特定的路径分隔符：

* Windows 上是 `;`
* POSIX 上是 `:`

例如，在 POSIX 上：

```js
console.log(process.env.PATH);
// 输出: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// 返回: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

在 Windows 上：

```js
console.log(process.env.PATH);
// 输出: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// 返回: ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
```

## path.dirname(path)
<!-- YAML
added: v0.1.16
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* 返回: {string}

`path.dirname()` 方法返回一个 `path` 的目录名，类似于 Unix 中的 `dirname` 命令。
Trailing directory separators are ignored, see [`path.sep`][].

例子：

```js
path.dirname('/foo/bar/baz/asdf/quux');
// 返回: '/foo/bar/baz/asdf'
```

如果 `path` 不是一个字符串，则抛出 [`TypeError`]。

## path.extname(path)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* 返回: {string}

`path.extname()` 方法返回 `path` 的扩展名，即从 `path` 的最后一部分中的最后一个 `.`（句号）字符到字符串结束。
如果 `path` 的最后一部分没有 `.` 或 `path` 的文件名（见 `path.basename()`）的第一个字符是 `.`，则返回一个空字符串。

例子：

```js
path.extname('index.html');
// 返回: '.html'

path.extname('index.coffee.md');
// 返回: '.md'

path.extname('index.');
// 返回: '.'

path.extname('index');
// 返回: ''

path.extname('.index');
// 返回: ''
```

如果 `path` 不是一个字符串，则抛出 [`TypeError`]。

## path.format(pathObject)
<!-- YAML
added: v0.11.15
-->

* `pathObject` {Object}
  * `dir` {string}
  * `root` {string}
  * `base` {string}
  * `name` {string}
  * `ext` {string}
* 返回: {string}

`path.format()` 方法会从一个对象返回一个路径字符串。
与 [`path.parse()`] 相反。

当 `pathObject` 提供的属性有组合时，有些属性的优先级比其他的高：

* 如果提供了 `pathObject.dir`，则 `pathObject.root` 会被忽略
* 如果提供了 `pathObject.base` 存在，则 `pathObject.ext` 和 `pathObject.name` 会被忽略

例如，在 POSIX 上：

```js
// 如果提供了 `dir`、`root` 和 `base`，则返回 `${dir}${path.sep}${base}`。
// `root` 会被忽略。
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// 返回: '/home/user/dir/file.txt'

// 如果没有指定 `dir`，则 `root` 会被使用。
// 如果只提供了 `root` 或 `dir` 等于 `root`，则平台的分隔符不会被包含。
// `ext` 会被忽略。
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// 返回: '/file.txt'

// 如果没有指定 `base`，则 `name` + `ext` 会被使用。
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// 返回: '/file.txt'
```

在 Windows 上：

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// 返回: 'C:\\path\\dir\\file.txt'
```

## path.isAbsolute(path)
<!-- YAML
added: v0.11.2
-->

* `path` {string}
* 返回: {boolean}

`path.isAbsolute()` 方法会判定 `path` 是否为一个绝对路径。

如果给定的 `path` 是一个长度为零的字符串，则返回 `false`。

例如，在 POSIX 上：

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

在 Windows 上：

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

如果 `path` 不是一个字符串，则抛出 [`TypeError`]。

## path.join([...paths])
<!-- YAML
added: v0.1.16
-->

* `...paths` {string} 一个路径片段的序列
* 返回: {string}

`path.join()` 方法使用平台特定的分隔符把全部给定的 `path` 片段连接到一起，并规范化生成的路径。

长度为零的 `path` 片段会被忽略。
如果连接后的路径字符串是一个长度为零的字符串，则返回 `'.'`，表示当前工作目录。

例子：

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// 返回: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// 抛出 'TypeError: Path must be a string. Received {}'
```

如果任一路径片段不是一个字符串，则抛出 [`TypeError`]。

## path.normalize(path)
<!-- YAML
added: v0.1.23
-->

* `path` {string}
* 返回: {string}

`path.normalize()` 方法会规范化给定的 `path`，并解析 `'..'` 和 `'.'` 片段。

当发现多个连续的路径分隔符时（如 POSIX 上的 `/` 与 Windows 上的 `\` 或 `/`），它们会被单个的路径分隔符（POSIX 上是 `/`，Windows 上是 `\`）替换。
末尾的多个分隔符会被保留。

如果 `path` 是一个长度为零的字符串，则返回 `'.'`，表示当前工作目录。

例如，在 POSIX 上：

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// 返回: '/foo/bar/baz/asdf'
```

在 Windows 上：

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// 返回: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be
replaced by instances of the Windows preferred separator (`\`):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Returns: 'C:\\temp\\foo\\bar'
```

如果 `path` 不是一个字符串，则抛出 [`TypeError`]。


## path.parse(path)
<!-- YAML
added: v0.11.15
-->

* `path` {string}
* 返回: {Object}

`path.parse()` 方法返回一个对象，对象的属性表示 `path` 的元素。
Trailing directory separators are ignored, see [`path.sep`][].

返回的对象有以下属性：

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

例如，在 POSIX 上：

```js
path.parse('/home/user/dir/file.txt');
// 返回:
// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
"  /    home/user/dir / file  .txt "
└──────┴──────────────┴──────┴─────┘
(请无视以上字符串中的空格，它们只是为了布局)
```

在 Windows 上：

```js
path.parse('C:\\path\\dir\\file.txt');
// 返回:
// { root: 'C:\\',
//   dir: 'C:\\path\\dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
" C:\      path\dir   \ file  .txt "
└──────┴──────────────┴──────┴─────┘
(请无视以上字符串中的空格，它们只是为了布局)
```

如果 `path` 不是一个字符串，则抛出 [`TypeError`]。


## path.posix
<!-- YAML
added: v0.11.15
-->

* {Object}

`path.posix` 属性提供了 `path` 方法针对 POSIX 的实现。


## path.relative(from, to)
<!-- YAML
added: v0.5.0
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8523
    description: On Windows, the leading slashes for UNC paths are now included
                 in the return value.
-->

* `from` {string}
* `to` {string}
* 返回: {string}

`path.relative()` 方法返回从 `from` 到 `to` 的相对路径（基于当前工作目录）。
如果 `from` 和 `to` 各自解析到同一路径（调用 `path.resolve()`），则返回一个长度为零的字符串。

如果 `from` 或 `to` 传入了一个长度为零的字符串，则当前工作目录会被用于代替长度为零的字符串。

例如，在 POSIX 上：

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// 返回: '../../impl/bbb'
```

在 Windows 上：

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// 返回: '..\\..\\impl\\bbb'
```

如果 `from` 或 `to` 不是一个字符串，则抛出 [`TypeError`]。


## path.resolve([...paths])
<!-- YAML
added: v0.3.4
-->

* `...paths` {string} 一个路径或路径片段的序列
* 返回: {string}

`path.resolve()` 方法会把一个路径或路径片段的序列解析为一个绝对路径。

给定的路径的序列是从右往左被处理的，后面每个 `path` 被依次解析，直到构造完成一个绝对路径。
例如，给定的路径片段的序列为：`/foo`、`/bar`、`baz`，则调用 `path.resolve('/foo', '/bar', 'baz')` 会返回 `/bar/baz`。

如果处理完全部给定的 `path` 片段后还未生成一个绝对路径，则当前工作目录会被用上。

生成的路径是规范化后的，且末尾的斜杠会被删除，除非路径被解析为根目录。

长度为零的 `path` 片段会被忽略。

如果没有传入 `path` 片段，则 `path.resolve()` 会返回当前工作目录的绝对路径。

例子：

```js
path.resolve('/foo/bar', './baz');
// 返回: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// 返回: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// 如果当前工作目录为 /home/myself/node，
// 则返回 '/home/myself/node/wwwroot/static_files/gif/image.gif'
```

如果任何参数不是一个字符串，则抛出 [`TypeError`]。


## path.sep
<!-- YAML
added: v0.7.9
-->

* {string}

提供了平台特定的路径片段分隔符：

* Windows 上是 `\`
* POSIX 上是 `/`

例如，在 POSIX 上：

```js
'foo/bar/baz'.split(path.sep);
// 返回: ['foo', 'bar', 'baz']
```

在 Windows 上：

```js
'foo\\bar\\baz'.split(path.sep);
// 返回: ['foo', 'bar', 'baz']
```

注意：在 Windows 上，斜杠字符（`/`）和反斜杠字符（`\`）都可作为路径分隔符；
但 `path` 的方法只添加反斜杠（`\`）。


## path.win32
<!-- YAML
added: v0.11.15
-->

* {Object}

`path.win32` 属性提供了 `path` 方法针对 Windows 的实现。

