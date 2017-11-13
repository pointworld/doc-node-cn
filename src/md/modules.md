# Modules

> 稳定性: 2 - 稳定的

<!--name=module-->

Node.js 有一个简单的模块加载系统。
在 Node.js 中，文件和模块是一一对应的（每个文件被视为一个独立的模块）。

例子，假设有一个名为 `foo.js` 的文件：

```js
const circle = require('./circle.js');
console.log(`半径为 4 的圆的面积是 ${circle.area(4)}`);
```

在第一行中，`foo.js` 加载了同一目录下的 `circle.js` 模块。

`circle.js` 文件的内容为：

```js
const { PI } = Math;

exports.area = (r) => PI * r ** 2;

exports.circumference = (r) => 2 * PI * r;
```

`circle.js` 模块导出了 `area()` 和 `circumference()` 两个函数。
通过在特殊的 `exports` 对象上指定额外的属性，函数和对象可以被添加到模块的根部。

模块内的本地变量是私有的，因为模块被 Node.js 包装在一个函数中（详见[模块包装器]）。
在这个例子中，变量 `PI` 是 `circle.js` 私有的。

`module.exports`属性可以被赋予一个新的值（例如函数或对象）。

如下，`bar.js` 会用到 `square` 模块，`square` 导出一个构造函数：

```js
const square = require('./square.js');
const mySquare = square(2);
console.log(`正方形的面积是 ${mySquare.area()}`);
```

`square` 模块定义在 `square.js` 中：

```js
// 赋值给 `exports` 不会修改模块，必须使用 `module.exports`
module.exports = (width) => {
  return {
    area: () => width ** 2
  };
};
```

模块系统在 `require('module')` 模块中实现。

## Accessing the main module

<!-- type=misc -->

当 Node.js 直接运行一个文件时，`require.main` 会被设为它的 `module`。
这意味着可以通过 `require.main === module` 来判断一个文件是否被直接运行：

对于 `foo.js` 文件，如果通过 `node foo.js` 运行则为 `true`，但如果通过 `require('./foo')` 运行则为 `false`。

因为 `module` 提供了一个 `filename` 属性（通常等同于 `__filename`），所以可以通过检查 `require.main.filename` 来获取当前应用程序的入口点。


## Addenda: Package Manager Tips

<!-- type=misc -->

Node.js 的 `require()` 函数的语义被设计得足够通用化，可以支持许多合理的目录结构。
包管理器程序（如 `dpkg`、`rpm` 和 `npm`）可以不用修改就能够从 Node.js 模块构建本地包。

以下是一个推荐的目录结构：

假设想要在 `/usr/lib/node/<some-package>/<some-version>` 目录中保存一个特定版本的包的内容。

包可以依赖于其他包。
为了安装包 `foo`，可能需要安装一个指定版本的 `bar` 包。
`bar` 包也可能有依赖，且在某些情况下，依赖可能有冲突或形成循环。

因为 Node.js 会查找它所加载的模块的实际路径（也就是说会解析符号链接），然后在 `node_modules` 目录中寻找它们的依赖，[如下所述](#modules_loading_from_node_modules_folders)，这种情况使用以下体系结构很容易解决：

* `/usr/lib/node/foo/1.2.3/` - `foo` 包的内容，版本 1.2.3。
* `/usr/lib/node/bar/4.3.2/` - `foo` 依赖的 `bar` 包的内容。
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - `/usr/lib/node/bar/4.3.2/` 的符号链接。
* `/usr/lib/node/bar/4.3.2/node_modules/*` - `bar` 所依赖的包的符号链接

因此，即便存在循环依赖或依赖冲突，每个模块还是可以获得它所依赖的包的一个可用版本。

当 `foo` 包中的代码调用 `require('bar')`，它会获得符号链接 `/usr/lib/node/foo/1.2.3/node_modules/bar` 指向的版本。
然后，当 `bar` 包中的代码调用 `require('queue')`，它会获得符号链接 `/usr/lib/node/bar/4.3.2/node_modules/quux` 指向的版本。

此外，为了进一步优化模块查找过程，不要将包直接放在 `/usr/lib/node` 目录中，而是将它们放在 `/usr/lib/node_modules/<name>/<version>` 目录中。
这样 Node.js 就不会在 `/usr/node_modules` 或 `/node_modules` 目录中查找缺失的依赖。

为了使模块在 Node.js 的 REPL 中可用，可能需要将 `/usr/lib/node_modules` 目录添加到 `$NODE_PATH` 环境变量中。
由于在 `node_modules` 目录中查找模块使用的是相对路径，而调用 `require()` 的文件是基于实际路径的，因此包本身可以放在任何地方。


## All Together...

<!-- type=misc -->

Node.js 的 `require()` 函数的语义被设计得足够通用化，可以支持许多合理的目录结构。
包管理器程序（如 `dpkg`、`rpm` 和 `npm`）可以不用修改就能够从 Node.js 模块构建本地包。

以下是一个推荐的目录结构：

假设想要在 `/usr/lib/node/<some-package>/<some-version>` 目录中保存一个特定版本的包的内容。

包可以依赖于其他包。
为了安装包 `foo`，可能需要安装一个指定版本的 `bar` 包。
`bar` 包也可能有依赖，且在某些情况下，依赖可能有冲突或形成循环。

因为 Node.js 会查找它所加载的模块的实际路径（也就是说会解析符号链接），然后在 `node_modules` 目录中寻找它们的依赖，[如下所述](#modules_loading_from_node_modules_folders)，这种情况使用以下体系结构很容易解决：

* `/usr/lib/node/foo/1.2.3/` - `foo` 包的内容，版本 1.2.3。
* `/usr/lib/node/bar/4.3.2/` - `foo` 依赖的 `bar` 包的内容。
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - `/usr/lib/node/bar/4.3.2/` 的符号链接。
* `/usr/lib/node/bar/4.3.2/node_modules/*` - `bar` 所依赖的包的符号链接

因此，即便存在循环依赖或依赖冲突，每个模块还是可以获得它所依赖的包的一个可用版本。

当 `foo` 包中的代码调用 `require('bar')`，它会获得符号链接 `/usr/lib/node/foo/1.2.3/node_modules/bar` 指向的版本。
然后，当 `bar` 包中的代码调用 `require('queue')`，它会获得符号链接 `/usr/lib/node/bar/4.3.2/node_modules/quux` 指向的版本。

此外，为了进一步优化模块查找过程，不要将包直接放在 `/usr/lib/node` 目录中，而是将它们放在 `/usr/lib/node_modules/<name>/<version>` 目录中。
这样 Node.js 就不会在 `/usr/node_modules` 或 `/node_modules` 目录中查找缺失的依赖。

为了使模块在 Node.js 的 REPL 中可用，可能需要将 `/usr/lib/node_modules` 目录添加到 `$NODE_PATH` 环境变量中。
由于在 `node_modules` 目录中查找模块使用的是相对路径，而调用 `require()` 的文件是基于实际路径的，因此包本身可以放在任何地方。


## Caching

<!--type=misc-->

模块在第一次加载后会被缓存。
这也意味着（类似其他缓存机制）如果每次调用 `require('foo')` 都解析到同一文件，则返回相同的对象。

多次调用 `require(foo)` 不会导致模块的代码被执行多次。
这是一个重要的特性。
借助它, 可以返回“部分完成”的对象，从而允许加载传递的依赖, 即使它们会导致循环。

如果想要多次执行一个模块，可以导出一个函数，然后调用该函数。


### Module Caching Caveats

<!--type=misc-->

模块是基于其解析的文件名进行缓存的。
由于调用模块的位置的不同，模块可能被解析成不同的文件名（比如从 `node_modules` 目录加载），这样就不能保证 `require('foo')` 总能返回完全相同的对象。

此外，在不区分大小写的文件系统或操作系统中，被解析成不同的文件名可以指向同一文件，但缓存仍然会将它们视为不同的模块，并多次重新加载。
例如，`require('./foo')` 和 `require('./FOO')` 返回两个不同的对象，而不会管 `./foo` 和 `./FOO` 是否是相同的文件。


## Core Modules


<!--type=misc-->

模块是基于其解析的文件名进行缓存的。
由于调用模块的位置的不同，模块可能被解析成不同的文件名（比如从 `node_modules` 目录加载），这样就不能保证 `require('foo')` 总能返回完全相同的对象。

此外，在不区分大小写的文件系统或操作系统中，被解析成不同的文件名可以指向同一文件，但缓存仍然会将它们视为不同的模块，并多次重新加载。
例如，`require('./foo')` 和 `require('./FOO')` 返回两个不同的对象，而不会管 `./foo` 和 `./FOO` 是否是相同的文件。


## Cycles

<!--type=misc-->

当循环调用 `require()` 时，一个模块可能在未完成执行时被返回。

例如以下情况:

`a.js`:

```js
console.log('a 开始');
exports.done = false;
const b = require('./b.js');
console.log('在 a 中，b.done = %j', b.done);
exports.done = true;
console.log('a 结束');
```

`b.js`:

```js
console.log('b 开始');
exports.done = false;
const a = require('./a.js');
console.log('在 b 中，a.done = %j', a.done);
exports.done = true;
console.log('b 结束');
```

`main.js`:

```js
console.log('main 开始');
const a = require('./a.js');
const b = require('./b.js');
console.log('在 main 中，a.done=%j，b.done=%j', a.done, b.done);
```

当 `main.js` 加载 `a.js` 时，`a.js` 又加载 `b.js`。
此时，`b.js` 会尝试去加载 `a.js`。
为了防止无限的循环，会返回一个 `a.js` 的 `exports` 对象的 **未完成的副本** 给 `b.js` 模块。
然后 `b.js` 完成加载，并将 `exports` 对象提供给 `a.js` 模块。

当 `main.js` 加载这两个模块时，它们都已经完成加载。
因此，该程序的输出会是：

```txt
$ node main.js
main 开始
a 开始
b 开始
在 b 中，a.done = false
b 结束
在 a 中，b.done = true
a 结束
在 main 中，a.done=true，b.done=true
```

需要仔细的规划, 以允许循环模块依赖在应用程序内正常工作.

<!--type=misc-->

如果按确切的文件名没有找到模块，则 Node.js 会尝试带上 `.js`、`.json` 或 `.node` 拓展名再加载。

`.js` 文件会被解析为 JavaScript 文本文件，`.json` 文件会被解析为 JSON 文本文件。
`.node` 文件会被解析为通过 `dlopen` 加载的编译后的插件模块。

以 `'/'` 为前缀的模块是文件的绝对路径。
例如，`require('/home/marco/foo.js')` 会加载 `/home/marco/foo.js` 文件。

以 `'./'` 为前缀的模块是相对于调用 `require()` 的文件的。
也就是说，`circle.js` 必须和 `foo.js` 在同一目录下以便于 `require('./circle')` 找到它。

当没有以 `'/'`、`'./'` 或 `'../'` 开头来表示文件时，这个模块必须是一个核心模块或加载自 `node_modules` 目录。

如果给定的路径不存在，则 `require()` 会抛出一个 `code` 属性为 `'MODULE_NOT_FOUND'` 的 [`Error`]。


## Folders as Modules

<!--type=misc-->

可以把程序和库放到一个单独的目录，然后提供一个单一的入口来指向它。
把目录递给 `require()` 作为一个参数，有三种方式。

第一种方式是在根目录下创建一个 `package.json` 文件，并指定一个 `main` 模块。
例子，`package.json` 文件类似：

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

如果这是在 `./some-library` 目录中，则 `require('./some-library')` 会试图加载 `./some-library/lib/some-library.js`。

这就是 Node.js 处理 `package.json` 文件的方式。

注意：如果 `package.json` 中 `"main"` 入口指定的文件不存在，则无法解析，Node.js 会将模块视为不存在，并抛出默认错误：

```txt
Error: Cannot find module 'some-library'
```

如果目录里没有 `package.json` 文件，则 Node.js 就会试图加载目录下的 `index.js` 或 `index.node` 文件。
例如，如果上面的例子中没有 `package.json` 文件，则 `require('./some-library')` 会试图加载：

* `./some-library/index.js`
* `./some-library/index.node`


## Loading from `node_modules` Folders

<!--type=misc-->

如果传递给 `require()` 的模块标识符不是一个[核心模块]，也没有以 `'/'` 、 `'../'` 或 `'./'` 开头，则 Node.js 会从当前模块的父目录开始，尝试从它的 `/node_modules` 目录里加载模块。
Node.js 不会附加 `node_modules` 到一个已经以 `node_modules` 结尾的路径上。

如果还是没有找到，则移动到再上一层父目录，直到文件系统的根目录。

例子，如果在 `'/home/ry/projects/foo.js'` 文件里调用了 `require('bar.js')`，则 Node.js 会按以下顺序查找：

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

这使得程序本地化它们的依赖，避免它们产生冲突。

通过在模块名后包含一个路径后缀，可以请求特定的文件或分布式的子模块。
例如，`require('example-module/path/to/file')` 会把 `path/to/file` 解析成相对于 `example-module` 的位置。
后缀路径同样遵循模块的解析语法。


## Loading from the global folders

<!-- type=misc -->

如果 `NODE_PATH` 环境变量被设为一个以冒号分割的绝对路径列表，则当在其他地方找不到模块时 Node.js 会搜索这些路径。

注意：在 Windows 系统中，`NODE_PATH` 是以分号间隔的。

在当前的[模块解析]算法运行之前，`NODE_PATH` 最初是创建来支持从不同路径加载模块的。

虽然 `NODE_PATH` 仍然被支持，但现在不太需要，因为 Node.js 生态系统已制定了一套存放依赖模块的约定。
有时当人们没意识到 `NODE_PATH` 必须被设置时，依赖 `NODE_PATH` 的部署会出现意料之外的行为。
有时一个模块的依赖会改变，导致在搜索 `NODE_PATH` 时加载了不同的版本（甚至不同的模块）。

此外，Node.js 还会搜索以下位置：

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

其中 `$HOME` 是用户的主目录，`$PREFIX` 是 Node.js 里配置的 `node_prefix`。

这些主要是历史原因。

注意：强烈建议将所有的依赖放在本地的 `node_modules` 目录。
这样将会更快地加载，且更可靠。


## The module wrapper

<!-- type=misc -->

在执行模块代码之前，Node.js 会使用一个如下的函数包装器将其包装：

```js
(function(exports, require, module, __filename, __dirname) {
// 模块的代码实际上在这里
});
```

通过这样做，Node.js 实现了以下几点：

- 它保持了顶层的变量（用 `var`、`const` 或 `let` 定义）作用在模块范围内，而不是全局对象。
- 它有助于提供一些看似全局的但实际上是模块特定的变量，例如：
  - 实现者可以用于从模块中导出值的 `module` 和 `exports` 对象。
  - 包含模块绝对文件名和目录路径的快捷变量 `__filename` 和 `__dirname` 。
  

## The module scope

### \_\_dirname
<!-- YAML
added: v0.1.27
-->

* {string}
<!-- type=var -->
当前模块的文件夹名称。等同于 [`__filename`][] 的 [`path.dirname()`][] 的值。

<!--
The directory name of the current module. This the same as the
[`path.dirname()`][] of the [`__filename`][].
-->
示例：运行位于 `/Users/mjr`目录下的example.js文件：`node example.js`
<!--Example: running `node example.js` from `/Users/mjr`-->

```js
console.log(__dirname);
// Prints: /Users/mjr
console.log(path.dirname(__filename));
// Prints: /Users/mjr
```



### \_\_filename
<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

当前模块的文件名称---解析后的绝对路径。

在主程序中这不一定要跟命令行中使用的名称一致。

参阅 [`__dirname`][] 以获取当前模块的目录名称。

例如：

在 `/Users/mjr` 目录下执行 `node example.js` 

```js
console.log(__filename);
// Prints: /Users/mjr/example.js
console.log(__dirname);
// Prints: /Users/mjr
```

给定两个模块： `a` 和 `b`, 其中 `b` 是 `a` 的一个依赖。

文件目录结构如下：

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

`b.js` 中对 `__filename` 的引用将会返回 `/Users/mjr/app/node_modules/b/b.js`
`a.js` 中对 `__filename` 的引用将会返回 `/Users/mjr/app/a.js`

### exports
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

这是一个对于 `module.exports` 的更简短的引用形式。查看关于[exports shortcut][]的章节，详细了解什么时候使用`exports`、什么时候使用`module.exports`。


### module
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {Object}

对当前模块的引用, 查看关于 [`module` object][] 的章节。 `module.exports` 用于指定一个模块所导出的内容，即可以通过 `require()` 访问的内容。


### require()
<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* {Function}

引入模块.


#### require.cache
<!-- YAML
added: v0.3.0
-->

* {Object}

被引入的模块将被缓存在这个对象中。从此对象中删除键值对将会导致下一次 `require` 重新加载被删除的模块。注意不能删除 [native addons][]（原生插件），因为它们的重载将会导致错误。



#### require.extensions
<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> 稳定性: 0 - 废弃的

* {Object}

指示 `require` 怎样处理特定的文件扩展名

例如：把 `.sjs` 文件当做 `.js` 文件处理：

```js
require.extensions['.sjs'] = require.extensions['.js'];
```

**废弃的**  以前这被用来将非 JavaScript 模块按需编译后加载到 Node.js 中。
然而，在实践中，有更多更好的解决方案，比如用其它 Node.js 程序加载模块，
或者提前将它们编译为 JavaScript 模块。

由于模块系统已锁定，这个特性可能永远不会消失，但是鉴于其复杂性和可能导致的小问题，
最好不要碰它。

模块系统把一个 `require(...)` 解析为文件名的操作数随着新注册文件扩展名的增加
呈线性递增。

也就是说，增加文件扩展名数量降低了模块导入的速度，这不应该被提倡。


#### require.resolve()
<!-- YAML
added: v0.3.0
-->

使用内部的 `require()` 机制查询模块的位置,
此操作只返回解析后的文件名，不会加载此模块。


## The `module` Object
<!-- YAML
added: v0.3.0
-->

使用内部的 `require()` 机制查询模块的位置,
此操作只返回解析后的文件名，不会加载此模块。


### module.children
<!-- YAML
added: v0.1.16
-->

* {Array}

被该模块引用的模块对象。


### module.exports
<!-- YAML
added: v0.1.16
-->

* {Array}

被该模块引用的模块对象。



#### exports shortcut
<!-- YAML
added: v0.1.16
-->

`exports` 变量是在模块的文件级别作用域内有效的，它在模块被执行前被赋予 `module.exports` 的值。

它有一个快捷方式，以便 `module.exports.f = ...` 可以被更简洁地写成 `exports.f = ...`。
注意，就像任何变量，如果一个新的值被赋值给 `exports`，它就不再绑定到 `module.exports`：

```js
module.exports.hello = true; // 从对模块的引用中导出
exports = { hello: false };  // 不导出，只在模块内有效
```

当 `module.exports` 属性被一个新的对象完全替代时，也会重新赋值 `exports`，例如：

<!-- eslint-disable func-name-matching -->
```js
module.exports = exports = function Constructor() {
  // ... 及其他
};
```

为了解释这个行为，想象对 `require()` 的假设实现，它跟 `require()` 的实际实现相当类似：

```js
function require(/* ... */) {
  const module = { exports: {} };
  ((module, exports) => {
    // 模块代码在这。在这个例子中，定义了一个函数。
    function someFunc() {}
    exports = someFunc;
    // 此时，exports 不再是一个 module.exports 的快捷方式，
    // 且这个模块依然导出一个空的默认对象。
    module.exports = someFunc;
    // 此时，该模块导出 someFunc，而不是默认对象。
  })(module, module.exports);
  return module.exports;
}
```


### module.filename
<!-- YAML
added: v0.1.16
-->

* {string}

模块的完全解析后的文件名。


### module.id
<!-- YAML
added: v0.1.16
-->

* {string}

模块的标识符。
通常是完全解析后的文件名。


### module.loaded
<!-- YAML
added: v0.1.16
-->

* {boolean}

模块是否已经加载完成，或正在加载中。



### module.parent
<!-- YAML
added: v0.1.16
-->

* {Object} 模块对象

最先引用该模块的模块。


### module.paths
<!-- YAML
added: v0.4.0
-->

* {string}

模块的搜索路径。


### module.require(id)
<!-- YAML
added: v0.5.1
-->

* `id` {string}
* 返回: {Object} 已解析的模块的 `module.exports`

`module.require` 方法提供了一种类似 `require()` 从原始模块被调用的加载模块的方式。

注意，为了做到这个，需要获得一个 `module` 对象的引用。
因为 `require()` 会返回 `module.exports`，且 `module` **只**在一个特定的模块代码中有效，所以为了使用它，必须明确地导出。


[`__dirname`]: #modules_dirname
[`__filename`]: #modules_filename
[`Error`]: errors.html#errors_class_error
[`module` object]: #modules_the_module_object
[`path.dirname()`]: path.html#path_path_dirname_path
[exports shortcut]: #modules_exports_shortcut
[module resolution]: #modules_all_together
[native addons]: addons.html
[模块解析]: #modules_all_together
[module wrapper]: #modules_the_module_wrapper
[模块包装器]: #modules_the_module_wrapper
[核心模块]: #modules_core_modules