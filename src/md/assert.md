# Assert

> 稳定性: 2

`assert` 模块提供了断言测试的函数，用于测试不变式。


## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

An alias of [`assert.ok()`][].

## assert.deepEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: Set and Map content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

测试 `actual` 参数与 `expected` 参数是否深度相等。
原始值使用[相等运算符]（`==`）比较。

只测试[可枚举的自身属性]，不测试对象的[原型]、连接符、或不可枚举的属性（这些情况使用 [`assert.deepStrictEqual()`]）。
例如，下面的例子不会抛出 `AssertionError`，因为 [`Error`] 对象的属性不是可枚举的：

```js
// 不会抛出 AssertionError。
assert.deepEqual(Error('a'), Error('b'));
```

[`Map`] 和 [`Set`] 包含的子项也会被测试。

子对象中可枚举的自身属性也会被测试：

```js
const assert = require('assert');

const obj1 = {
  a: {
    b: 1
  }
};
const obj2 = {
  a: {
    b: 2
  }
};
const obj3 = {
  a: {
    b: 1
  }
};
const obj4 = Object.create(obj1);

assert.deepEqual(obj1, obj1);
// 测试通过，对象与自身相等。

assert.deepEqual(obj1, obj2);
// 抛出 AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// 因为 b 属性的值不同。

assert.deepEqual(obj1, obj3);
// 测试通过，两个对象相等。

assert.deepEqual(obj1, obj4);
// 抛出 AssertionError: { a: { b: 1 } } deepEqual {}
// 因为不测试原型。
```

如果两个值不相等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.deepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: Set and Map content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

与 `assert.deepEqual()` 大致相同，但有三个区别：

1. 原始值使用[全等运算符]（`===`）比较。`Set` 的值与 `Map` 的键使用 [SameValueZero] 比较。
2. 对象的[原型]也使用全等运算符比较。
3. 对象的[类型标签]要求相同。

```js
const assert = require('assert');

assert.deepEqual({ a: 1 }, { a: '1' });
// 测试通过，因为 1 == '1'。

assert.deepStrictEqual({ a: 1 }, { a: '1' });
// 抛出 AssertionError: { a: 1 } deepStrictEqual { a: '1' }
// 因为使用全等运算符 1 !== '1'。

// 以下对象都没有自身属性。
const date = new Date();
const object = {};
const fakeDate = {};

Object.setPrototypeOf(fakeDate, Date.prototype);

assert.deepEqual(object, fakeDate);
// 测试通过，不测试原型。
assert.deepStrictEqual(object, fakeDate);
// 抛出 AssertionError: {} deepStrictEqual Date {}
// 因为原型不同。

assert.deepEqual(date, fakeDate);
// 测试通过，不测试类型标签。
assert.deepStrictEqual(date, fakeDate);
// 抛出 AssertionError: 2017-03-11T14:25:31.849Z deepStrictEqual Date {}
// 因为类型标签不同。
```

如果两个值不相等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.doesNotThrow(block[, error][, message])
<!-- YAML
added: v0.1.21
changes:
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/2407
    description: The `message` parameter is respected now.
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3276
    description: The `error` parameter can now be an arrow function.
-->
* `block` {Function}
* `error` {RegExp|Function}
* `message` {any}

断言 `block` 函数不会抛出错误。

当 `assert.doesNotThrow()` 被调用时，它会立即调用 `block` 函数。

如果抛出错误且错误类型与 `error` 参数指定的相同，则抛出 `AssertionError`。
如果错误类型不相同，或 `error` 参数为 `undefined`，则抛出错误。

以下例子会抛出 [`TypeError`]，因为在断言中没有匹配的错误类型：

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('错误信息');
  },
  SyntaxError
);
```

以下例子会抛出一个带有 `Got unwanted exception (TypeError)..` 信息的 `AssertionError`：

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('错误信息');
  },
  TypeError
);
```

如果抛出了 `AssertionError` 且有给 `message` 参数传值，则 `message` 参数的值会被附加到 `AssertionError` 的信息中：

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('错误信息');
  },
  TypeError,
  '抛出错误'
);
// 抛出 AssertionError: Got unwanted exception (TypeError). 抛出错误
```


## assert.equal(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

使用[相等运算符]（`==`）测试 `actual` 参数与 `expected` 参数是否相等。

```js
const assert = require('assert');

assert.equal(1, 1);
// 测试通过，1 == 1。
assert.equal(1, '1');
// 测试通过，1 == '1'。

