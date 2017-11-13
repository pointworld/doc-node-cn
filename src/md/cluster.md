# Cluster

> 稳定性: 2 - 稳定的

一个单一的 Node.js 实例运行在一个单独的线程上。
为了利用多核系统，用户有时会想启动一个 Node.js 进程的集群去处理负载。

`cluster` 模块可以轻松地创建一些共享服务器端口的子进程。

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 衍生工作进程。
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
  });
} else {
  // 工作进程可以共享任何 TCP 连接。
  // 在本例子中，共享的是一个 HTTP 服务器。
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('你好世界\n');
  }).listen(8000);

  console.log(`工作进程 ${process.pid} 已启动`);
}
```

运行 Node.js 则工作进程就会共享 8000 端口：

```txt
$ node server.js
主进程 3596 正在运行
工作进程 4324 已启动
工作进程 4520 已启动
工作进程 6056 已启动
工作进程 5644 已启动
```

注意，在 Windows 上还不能在一个工作进程中建立一个命名的管道服务器。


## How It Works

<!--type=misc-->

工作进程由[`child_process.fork()`][]方法创建，因此它们可以使用IPC和父进程通信，从而使各进程交替处理连接服务。

cluster模块支持两种连接分发模式（将新连接安排给某一工作进程处理）。

第一种方法（也是除Windows外所有平台的默认方法），是循环法。由主进程负责监听端口，接收新连接后再将连接循环分发给工作进程。在分发中使用了一些内置技巧防止工作进程任务过载。

第二种方法是，主进程创建监听socket后发送给感兴趣的工作进程，由工作进程负责直接接收连接。

理论上第二种方法应该是效率最佳的，但在实际情况下，由于操作系统调度机制的难以捉摸，会使分发变得不稳定。我们遇到过这种情况：8个进程中的2个，分担了70%的负载。

因为`server.listen()`将大部分工作交给主进程完成，因此导致普通Node.js进程与cluster作业进程差异的情况有三种：
1. `server.listen({fd: 7})`由于文件描述符“7”是传递给父进程的，这个文件被监听后，将文件句柄（handle）传递给工作进程，而不是文件描述符“7”本身。
2. `server.listen(handle)` 明确监听句柄，会导致工作进程直接使用该句柄，而不是和父进程通信。
3. `server.listen(0)` 正常情况下，这种调用会导致server在随机端口上监听。但在cluster模式中，所有工作进程每次调用`listen(0)`时会收到相同的“随机”端口。实质上，这种端口只在第一次分配时随机，之后就变得可预料。如果要使用独立端口的话，应该根据工作进程的ID来生成端口号。

*注意*：Node.js不支持路由逻辑。因此在设计应用时，不应该过分依赖内存数据对象（如sessions和login等）。

由于各工作进程是独立的进程，它们可以根据需要随时关闭或重新生成，而不影响其他进程的正常运行。只要有存活的工作进程，服务器就可以继续处理连接。如果没有存活的工作进程，现有连接会丢失，新的连接也会被拒绝。Node.js不会自动管理工作进程的数量，而应该由具体的应用根据实际需要来管理进程池。




## Class: Worker
<!-- YAML
added: v0.7.0
-->

Workder对象包含了关于工作进程的所有public信息和方法。

在一个主进程里，可以使用`cluster.workers`来获取Worker对象。

在一个工作进程里，可以使用`cluster.worker`来获取Worker对象。


### Event: 'disconnect'
<!-- YAML
added: v0.7.7
-->

和`cluster.on('disconnect')`事件类似，不同之处在于特指这个工作进程。
```js
cluster.fork().on('disconnect', () => {
  // Worker has disconnected
});
```



### Event: 'error'
<!-- YAML
added: v0.7.3
-->

此事件和 [`child_process.fork()`][]提供的error事件相同。

在一个工作进程中，可以使用`process.on('error')`


### Event: 'exit'
<!-- YAML
added: v0.11.2
-->

* `code` {number} 若正常退出，表示退出代码.
* `signal` {string} 引发进程被kill的信号名称（如`'SIGHUP'`）.

和`cluster.on('exit')`事件类似，但针对特定的工作进程。

```js
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
  if (signal) {
    console.log(`worker was killed by signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`worker exited with error code: ${code}`);
  } else {
    console.log('worker success!');
  }
});
```



### Event: 'listening'
<!-- YAML
added: v0.7.0
-->

* `address` {Object}

和`cluster.on('listening')`事件类似，但针对特定的工作进程。

```js
cluster.fork().on('listening', (address) => {
  // Worker is listening
});
```

本事件不会在工作进程内触发。

### Event: 'message'
<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

和`cluster.on('message')`事件类似，但针对特定的工作进程。

在工作进程内，可以使用`process.on('message')`

详见 [`process` event: `'message'`][].

在下面这个例子中，我们使用message机制来实现主进程统计cluster中请求数量的功能。

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // 跟踪 http 请求
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // 计算请求数目
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // 启动 worker 并监听包含 notifyRequest 的消息
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // Worker 进程有一个http服务器
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // 通知 master 进程接收到了请求
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```


### Event: 'online'
<!-- YAML
added: v0.7.0
-->

和`cluster.on('online')`事件类似，但针对特定的工作进程。

```js
cluster.fork().on('online', () => {
  // Worker is online
});
```

本事件不会在工作进程内部被触发。



### worker.disconnect()
<!-- YAML
added: v0.7.7
changes:
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Returns: {Worker} 一个 `worker` 的引用。

在一个工作进程内，调用此方法会关闭所有的server，并等待这些server的 `'close'`事件执行，然后关闭IPC管道。

在主进程内，会给工作进程发送一个内部消息，导致工作进程自身调用`.disconnect()`。

会设置`.exitedAfterDisconnect` 。

需要注意的是，当一个server关闭后，它将不再接收新的连接，但新连接会被其他正在监听的工作进程接收。已建立的连接可以正常关闭。当所有连接都关闭后，通往该工作进程的IPC管道将会关闭，允许工作进程优雅地死掉，详见 [`server.close()`][]。

以上情况只针对服务端连接，工作进程不会自动关闭客户端连接，disconnect方法在退出前并不会等待客户端连接关闭。

需要注意的是，我们这里的方法是[`disconnect`][]，同时还有一个不一样的方法`process.disconnect`，大家不要混淆了。

由于长时间运行的服务端连接可能导致工作进程的disconnect方法阻塞，我们可以采用发送消息的方法，让应用采取相应的动作来关闭连接。也可以通过设置timeout，当`'disconnect'`事件在某段时间后仍没有触发时关闭工作进程。

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  let timeout;

  worker.on('listening', (address) => {
    worker.send('shutdown');
    worker.disconnect();
    timeout = setTimeout(() => {
      worker.kill();
    }, 2000);
  });

  worker.on('disconnect', () => {
    clearTimeout(timeout);
  });

} else if (cluster.isWorker) {
  const net = require('net');
  const server = net.createServer((socket) => {
    // 连接永远不会结束
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // 将所有与服务器的连接优雅关闭
    }
  });
}
```

### worker.exitedAfterDisconnect
<!-- YAML
added: v6.0.0
-->

* {boolean}

当调用 `.kill()` 或者 `.disconnect()`方法时被设置，在这之前都是 `undefined`。

`worker.exitedAfterDisconnect`可以用于区分自发退出还是被动退出，主进程可以根据这个值决定是否重新衍生新的工作进程。

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// 关闭 worker
worker.kill();
```


### worker.id
<!-- YAML
added: v0.8.0
-->

* {number}

每一个新衍生的工作进程都会被赋予自己独一无二的编号，这个编号就是储存在`id`里面。

当工作进程还存活时，`id`可以作为在cluster.workers中的索引。


### worker.isConnected()
<!-- YAML
added: v0.11.14
-->

当工作进程通过IPC管道连接至主进程时，这个方法返回`true`，否则返回`false`。

一个工作进程在创建后会自动连接到它的主进程，当`'disconnect'` 事件被触发时才会断开连接。

### worker.isDead()
<!-- YAML
added: v0.11.14
-->

当工作进程被终止时（包括自动退出或被发送信号），这个方法返回`true` ，否则返回`false`。


### worker.kill([signal='SIGTERM'])
<!-- YAML
added: v0.9.12
-->

* `signal` {string} 被发送kill信号的工作进程名称。

这个方法将会kill工作进程。在主进程中，通过断开与`worker.process`的连接来实现，一旦断开连接后，通过`signal`来杀死工作进程。在工作进程中，通过断开IPC管道来实现，然后以代码`0`退出进程。

将导致`.exitedAfterDisconnect`被设置。

为向后兼容，这个方法与`worker.destroy()`等义。

需要注意的是，在工作进程中有一个方法`process.kill()` ，这个方法本方法不同，本方法是[`kill`][]。


### worker.process
<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

所有的工作进程都是通过[`child_process.fork()`][]来创建的，这个方法返回的对象被存储为`.process`。在工作进程中， `process`属于全局对象。

详见：[Child Process module][]

需要注意：当`process`上发生 `'disconnect'`事件，并且`.exitedAfterDisconnect`的值不是`true`时，工作进程会调用 `process.exit(0)`。这样就可以防止连接意外断开。


### worker.send(message[, sendHandle][, callback])
<!-- YAML
added: v0.7.0
changes:
  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `callback` {Function}
* Returns: Boolean

发送一个消息给工作进程或主进程，也可以附带发送一个handle。

主进程调用这个方法会发送消息给具体的工作进程。还有一个等价的方法是[`ChildProcess.send()`][]。

工作进程调用这个方法会发送消息给主进程。还有一个等价方法是`process.send()`。

这个例子里面，工作进程将主进程发送的消息echo回去。

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  worker.send('hi there');

} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    process.send(msg);
  });
}
```


## Event: 'disconnect'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

在工作进程的IPC管道被断开后触发本事件。可能导致事件触发的原因包括：工作进程优雅地退出、被kill或手动断开连接（如调用worker.disconnect()）。

`'disconnect'` 和 `'exit'`事件之间可能存在延迟。这些事件可以用来检测进程是否在清理过程中被卡住，或是否存在长时间运行的连接。

```js
cluster.on('disconnect', (worker) => {
  console.log(`The worker #${worker.id} has disconnected`);
});
```



## Event: 'exit'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} 正常退出情况下，是退出代码.
* `signal` {string} 导致进程被kill的信号名称 (例如 `'SIGHUP'`)

当任何一个工作进程关闭的时候，cluster模块都将触发`'exit'`事件。

可以被用来重启工作进程（）通过调用`.fork()`）。

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d died (%s). restarting...',
              worker.process.pid, signal || code);
  cluster.fork();
});
```

详见： [child_process event: 'exit'][]。


## Event: 'fork'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

当新的工作进程被fork时，cluster模块将触发`'fork'`事件。
可以被用来记录工作进程活动，产生一个自定义的timeout。

```js
const timeouts = [];
function errorMsg() {
  console.error('Something must be wrong with the connection ...');
}

cluster.on('fork', (worker) => {
  timeouts[worker.id] = setTimeout(errorMsg, 2000);
});
cluster.on('listening', (worker, address) => {
  clearTimeout(timeouts[worker.id]);
});
cluster.on('exit', (worker, code, signal) => {
  clearTimeout(timeouts[worker.id]);
  errorMsg();
});
```



## Event: 'listening'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}
* `address` {Object}

当一个工作进程调用`listen()`后，工作进程上的server会触发`'listening'` 事件，同时主进程上的 `cluster` 也会被触发`'listening'`事件。

事件处理器使用两个参数来执行，其中`worker`包含了工作进程对象，`address` 包含了以下连接属性： `address`、`port` 和 `addressType`。当工作进程同时监听多个地址时，这些参数非常有用。

```js
cluster.on('listening', (worker, address) => {
  console.log(
    `A worker is now connected to ${address.address}:${address.port}`);
});
```

`addressType` 可选值包括:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (unix domain socket)
* `"udp4"` or `"udp6"` (UDP v4 or v6)


## Event: 'message'
<!-- YAML
added: v2.5.0
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5361
    description: The `worker` parameter is passed now; see below for details.
-->

* `worker` {cluster.Worker}
* `message` {Object}
* `handle` {undefined|Object}

当cluster主进程接收任意工作进程发送的消息后被触发。

详见： [child_process event: 'message'][]。

和文档情况相反的是：在Node.js v6.0版本之前，这个事件仅仅接受两个参数：消息和handle，而没有工作进程对象。

如果要兼容旧版本并且不需要工作进程对象的情况下，可以通过判断参数数量来实现兼容。

```js
cluster.on('message', (worker, message, handle) => {
  if (arguments.length === 2) {
    handle = message;
    message = worker;
    worker = undefined;
  }
  // ...
});
```


## Event: 'online'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

当新建一个工作进程后，工作进程应当响应一个online消息给主进程。当主进程收到online消息后触发这个事件。
 `'fork'` 事件和 `'online'`事件的不同之处在于，前者是在主进程新建工作进程后触发，而后者是在工作进程运行的时候触发。

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```



## Event: 'setup'
<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Emitted every time `.setupMaster()` is called.

每当 `.setupMaster()`  被调用的时候触发。

`settings` 对象是 `setupMaster()` 被调用时的 `cluster.settings` 对象，并且只能查询，因为在一个 tick 内 `.setupMaster()` 可以被调用多次。

如果精确度十分重要，请使用 `cluster.settings`。

## cluster.disconnect([callback])
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} 当所有工作进程都断开连接并且所有handle关闭的时候调用。

在`cluster.workers`的每个工作进程中调用 `.disconnect()`。

当所有工作进程断开连接后，所有内部handle将会关闭，这个时候如果没有等待事件的话，运行主进程优雅地关闭。

这个方法可以选择添加一个回调参数，当结束时会调用这个回调函数。

这个方法只能由主进程调用。


## cluster.fork([env])
<!-- YAML
added: v0.6.0
-->

* `env` {Object} 增加进程环境变量，以Key/value对的形式。
* return {cluster.Worker}

衍生出一个新的工作进程。

只能通过主进程调用。


## cluster.isMaster
<!-- YAML
added: v0.8.1
-->

* {boolean}

当该进程是主进程时，返回 true。这是由`process.env.NODE_UNIQUE_ID`决定的，当`process.env.NODE_UNIQUE_ID`为定义时，`isMaster`为`true`。


## cluster.isWorker
<!-- YAML
added: v0.6.0
-->

* {boolean}

当进程不是主进程时，返回 true。（和`cluster.isMaster`刚好相反）


## cluster.schedulingPolicy
<!-- YAML
added: v0.11.2
-->


调度策略，包括循环计数的 `cluster.SCHED_RR`，以及由操作系统决定的`cluster.SCHED_NONE`。
这是一个全局设置，当第一个工作进程被衍生或者调动`cluster.setupMaster()`时，都将第一时间生效。

除Windows外的所有操作系统中，`SCHED_RR`都是默认设置。只要libuv可以有效地分发IOCP handle，而不会导致严重的性能冲击的话，Windows系统也会更改为`SCHED_RR`。

`cluster.schedulingPolicy` 可以通过设置`NODE_CLUSTER_SCHED_POLICY`环境变量来实现。这个环境变量的有效值包括`"rr"` 和 `"none"`。


## cluster.settings
<!-- YAML
added: v0.7.1
changes:
  - version: 8.2.0
    pr-url: https://github.com/nodejs/node/pull/14140
    description: The `inspectPort` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* {Object}
  * `execArgv` {Array} 传递给Node.js可执行文件的参数列表。 (Default=`process.execArgv`)
  * `exec` {string} worker文件路径。 (Default=`process.argv[1]`)
  * `args` {Array} 传递给worker的参数。(Default=`process.argv.slice(2)`)
  * `silent` {boolean} 是否需要发送输出值父进程的stdio。(Default=`false`)
  * `stdio` {Array} 配置fork进程的stdio。  由于cluster模块运行依赖于IPC，这个配置必须包含`'ipc'`。当提供了这个选项后，将撤销`silent`。
  * `uid` {number} 设置进程的user标识符。 (见 setuid(2).)
  * `gid` {number} 设置进程的group标识符。 (见 setgid(2).)
  * `inspectPort` {number|function} Sets inspector port of worker.
    This can be a number, or a function that takes no arguments and returns a
    number. By default each worker gets its own port, incremented from the
    master's `process.debugPort`.

调用`.setupMaster()` (或 `.fork()`)后，这个settings对象将会包含这些设置项，包括默认值。

这个对象不打算被修改或手动设置。

## cluster.setupMaster([settings])
<!-- YAML
added: v0.7.1
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} 详见 [`cluster.settings`]。

用于修改默认'fork' 行为。一旦调用，将会按照`cluster.settings`进行设置。

注意:


* 所有的设置只对后来的 `.fork()`调用有效，对之前的工作进程无影响。
* 唯一无法通过 `.setupMaster()`设置的属性是传递给`.fork()`的`env`属性。
* 上述的默认值只在第一次调用时有效，当后续调用时，将采用`cluster.setupMaster()`调用时的当前值。

例子:

```js
const cluster = require('cluster');
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'https'],
  silent: true
});
cluster.fork(); // https worker
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'http']
});
cluster.fork(); // http worker
```

只能由主进程调用。


## cluster.worker
<!-- YAML
added: v0.7.0
-->

* {Object}

当前工作进程对象的引用，对于主进程则无效。

```js
const cluster = require('cluster');

if (cluster.isMaster) {
  console.log('I am master');
  cluster.fork();
  cluster.fork();
} else if (cluster.isWorker) {
  console.log(`I am worker #${cluster.worker.id}`);
}
```




## cluster.workers
<!-- YAML
added: v0.7.0
-->

* {Object}

这是一个哈希表，储存了活跃的工作进程对象，`id`作为key。有了它，可以方便地遍历所有工作进程。只能在主进程中调用。

工作进程断开连接以及退出后，将会从cluster.workers里面移除。这两个事件的先后顺序并不能预先确定，但可以保证的是，
cluster.workers的移除工作在`'disconnect'` 和 `'exit'`两个事件中的最后一个触发之前完成。

```js
// Go through all workers
function eachWorker(callback) {
  for (const id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}
eachWorker((worker) => {
  worker.send('big announcement to all workers');
});
```
使用工作进程的id来进行定位索引是最方便的！

```js
socket.on('data', (id) => {
  const worker = cluster.workers[id];
});
```

[`ChildProcess.send()`]: child_process.html#child_process_child_send_message_sendhandle_options_callback
[`child_process.fork()`]: child_process.html#child_process_child_process_fork_modulepath_args_options
[`disconnect`]: child_process.html#child_process_child_disconnect
[`kill`]: process.html#process_process_kill_pid_signal
[`process` event: `'message'`]: process.html#process_event_message
[`server.close()`]: net.html#net_event_close
[`worker.exitedAfterDisconnect`]: #cluster_worker_exitedafterdisconnect
[Child Process module]: child_process.html#child_process_child_process_fork_modulepath_args_options
[child_process event: 'exit']: child_process.html#child_process_event_exit
[child_process event: 'message']: child_process.html#child_process_event_message
[`cluster.settings`]: #clustersettings
