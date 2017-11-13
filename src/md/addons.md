# C++ Addons

Node.js 插件是用 C++ 编写的动态链接共享对象，可以使用 [`require()`] 函数加载到 Node.js 中，且像普通的 Node.js 模块一样被使用。
它们主要用于为运行在 Node.js 中的 JavaScript 与 C/C++ 库之间提供接口。

目前用于实现插件的方法相当复杂，涉及多个组件和 API 的知识：

 - V8：Node.js 目前用于提供 JavaScript 实现的 C++ 库。
   V8 提供了用于创建对象、调用函数等的机制。
   V8 的 API 文档主要在 `v8.h` 头文件中（Node.js 源代码中的 `deps/v8/include/v8.h`），也可以在查看 [V8 在线文档]。

 - [libuv]：实现了 Node.js 的事件循环、工作线程、以及平台所有的的异步操作的 C 库。
   它也是一个跨平台的抽象库，使所有主流操作系统中可以像 POSIX 一样访问常用的系统任务，比如与文件系统、socket、定时器、以及系统事件的交互。
   libuv 还提供了一个类似 POSIX 多线程的线程抽象，可被用于强化更复杂的需要超越标准事件循环的异步插件。
   建议插件开发者多思考如何通过在 libuv 的非阻塞系统操作、工作线程、或自定义的 libuv 线程中降低工作负载来避免在 I/O 或其他时间密集型任务中阻塞事件循环。

 - 内置的 Node.js 库。Node.js 自身开放了一些插件可以使用的 C++ API。
   其中最重要的是 `node::ObjectWrap` 类。

 - Node.js 包含一些其他的静态链接库，如 OpenSSL。
   这些库位于 Node.js 源代码中的 `deps/` 目录。
   只有 V8 和 OpenSSL 符号是被 Node.js 开放的，并且通过插件被用于不同的场景。
   更多信息可查看 [链接到 Node.js 自身的依赖]。

以下例子可从 [Node 插件示例] 下载，作为学习插件开发的起点。

## Hello world

“Hello World” 示例是一个简单的插件，用 C++ 编写，相当于以下 JavaScript 代码：

```js
module.exports.hello = () => 'world';
```

首先，创建 `hello.cc` 文件：

```cpp
// hello.cc
#include <node.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", Method);
}

NODE_MODULE(addon, init)

}  // namespace demo
```

注意，所有的 Node.js 插件必须导出一个如下模式的初始化函数：

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(module_name, Initialize)
```

`NODE_MODULE` 后面没有分号，因为它不是一个函数（详见 `node.h`）。

`module_name` 必须匹配最终的二进制文件名（不包括 .node 后缀）。

在 `hello.cc` 示例中，初始化函数是 `init`，插件模块名是 `addon`。



### Building

当源代码已被编写，它必须被编译成二进制 `addon.node` 文件。
要做到这点，需在项目的顶层创建一个名为 `binding.gyp` 的文件，它使用一个类似 JSON 的格式来描述模块的构建配置。
该文件会被 [node-gyp]（一个用于编译 Node.js 插件的工具）使用。


```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "hello.cc" ]
    }
  ]
}
```

注意：Node.js 会捆绑与发布一个版本的 `node-gyp` 工具作为 `npm` 的一部分。
该版本不可以直接被开发者使用，仅为了支持使用 `npm install` 命令编译与安装插件的能力。
需要直接使用 `node-gyp` 的开发者可以使用 `npm install -g node-gyp` 命令进行安装。
查看 `node-gyp` [安装说明]了解更多信息，包括平台特定的要求。

但 `binding.gyp` 文件已被创建，使用 `node-gyp configure` 为当前平台生成相应的项目构建文件。
这会在 `build/` 目录下生成一个 `Makefile` 文件（在 Unix 平台上）或 `vcxproj` 文件（在 Windows 上）。

下一步，调用 `node-gyp build` 命令生成编译后的 `addon.node` 的文件。
它会被放进 `build/Release/` 目录。

当使用 `npm install` 安装一个 Node.js 插件时，npm 会使用自身捆绑的 `node-gyp` 版本来执行同样的一套动作，为用户要求的平台生成一个插件编译后的版本。

当构建完成时，二进制插件就可以在 Node.js 中被使用，通过 [`require()`] 构建后的 `addon.node` 模块：

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// 打印: 'world'
```