assert.equal(1, 2);
// 抛出 AssertionError: 1 == 2
assert.equal({ a: { b: 1 } }, { a: { b: 1 } });
// 抛出 AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

如果两个值不相等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.fail([message])
## assert.fail(actual, expected[, message[, operator[, stackStartFunction]]])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}
* `operator` {string} 默认为 `'!='`。
* `stackStartFunction` {function} 默认为 `assert.fail`。

抛出 `AssertionError`。
如果 `message` 参数为空，则错误信息为 `actual` 参数 + `operator` 参数 + `expected` 参数。
如果只提供了 `actual` 参数与 `expected` 参数，则 `operator` 参数默认为 `'!='`。
如果提供了 `message` 参数，则它会作为错误信息，其他参数会保存在错误对象的属性中。
如果提供了 `stackStartFunction` 参数，则该函数上的栈帧都会从栈信息中移除（详见 [`Error.captureStackTrace`]）。

```js
const assert = require('assert');

assert.fail(1, 2, undefined, '>');
// 抛出 AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, '错误信息');
// 抛出 AssertionError [ERR_ASSERTION]: 错误信息

assert.fail(1, 2, '错误信息', '>');
// 抛出 AssertionError [ERR_ASSERTION]: 错误信息
// 上面两个例子的 `actual` 参数、`expected` 参数与 `operator` 参数不影响错误消息。

assert.fail();
// 抛出 AssertionError [ERR_ASSERTION]: Failed

assert.fail('错误信息');
// 抛出 AssertionError [ERR_ASSERTION]: 错误信息

assert.fail('a', 'b');
// 抛出 AssertionError [ERR_ASSERTION]: 'a' != 'b'
```

例子，使用 `stackStartFunction` 参数拦截异常的栈信息：
```js
function suppressFrame() {
  assert.fail('a', 'b', undefined, '!==', suppressFrame);
}
suppressFrame();
// AssertionError [ERR_ASSERTION]: 'a' !== 'b'
//     at repl:1:1
//     at ContextifyScript.Script.runInThisContext (vm.js:44:33)
//     ...
```


## assert.ifError(value)
<!-- YAML
added: v0.1.97
-->
* `value` {any}

如果 `value` 为真，则抛出 `value`。
可用于测试回调函数的 `error` 参数。

```js
const assert = require('assert');

assert.ifError(0);
// 测试通过。
assert.ifError(1);
// 抛出 1。
assert.ifError('error');
// 抛出 'error'。
assert.ifError(new Error());
// 抛出 Error。
```



## assert.notDeepEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

测试 `actual` 参数与 `expected` 参数是否不深度相等。
与 [`assert.deepEqual()`] 相反。

```js
const assert = require('assert');

const obj1 = {
  a: {
    b: 1
  }
};
const obj2 = {
  a: {
    b: 2
  }
};
const obj3 = {
  a: {
    b: 1
  }
};
const obj4 = Object.create(obj1);

assert.notDeepEqual(obj1, obj1);
// 抛出 AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj2);
// 测试通过，obj1 与 obj2 不深度相等。

assert.notDeepEqual(obj1, obj3);
// 抛出 AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// 测试通过，obj1 与 obj4 不深度相等。
```

如果两个值深度相等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

测试 `actual` 参数与 `expected` 参数是否不深度全等。
与 [`assert.deepStrictEqual()`] 相反。

```js
const assert = require('assert');

assert.notDeepEqual({ a: 1 }, { a: '1' });
// 抛出 AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// 测试通过。
```

如果两个值深度全等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

使用[不等运算符]（`!=`）测试 `actual` 参数与 `expected` 参数是否不相等。

```js
const assert = require('assert');

assert.notEqual(1, 2);
// 测试通过。

assert.notEqual(1, 1);
// 抛出 AssertionError: 1 != 1

assert.notEqual(1, '1');
// 抛出 AssertionError: 1 != '1'
```

如果两个值相等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.notStrictEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

使用[不全等运算符]（`!==`）测试 `actual` 参数与 `expected` 参数是否不全等。

```js
const assert = require('assert');

assert.notStrictEqual(1, 2);
// 测试通过。

assert.notStrictEqual(1, 1);
// 抛出 AssertionError: 1 !== 1

assert.notStrictEqual(1, '1');
// 测试通过。
```

如果两个值全等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

测试 `value` 是否为真值。
相当于 `assert.equal(!!value, true, message)`。

如果 `value` 不为真值，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。

```js
const assert = require('assert');

assert.ok(true);
// 测试通过。
assert.ok(1);
// 测试通过。
assert.ok(false);
// 抛出 "AssertionError: false == true"
assert.ok(0);
// 抛出 "AssertionError: 0 == true"
assert.ok(false, '不是真值');
// 抛出 "AssertionError: 不是真值"
```


