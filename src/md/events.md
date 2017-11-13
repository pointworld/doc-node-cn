# Events

> 稳定性: 2 - 稳定的

<!--type=module-->

大多数 Node.js 核心 API 都采用惯用的异步事件驱动架构，其中某些类型的对象（触发器）会周期性地触发命名事件来调用函数对象（监听器）。

例如，[`net.Server`] 对象会在每次有新连接时触发事件；[`fs.ReadStream`] 会在文件被打开时触发事件；[流对象] 会在数据可读时触发事件。

所有能触发事件的对象都是 `EventEmitter` 类的实例。
这些对象开放了一个 `eventEmitter.on()` 函数，允许将一个或多个函数绑定到会被对象触发的命名事件上。
事件名称通常是驼峰式的字符串，但也可以使用任何有效的 JavaScript 属性名。

当 `EventEmitter` 对象触发一个事件时，所有绑定在该事件上的函数都被同步地调用。
监听器的返回值会被丢弃。

例子，一个绑定了一个监听器的 `EventEmitter` 实例。
`eventEmitter.on()` 方法用于注册监听器，`eventEmitter.emit()` 方法用于触发事件。

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('触发了一个事件！');
});
myEmitter.emit('event');
```


## Passing arguments and `this` to listeners

`eventEmitter.emit()` 方法允许将任意参数传给监听器函数。
当一个普通的监听器函数被 `EventEmitter` 调用时，标准的 `this` 关键词会被设置指向监听器所附加的 `EventEmitter`。

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
  console.log(a, b, this);
  // 打印:
  //   a b MyEmitter {
  //     domain: null,
  //     _events: { event: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined }
});
myEmitter.emit('event', 'a', 'b');
```

也可以使用 ES6 的箭头函数作为监听器。但是这样 `this` 关键词就不再指向 `EventEmitter` 实例：

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // 打印: a b {}
});
myEmitter.emit('event', 'a', 'b');
```


## Asynchronous vs. Synchronous

`EventListener` 会按照监听器注册的顺序同步地调用所有监听器。
所以需要确保事件的正确排序且避免竞争条件或逻辑错误。
监听器函数可以使用 `setImmediate()` 或 `process.nextTick()` 方法切换到异步操作模式：

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('这个是异步发生的');
  });
});
myEmitter.emit('event', 'a', 'b');
```



## Handling events only once

当使用 `eventEmitter.on()` 方法注册监听器时，监听器会在每次触发命名事件时被调用。

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 打印: 2
```

使用 `eventEmitter.once()` 方法时可以注册一个对于特定事件最多被调用一次的监听器。
当事件被触发时，监听器会被注销，然后再调用。


```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 忽略
```


## Error events

当 `EventEmitter` 实例中发生错误时，会触发一个 `'error'` 事件。
这在 Node.js 中是特殊情况。

如果 `EventEmitter` 没有为 `'error'` 事件注册至少一个监听器，则当 `'error'` 事件触发时，会抛出错误、打印堆栈跟踪、且退出 Node.js 进程。

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// 抛出错误，并使 Node.js 奔溃
```

为了防止 Node.js 进程崩溃，可以在 [`process` 对象的 `uncaughtException` 事件]上注册监听器，或使用 [`domain`] 模块。
（注意，`domain` 模块已被废弃。）

```js
const myEmitter = new MyEmitter();

process.on('uncaughtException', (err) => {
  console.error('有错误');
});

myEmitter.emit('error', new Error('whoops!'));
// 打印: 有错误
```

作为最佳实践，应该始终为 `'error'` 事件注册监听器。

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('有错误');
});
myEmitter.emit('error', new Error('whoops!'));
// 打印: 有错误
```


## Class: EventEmitter
<!-- YAML
added: v0.1.26
-->

`EventEmitter` 类由 `events` 模块定义和开放的：

```js
const EventEmitter = require('events');
```

当新的监听器被添加时，所有的 EventEmitter 会触发 `'newListener'` 事件；当移除已存在的监听器时，则触发 `'removeListener'`。


### Event: 'newListener'
<!-- YAML
added: v0.1.26
-->

* `eventName` {any} 要监听的事件的名称
* `listener` {Function} 事件的句柄函数

`EventEmitter` 实例会在一个监听器被添加到其内部监听器数组之前触发自身的 `'newListener'` 事件。

注册了 `'newListener'` 事件的监听器会传入事件名与被添加的监听器的引用。

事实上，在添加监听器之前触发事件有一个微妙但重要的副作用：
`'newListener'` 回调中任何额外的被注册到相同名称的监听器会在监听器被添加之前被插入 。


```js
const myEmitter = new MyEmitter();
// 只处理一次，所以不会无限循环
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // 在开头插入一个新的监听器
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// 打印:
//   B
//   A
```



### Event: 'removeListener'
<!-- YAML
added: v0.9.3
changes:
  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {any} 事件名
* `listener` {Function} 事件句柄函数

`'removeListener'` 事件在 `listener` 被移除后触发。


### EventEmitter.listenerCount(emitter, eventName)
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> 稳定性: 0 - 废弃的: 使用 [`emitter.listenerCount()`] 代替。

A class method that returns the number of listeners for the given `eventName`
registered on the given `emitter`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Prints: 2
```