请查看 <https://github.com/arturadib/node-qt> 了解生产环境中的例子。

因为编译后的二进制插件的确切路径取决于它如何被编译（比如有时它可能在 `./build/Debug/` 中），所以插件可以使用 [bindings] 包加载编译后的模块。

注意，虽然 `bindings` 包在如何定位插件模块的实现上更复杂，但它本质上使用了一个 `try-catch` 模式，类似如下：

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```


### Linking to Node.js' own dependencies

Node.js 使用了一些静态链接库，比如 V8 引擎、libuv 和 OpenSSL。
所有的插件都需要链接到 V8，也可能链接到任何其他依赖。
通常情况下，只要简单地包含相应的 `#include <...>` 声明（如 `#include <v8.h>`），则 `node-gyp` 会自动定位到相应的头文件。
但是也有一些注意事项需要注意：

* 当 `node-gyp` 运行时，它会检测指定的 Node.js 发行版本，并下载完整的源代码包或只是头文件。
如果下载了完整的源代码，则插件对全套的 Node.js 依赖有完全的访问权限。
如果只下载了 Node.js 的文件头，则只有 Node.js 导出的符号可用。

* `node-gyp` 可使用指向一个本地 Node.js 源代码镜像的 `--nodedir` 标志来运行。
如果使用该选项，则插件有全套依赖的访问权限。


### Loading Addons using require()

编译后的二进制插件的文件扩展名是 `.node`（而不是 `.dll` 或 `.so`）。
[`require()`] 函数用于查找具有 `.node` 文件扩展名的文件，并初始化为动态链接库。

当调用 [`require()`] 时，`.node` 拓展名通常可被省略，Node.js 仍会找到并初始化该插件。
注意，Node.js 会优先尝试查找并加载同名的模块或 JavaScript 文件。
例如，如果与二进制的 `addon.node` 同一目录下有一个 `addon.js` 文件，则 [`require('addon')`] 会优先加载 `addon.js` 文件。


## Native Abstractions for Node.js

文档中所示的每个例子都直接使用 Node.js 和 V8 的 API 来实现插件。
V8 的 API 可能并且已经与下一个 V8 的发行版本有显著的变化。
伴随着每次变化，插件为了能够继续工作，可能需要进行更新和重新编译。
Node.js 的发布计划会尽量减少这种变化的频率和影响，但 Node.js 目前可以确保 V8 API 的稳定性。

[Node.js 的原生抽象]（或称为 `nan`）提供了一组工具，建议插件开发者使用这些工具来保持插件在过往与将来的 V8 和 Node.js 的版本之间的兼容性。
查看 [`nan` 示例]了解它是如何被使用的。


## N-API

> Stability: 1 - Experimental

N-API is an API for building native Addons. It is independent from
the underlying JavaScript runtime (ex V8) and is maintained as part of
Node.js itself. This API will be Application Binary Interface (ABI) stable
across version of Node.js. It is intended to insulate Addons from
changes in the underlying JavaScript engine and allow modules
compiled for one version to run on later versions of Node.js without
recompilation. Addons are built/packaged with the same approach/tools
outlined in this document (node-gyp, etc.). The only difference is the
set of APIs that are used by the native code. Instead of using the V8
or [Native Abstractions for Node.js][] APIs, the functions available
in the N-API are used.

The functions available and how to use them are documented in the
section titled [C/C++ Addons - N-API](n-api.html).

## Addon examples

以下是一些插件示例，用于帮助开发者入门。
这些例子使用了 V8 的 API。
查看在线的 [V8 文档]有助于了解各种 V8 调用，V8 的[嵌入器指南]解释了句柄、作用域和函数模板等的一些概念。

每个示例都使用以下的 `binding.gyp` 文件：

```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ]
    }
  ]
}
```

如果有一个以上的 `.cc` 文件，则只需添加额外的文件名到 `sources` 数组。
例如：

```json
"sources": ["addon.cc", "myexample.cc"]
```

当 `binding.gyp` 文件准备就绪，则插件示例可以使用 `node-gyp` 进行配置和构建：

```console
$ node-gyp configure build
```




### Function arguments

插件通常会开放一些对象和函数，供运行在 Node.js 中的 JavaScript 访问。
当从 JavaScript 调用函数时，输入参数和返回值必须与 C/C++ 代码相互映射。

以下例子描述了如何读取从 JavaScript 传入的函数参数与如何返回结果：

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

// 这是 "add" 方法的实现
// 输入参数使用 const FunctionCallbackInfo<Value>& args 结构传入
void Add(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // 检查传入的参数的个数
  if (args.Length() < 2) {
    // 抛出一个错误并传回到 JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "参数的数量错误")));
    return;
  }

  // 检查参数的类型
  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "参数错误")));
    return;
  }

  // 执行操作
  double value = args[0]->NumberValue() + args[1]->NumberValue();
  Local<Number> num = Number::New(isolate, value);

  // 设置返回值
  args.GetReturnValue().Set(num);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add", Add);
}

NODE_MODULE(addon, Init)

}  // namespace demo
```

但已被编译，示例插件就可以在 Node.js 中引入和使用：

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```




### Callbacks

把 JavaScript 函数传入到一个 C++ 函数并在那里执行它们，这在插件里是常见的做法。
以下例子描述了如何调用这些回调：

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Null;
using v8::Object;
using v8::String;
using v8::Value;

void RunCallback(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Function> cb = Local<Function>::Cast(args[0]);
  const unsigned argc = 1;
  Local<Value> argv[argc] = { String::NewFromUtf8(isolate, "hello world") };
  cb->Call(Null(isolate), argc, argv);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", RunCallback);
}

NODE_MODULE(addon, Init)

}  // namespace demo
```

注意，该例子使用了一个带有两个参数的 `Init()`，它接收完整的 `module` 对象作为第二个参数。
这使得插件可以用一个单一的函数完全地重写 `exports`，而不是添加函数作为 `exports` 的属性。

为了验证它，运行以下 JavaScript：

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// 打印: 'hello world'
});
```

注意，在这个例子中，回调函数是被同步地调用。


### Object factory

插件可从 C++ 函数中创建并返回新的对象，如以下例子所示。
一个带有 `msg` 属性的对象被创建并返回，该属性会输出传入 `createObject()` 的字符串：

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  Local<Object> obj = Object::New(isolate);
  obj->Set(String::NewFromUtf8(isolate, "msg"), args[0]->ToString());

  args.GetReturnValue().Set(obj);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateObject);
}

NODE_MODULE(addon, Init)

}  // namespace demo
```

在 JavaScript 中测试它：

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// 打印: 'hello world'
```



### Function factory

另一种常见情况是创建 JavaScript 函数来包装 C++ 函数，并返回到 JavaScript：

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void MyFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "hello world"));
}

void CreateFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, MyFunction);
  Local<Function> fn = tpl->GetFunction();

  // 可以省略这步使它匿名
  fn->SetName(String::NewFromUtf8(isolate, "theFunction"));

  args.GetReturnValue().Set(fn);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateFunction);
}

NODE_MODULE(addon, Init)

}  // namespace demo
```

测试它：

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// 打印: 'hello world'
```



### Wrapping C++ objects

也可以包装 C++ 对象/类使其可以使用 JavaScript 的 `new` 操作来创建新的实例：

```cpp
// addon.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Local;
using v8::Object;

void InitAll(Local<Object> exports) {
  MyObject::Init(exports);
}

NODE_MODULE(addon, InitAll)

}  // namespace demo
```

然后，在 `myobject.h` 中，包装类继承自 `node::ObjectWrap`：

```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Local<v8::Object> exports);

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void PlusOne(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```

在 `myobject.cc` 中，实现要被开放的各种方法。
下面，通过把 `plusOne()` 添加到构造函数的原型来开放它：


```cpp
// myobject.cc
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // 准备构造函数模版
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // 原型
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "MyObject"),
               tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // 像构造函数一样调用：`new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // 像普通方法 `MyObject(...)` 一样调用，转为构造调用。
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> result =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(result);
  }
}

void MyObject::PlusOne(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
  obj->value_ += 1;

  args.GetReturnValue().Set(Number::New(isolate, obj->value_));
}

}  // namespace demo
```

要构建这个例子，`myobject.cc` 文件必须被添加到 `binding.gyp`：

```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "addon.cc",
        "myobject.cc"
      ]
    }
  ]
}
```

测试：

```js
// test.js
const addon = require('./build/Release/addon');