## assert.strictEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

使用[全等运算符]（`===`）测试 `actual` 参数与 `expected` 参数是否全等。

```js
const assert = require('assert');

assert.strictEqual(1, 2);
// 抛出 AssertionError: 1 === 2

assert.strictEqual(1, 1);
// 测试通过。

assert.strictEqual(1, '1');
// 抛出 AssertionError: 1 === '1'
```

如果两个值不全等，则抛出一个带有 `message` 属性的 `AssertionError`，其中 `message` 属性的值等于传入的 `message` 参数的值。
如果 `message` 参数为 `undefined`，则赋予默认的错误信息。


## assert.throws(block[, error][, message])
<!-- YAML
added: v0.1.21
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3276
    description: The `error` parameter can now be an arrow function.
-->
* `block` {Function}
* `error` {RegExp|Function}
* `message` {any}

断言 `block` 函数会抛出错误。

`error` 参数可以是构造函数、[正则表达式]、或自定义函数。

如果指定了 `message` 参数，则当 `block` 函数不抛出错误时，`message` 参数会作为 `AssertionError` 的错误信息。

例子，`error` 参数为构造函数：

```js
assert.throws(
  () => {
    throw new Error('错误信息');
  },
  Error
);
```

例子，`error` 参数为正则表达式：

```js
assert.throws(
  () => {
    throw new Error('错误信息');
  },
  /错误/
);
```

例子，`error` 参数为自定义函数：

```js
assert.throws(
  () => {
    throw new Error('错误信息');
  },
  function(err) {
    if ((err instanceof Error) && /错误/.test(err)) {
      return true;
    }
  },
  '不是期望的错误'
);
```

`error` 参数不能是字符串。
如果第二个参数是字符串，则视为省略 `error` 参数，传入的字符串会被用于 `message` 参数。
例如：

<!-- eslint-disable no-restricted-syntax -->
```js
// 这是错误的！不要这么做！
assert.throws(myFunction, '错误信息', '没有抛出期望的信息');

// 应该这么做。
assert.throws(myFunction, /错误信息/, '没有抛出期望的信息');
```


## Caveats

对于 [SameValueZero] 比较，建议使用 ES2015 的 [`Object.is()`]。

```js
const a = 0;
const b = -a;
assert.notStrictEqual(a, b);
// 抛出 AssertionError: 0 !== -0
// 因为全等运算符不区分 -0 与 +0。
assert(!Object.is(a, b));
// 但 Object.is() 可以区分。

const str1 = 'foo';
const str2 = 'foo';
assert.strictEqual(str1 / 1, str2 / 1);
// 抛出 AssertionError: NaN === NaN
// 因为全等运算符不能用于测试 NaN。
assert(Object.is(str1 / 1, str2 / 1));
// 但 Object.is() 可以测试。
```

详见[MDN的等式比较指南]。


[`Error`]: errors.html#errors_class_error
[`Error.captureStackTrace`]: errors.html#errors_error_capturestacktrace_targetobject_constructoropt
[`Map`]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
[`Object.is()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
[`RegExp`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
[`Set`]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Set
[`TypeError`]: errors.html#errors_class_typeerror
[`assert.deepEqual()`]: #assert_assert_deepequal_actual_expected_message
[`assert.deepStrictEqual()`]: #assert_assert_deepstrictequal_actual_expected_message
[`assert.ok()`]: #assert_assert_ok_value_message
[`assert.throws()`]: #assert_assert_throws_block_error_message
[Abstract Equality Comparison]: https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
[Object.prototype.toString()]: https://tc39.github.io/ecma262/#sec-object.prototype.tostring
[SameValueZero]: https://tc39.github.io/ecma262/#sec-samevaluezero
[Strict Equality Comparison]: https://tc39.github.io/ecma262/#sec-strict-equality-comparison
[caveats]: #assert_caveats
[enumerable "own" properties]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties
[mdn-equality-guide]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
[prototype-spec]: https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots

[正则表达式]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
[相等运算符]: https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
[不等运算符]: https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
[全等运算符]: https://tc39.github.io/ecma262/#sec-strict-equality-comparison
[不全等运算符]: https://tc39.github.io/ecma262/#sec-strict-equality-comparison
[可枚举的自身属性]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties
[原型]: https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
[类型标签]: https://tc39.github.io/ecma262/#sec-object.prototype.tostring
[MDN的等式比较指南]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness