
# About this Documentation

<!--introduced_in=v0.10.0-->
<!-- type=misc -->


<!-- type=misc -->

本文档的目的是为了全面地讲解 Node.js 的 API，包括使用方法与相关概念。
每个章节分别介绍一个内置模块或高级概念。

每个主题的标题下会列出属性的类型、方法的参数、以及事件处理回调函数的参数等。


Every `.html` document has a corresponding `.json` document presenting
the same information in a structured manner. This feature is
experimental, and added for the benefit of IDEs and other utilities that
wish to do programmatic things with the documentation.

Every `.html` and `.json` file is generated based on the corresponding
`.md` file in the `doc/api/` folder in Node.js's source tree. The
documentation is generated using the `tools/doc/generate.js` program.
The HTML template is located at `doc/template.html`.


If errors are found in this documentation, please [submit an issue][]
or see [the contributing guide][] for directions on how to submit a patch.

## Stability Index

<!--type=misc-->

文档中每个章节都有稳定性标志。
Node.js 的 API 仍会有少量变化，但随着发展，API 会越来越稳定可靠。
有些 API 久经验证、且被大量依赖，它们几乎不会再变化。
也有些 API 是新增的、或试验的、或被认定为有风险且正在被重新设计中的。

稳定性指数如下：

```txt
稳定性: 0 - 废弃的
该特性被认定为存在问题，且可能会计划修改。
不要依赖该特性。
使用该特性可能会产生警告信息。
该特性不会做向后兼容。
```

```txt
稳定性: 1 - 试验的
该特性仍处于开发中，且未来改变时不做向后兼容，甚至可能被移除。
不建议在生产环境中使用该特性。
```

```txt
稳定性: 2 - 稳定的
该特性已被证明是符合要求的。
与 npm 生态系统的兼容性是最高优先级，除非有必要否则不会变化。
```


## JSON Output

> 稳定性: 1 - 试验的

每个通过 markdown 生成的 HTML 文件都有一个对应的具有相同数据的 JSON 文件。

这个特性是 Node.js v0.6.12 新增的。
该特性是试验的。


## Syscalls and man pages

系统调用定义了用户程序和底层操作系统之间的接口，例如 open(2)、 read(2)。
Node 函数只是简单地封装了系统调用，例如 `fs.open()`。
相应的帮助文档会描述系统调用是如何工作的。

有些系统调用是 BSD 系统特有的，例如 lchown(2)。
这意味着 `fs.lchown()` 只适用于 macOS 和其他 BSD 衍生系统，在 Linux 上不可用。

大部分 Unix 系统调用都有对应的 Windows 版本，但 Windows 版本运行起来可能与 Linux 和 macOS 的有些差异。
有些 Unix 系统调用无法在 Windows 中找到对应的操作语义，详见[议题4760]。


[submit an issue]: https://github.com/nodejs/node/issues/new
[the contributing guide]: https://github.com/nodejs/node/blob/master/CONTRIBUTING.md

[议题4760]: https://github.com/nodejs/node/issues/4760