const obj = new addon.MyObject(10);
console.log(obj.plusOne());
// 打印: 11
console.log(obj.plusOne());
// 打印: 12
console.log(obj.plusOne());
// 打印: 13
```


### Factory of wrapped objects

也可以使用一个工厂模式，避免显式地使用 JavaScript 的 `new` 操作来创建对象实例：

```js
const obj = addon.createObject();
// 而不是：
// const obj = new addon.Object();
```

首先，在 `addon.cc` 中实现 `createObject()` 方法：

```cpp
// addon.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  MyObject::NewInstance(args);
}

void InitAll(Local<Object> exports, Local<Object> module) {
  MyObject::Init(exports->GetIsolate());

  NODE_SET_METHOD(module, "exports", CreateObject);
}

NODE_MODULE(addon, InitAll)

}  // namespace demo
```

在 `myobject.h` 中，添加静态方法 `NewInstance()` 来处理实例化对象。
这个方法用来代替在 JavaScript 中使用 `new`：

```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Isolate* isolate);
  static void NewInstance(const v8::FunctionCallbackInfo<v8::Value>& args);

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void PlusOne(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```

`myobject.cc` 中的实现类似与之前的例子：

```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Isolate* isolate) {
  // 准备构造函数模版
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // 原型
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // 像构造函数一样调用：`new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // 像普通方法 `MyObject(...)` 一样调用，转为构造调用。
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Context> context = isolate->GetCurrentContext();
    Local<Object> instance =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(instance);
  }
}

void MyObject::NewInstance(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  const unsigned argc = 1;
  Local<Value> argv[argc] = { args[0] };
  Local<Function> cons = Local<Function>::New(isolate, constructor);
  Local<Context> context = isolate->GetCurrentContext();
  Local<Object> instance =
      cons->NewInstance(context, argc, argv).ToLocalChecked();

  args.GetReturnValue().Set(instance);
}

void MyObject::PlusOne(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
  obj->value_ += 1;

  args.GetReturnValue().Set(Number::New(isolate, obj->value_));
}

}  // namespace demo
```

要构建这个例子，`myobject.cc` 文件必须被添加到 `binding.gyp`：

```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "addon.cc",
        "myobject.cc"
      ]
    }
  ]
}
```

测试：

```js
// test.js
const createObject = require('./build/Release/addon');

const obj = createObject(10);
console.log(obj.plusOne());
// 打印: 11
console.log(obj.plusOne());
// 打印: 12
console.log(obj.plusOne());
// 打印: 13

const obj2 = createObject(20);
console.log(obj2.plusOne());
// 打印: 21
console.log(obj2.plusOne());
// 打印: 22
console.log(obj2.plusOne());
// 打印: 23
```



### Passing wrapped objects around

除了包装和返回 C++ 对象，也可以通过使用 Node.js 的辅助函数 `node::ObjectWrap::Unwrap` 进行去包装来传递包装的对象。
以下例子展示了一个 `add()` 函数，它可以把两个 `MyObject` 对象作为输入参数：

```cpp
// addon.cc
#include <node.h>
#include <node_object_wrap.h>
#include "myobject.h"

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  MyObject::NewInstance(args);
}

void Add(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj1 = node::ObjectWrap::Unwrap<MyObject>(
      args[0]->ToObject());
  MyObject* obj2 = node::ObjectWrap::Unwrap<MyObject>(
      args[1]->ToObject());

  double sum = obj1->value() + obj2->value();
  args.GetReturnValue().Set(Number::New(isolate, sum));
}

void InitAll(Local<Object> exports) {
  MyObject::Init(exports->GetIsolate());

  NODE_SET_METHOD(exports, "createObject", CreateObject);
  NODE_SET_METHOD(exports, "add", Add);
}

NODE_MODULE(addon, InitAll)

}  // namespace demo
```

在 `myobject.h` 中，新增了一个新的公共方法用于在去包装对象后访问私有值。

```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Isolate* isolate);
  static void NewInstance(const v8::FunctionCallbackInfo<v8::Value>& args);
  inline double value() const { return value_; }

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```

`myobject.cc` 中的实现类似之前的例子：

```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Isolate* isolate) {
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  constructor.Reset(isolate, tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // 像构造函数一样调用：`new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // 像普通方法 `MyObject(...)` 一样调用，转为构造调用。
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> instance =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(instance);
  }
}

void MyObject::NewInstance(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  const unsigned argc = 1;
  Local<Value> argv[argc] = { args[0] };
  Local<Function> cons = Local<Function>::New(isolate, constructor);
  Local<Context> context = isolate->GetCurrentContext();
  Local<Object> instance =
      cons->NewInstance(context, argc, argv).ToLocalChecked();

  args.GetReturnValue().Set(instance);
}

}  // namespace demo
```

测试：

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// 打印: 30
```


### AtExit hooks

“AtExit” 钩子是一个函数，它在 Node.js 事件循环结束后、但在 JavaScript 虚拟机被终止与 Node.js 关闭前被调用。
“AtExit” 钩子使用 `node::AtExit` API 注册。


#### void AtExit(callback, args)

* `callback`: `void (*)(void*)` - 一个退出时调用的函数的指针。
* `args`: `void*` - 一个退出时传递给回调的指针。

注册的 AtExit 钩子会在事件循环结束之后但虚拟机被终止之前退出。

AtExit 有两个参数：一个退出时运行的回调函数的指针，和一个要传入回调的无类型的上下文数据的指针。

回调按照后进先出的顺序运行。

以下 `addon.cc` 实现了 AtExit：

```cpp
// addon.cc
#include <assert.h>
#include <stdlib.h>
#include <node.h>

namespace demo {

using node::AtExit;
using v8::HandleScope;
using v8::Isolate;
using v8::Local;
using v8::Object;

static char cookie[] = "yum yum";
static int at_exit_cb1_called = 0;
static int at_exit_cb2_called = 0;

static void at_exit_cb1(void* arg) {
  Isolate* isolate = static_cast<Isolate*>(arg);
  HandleScope scope(isolate);
  Local<Object> obj = Object::New(isolate);
  assert(!obj.IsEmpty()); // assert VM is still alive
  assert(obj->IsObject());
  at_exit_cb1_called++;
}

static void at_exit_cb2(void* arg) {
  assert(arg == static_cast<void*>(cookie));
  at_exit_cb2_called++;
}

static void sanity_check(void*) {
  assert(at_exit_cb1_called == 1);
  assert(at_exit_cb2_called == 2);
}

void init(Local<Object> exports) {
  AtExit(at_exit_cb2, cookie);
  AtExit(at_exit_cb2, cookie);
  AtExit(at_exit_cb1, exports->GetIsolate());
  AtExit(sanity_check);
}

NODE_MODULE(addon, init)

}  // namespace demo
```

测试：

```js
// test.js
require('./build/Release/addon');
```


[Embedder's Guide]: https://github.com/v8/v8/wiki/Embedder's%20Guide
[Linking to Node.js' own dependencies]: #addons_linking_to_node_js_own_dependencies
[Native Abstractions for Node.js]: https://github.com/nodejs/nan
[bindings]: https://github.com/TooTallNate/node-bindings
[download]: https://github.com/nodejs/node-addon-examples
[examples]: https://github.com/nodejs/nan/tree/master/examples/
[installation instructions]: https://github.com/nodejs/node-gyp#installation
[libuv]: https://github.com/libuv/libuv
[node-gyp]: https://github.com/nodejs/node-gyp
[require]: modules.html#modules_require
[v8-docs]: https://v8docs.nodesource.com/

[嵌入器指南]: https://github.com/v8/v8/wiki/Embedder's%20Guide
[链接到 Node.js 自身的依赖]: #addons_linking_to_node_js_own_dependencies
[Node.js 的原生抽象]: https://github.com/nodejs/nan
[Node 插件示例]: https://github.com/nodejs/node-addon-examples
[`nan` 示例]: https://github.com/nodejs/nan/tree/master/examples/
[安装说明]: https://github.com/nodejs/node-gyp#installation
[`require()`]: modules.html#modules_require
[`require('addon')`]: modules.html#modules_require
[v8 文档]: https://v8docs.nodesource.com/
[V8 在线文档]: https://v8docs.nodesource.com/