### EventEmitter.defaultMaxListeners
<!-- YAML
added: v0.11.2
-->

每个事件默认可以注册最多 10 个监听器。
单个 `EventEmitter` 实例的限制可以使用 [`emitter.setMaxListeners(n)`] 方法改变。
所有 `EventEmitter` 实例的默认值可以使用 `EventEmitter.defaultMaxListeners` 属性改变。
如果这个值不是正数, 那将抛出 `TypeError`错误.

设置 `EventEmitter.defaultMaxListeners` 要谨慎，因为会影响所有 `EventEmitter` 实例，包括之前创建的。
因而，调用 [`emitter.setMaxListeners(n)`] 优先于 `EventEmitter.defaultMaxListeners`。

注意，这不是一个硬性限制。
`EventEmitter` 实例允许添加更多的监听器，但会向 `stderr` 输出跟踪警告，表明检测到一个可能的 EventEmitter 内存泄漏。
对于任何单个 `EventEmitter` 实例，`emitter.getMaxListeners()` 和 `emitter.setMaxListeners()` 方法可用于暂时地消除此警告：


```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // 做些操作
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

[`--trace-warnings`] 命令行标志可用于显示此类警告的堆栈跟踪。

触发的警告可以使用 [`process.on('warning')`] 检查，还有额外的 `emitter`、`type` 和 `count` 属性，分别代表事件触发器实例的引用、事件的名称、和附加的监听器的数量。
Its `name` property is set to `'MaxListenersExceededWarning'`.


### emitter.addListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

Alias for `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `...args` {any}

按监听器的注册顺序，同步地调用每个注册到名为 `eventName` 事件的监听器，并传入提供的参数。

如果事件有监听器，则返回 `true` ，否则返回 `false`。


### emitter.eventNames()
<!-- YAML
added: v6.0.0
-->

返回一个列出触发器已注册监听器的事件的数组。
数组中的值为字符串或符号。 

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// 打印: [ 'foo', 'bar', Symbol(symbol) ]
```


### emitter.getMaxListeners()
<!-- YAML
added: v1.0.0
-->

返回 `EventEmitter` 当前的最大监听器限制值，该值可以通过 [`emitter.setMaxListeners(n)`] 设置或默认为 [`EventEmitter.defaultMaxListeners`]。


### emitter.listenerCount(eventName)
<!-- YAML
added: v3.2.0
-->

* `eventName` {any} 正在被监听的事件名

返回正在监听名为 `eventName` 的事件的监听器的数量。


### emitter.listeners(eventName)
<!-- YAML
added: v0.1.26
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6881
    description: For listeners attached using `.once()` this returns the
                 original listeners instead of wrapper functions now.
-->
- `eventName` {any}

返回名为 `eventName` 的事件的监听器数组的副本。

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// 打印: [ [Function] ]
```



### emitter.on(eventName, listener)
<!-- YAML
added: v0.1.101
-->

* `eventName` {any} 事件名
* `listener` {Function} 回调函数

添加 `listener` 函数到名为 `eventName` 的事件的监听器数组的末尾。
不会检查 `listener` 是否已被添加。
多次调用并传入相同的 `eventName` 和 `listener` 会导致 `listener` 被添加与调用多次。


```js
server.on('connection', (stream) => {
  console.log('有连接！');
});
```

返回一个 `EventEmitter` 引用，可以链式调用。

默认情况下，事件监听器会按照添加的顺序依次调用。
`emitter.prependListener()` 方法可用于将事件监听器添加到监听器数组的开头。

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// 打印:
//   b
//   a
```



### emitter.once(eventName, listener)
<!-- YAML
added: v0.3.0
-->

* `eventName` {any} 事件名
* `listener` {Function} 回调函数

添加一个单次 `listener` 函数到名为 `eventName` 的事件。
下次触发 `eventName` 事件时，监听器会被移除，然后调用。

```js
server.once('connection', (stream) => {
  console.log('首次调用！');
});
```

返回一个 `EventEmitter` 引用，可以链式调用。

默认情况下，事件监听器会按照添加的顺序依次调用。
`emitter.prependOnceListener()` 方法可用于将事件监听器添加到监听器数组的开头。

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// 打印:
//   b
//   a
```



### emitter.prependListener(eventName, listener)
<!-- YAML
added: v6.0.0
-->

* `eventName` {any} 事件名
* `listener` {Function} 回调函数

添加 `listener` 函数到名为 `eventName` 的事件的监听器数组的开头。
不会检查 `listener` 是否已被添加。
多次调用并传入相同的 `eventName` 和 `listener` 会导致 `listener` 被添加与调用多次。

```js
server.prependListener('connection', (stream) => {
  console.log('有连接！');
});
```

返回一个 `EventEmitter` 引用，可以链式调用。


### emitter.prependOnceListener(eventName, listener)
<!-- YAML
added: v6.0.0
-->

* `eventName` {any} 事件名
* `listener` {Function} 回调函数

添加一个单次 `listener` 函数到名为 `eventName` 的事件的监听器数组的开头。
下次触发 `eventName` 事件时，监听器会被移除，然后调用。

```js
server.prependOnceListener('connection', (stream) => {
  console.log('首次调用！');
});
```

返回一个 `EventEmitter` 引用，可以链式调用。


### emitter.removeAllListeners([eventName])
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}

移除全部或指定 `eventName` 的监听器。

注意，在代码中移除其他地方添加的监听器是一个不好的做法，尤其是当 `EventEmitter` 实例是其他组件或模块（如 socket 或文件流）创建的。

返回一个 `EventEmitter` 引用，可以链式调用。


### emitter.removeListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

从名为 `eventName` 的事件的监听器数组中移除指定的 `listener`。

```js
const callback = (stream) => {
  console.log('有连接！');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener` 最多只会从监听器数组里移除一个监听器实例。
如果任何单一的监听器被多次添加到指定 `eventName` 的监听器数组中，则必须多次调用 `removeListener` 才能移除每个实例。

注意，一旦一个事件被触发，所有绑定到它的监听器都会按顺序依次触发。
这意味着，在事件触发后、最后一个监听器完成执行前，任何 `removeListener()` 或 `removeAllListeners()` 调用都不会从 `emit()` 中移除它们。
随后的事件会像预期的那样发生。

```js
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA 移除了监听器 callbackB，但它依然会被调用。
// 触发是内部的监听器数组为 [callbackA, callbackB]
myEmitter.emit('event');
// 打印:
//   A
//   B

// callbackB 被移除了。
// 内部监听器数组为 [callbackA]
myEmitter.emit('event');
// 打印:
//   A

```

因为监听器是使用内部数组进行管理的，所以调用它会改变在监听器被移除后注册的任何监听器的位置索引。
虽然这不会影响监听器的调用顺序，但意味着由 `emitter.listeners()` 方法返回的监听器数组副本需要被重新创建。

返回一个 `EventEmitter` 引用，可以链式调用。


### emitter.setMaxListeners(n)
<!-- YAML
added: v0.3.5
-->
- `n` {integer}

默认情况下，如果为特定事件添加了超过 `10` 个监听器，则 `EventEmitter` 会打印一个警告。
此限制有助于寻找内存泄露。
但是，并不是所有的事件都要被限为 `10` 个。
`emitter.setMaxListeners()` 方法允许修改指定的 `EventEmitter` 实例的限制。
值设为 `Infinity`（或 `0`）表明不限制监听器的数量。

返回一个 `EventEmitter` 引用，可以链式调用。

[`--trace-warnings`]: cli.html#cli_trace_warnings
[`EventEmitter.defaultMaxListeners`]: #events_eventemitter_defaultmaxlisteners
[`domain`]: domain.html
[`emitter.listenerCount()`]: #events_emitter_listenercount_eventname
[`emitter.setMaxListeners(n)`]: #events_emitter_setmaxlisteners_n
[`fs.ReadStream`]: fs.html#fs_class_fs_readstream
[`net.Server`]: net.html#net_class_net_server
[`process.on('warning')`]: process.html#process_event_warning
[`process` object's `uncaughtException` event]: process.html#process_event_uncaughtexception
[stream]: stream.html

[`process` 对象的 `uncaughtException` 事件]: process.html#process_event_uncaughtexception
[流对象]: stream.html
