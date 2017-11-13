# Crypto

<!--introduced_in=v0.3.6-->

> 稳定性: 2

`crypto` 模块提供了加密功能，包含对 OpenSSL 的哈希、HMAC、加密、解密、签名、以及验证功能的一整套封装。

使用 `require('crypto')` 来访问该模块。

## 简介
### Hmac 算法
*Hmac算法* 是一种哈希算法，它可以利用MD5或SHA1等哈希算法。不同的是，Hmac还需要一个密钥：
```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// Prints:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```
只要密钥发生了变化，那么同样的输入数据也会得到不同的签名，因此，可以把Hmac理解为用随机数“增强”的哈希算法。
    
代码解析：
```js
crypto.createHash(algorithm)
// 创建并返回一个hash对象，它是一个指定算法的 加密hash，用于生成 hash摘要。
// 参数algorithm 可选择系统上安装的OpenSSL版本所支持的算法。例如：'sha1', 'md5', 'sha256', 'sha512'等。在近期发行的版本中，openssl list-message-digest-algorithms会显示这些可用的摘要算法。
    
hash.update(data)
// 更新hash的内容为指定的data。当使用流数据时可能会多次调用该方法。
    
hash.digest(encoding='binary')
// 计算所有传入数据的hash摘要。参数encoding（编码方式）可以为'hex', 'binary' 或者'base64'。
    
crypto.createHmac(algorithm, key)
// 创建并返回一个hmac对象，它是一个指定算法和密钥的加密hmac。
// 参数algorithm可选择OpenSSL支持的算法 - 参见上文的createHash。参数key为hmac所使用的密钥。
    
hmac.update(data)
// 更新hmac的内容为指定的data。当使用流数据时可能会多次调用该方法。
    
hmac.digest(encoding='binary')
// 计算所有传入数据的hmac摘要。参数encoding（编码方式）可以为'hex', 'binary' 或者'base64'。
```


### AES 算法
*AES算法* 是一种常用的对称加密算法，加解密都用同一个密钥。crypto模块提供了AES支持，但是需要自己封装好函数，便于使用：
```js
const crypto = require('crypto');

function aesEncrypt(data, key) {
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function aesDecrypt(encrypted, key) {
    const decipher = crypto.createDecipher('aes192', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

let data = 'Hello, this is a secret message!';
let key = 'Password!';
let encrypted = aesEncrypt(data, key);
let decrypted = aesDecrypt(encrypted, key);

console.log('Plain text: ' + data);
console.log('Encrypted text: ' + encrypted);
console.log('Decrypted text: ' + decrypted);

// 运行结果如下：

// Plain text: Hello, this is a secret message!
// Encrypted text: 8a944d97bdabc157a5b7a40cb180e7...
// Decrypted text: Hello, this is a secret message!
```
可以看出，加密后的字符串通过解密又得到了原始内容。

注意到AES有很多不同的算法，如`aes192`，`aes-128-ecb`，`aes-256-cbc`等，AES 除了密钥外还可以指定IV（Initial Vector），不同的系统只要IV不同，用相同的密钥加密相同的数据得到的加密结果也是不同的。加密结果通常有两种表示方法：hex和base64，这些功能Nodejs全部都支持，但是在应用中要注意，如果加解密双方一方用Nodejs，另一方用Java、PHP等其它语言，需要仔细测试。如果无法正确解密，要确认双方是否遵循同样的AES算法，字符串密钥和IV是否相同，加密后的数据是否统一为hex或base64格式。

### Diffie-Hellman
*DH算法* 是一种密钥交换协议，它可以让双方在不泄漏密钥的情况下协商出一个密钥来。DH算法基于数学原理，比如小明和小红想要协商一个密钥，可以这么做：

小明先选一个素数和一个底数，例如，素数`p=23`，底数`g=5`（底数可以任选），再选择一个秘密整数`a=6`，计算`A=g^a mod p=8`，然后大声告诉小红：`p=23，g=5，A=8`；

小红收到小明发来的`p`，`g`，`A`后，也选一个秘密整数`b=15`，然后计算`B=g^b mod p=19`，并大声告诉小明：`B=19`；

小明自己计算出`s=B^a mod p=2`，小红也自己计算出`s=A^b mod p=2`，因此，最终协商的密钥`s`为`2`。

在这个过程中，密钥`2`并不是小明告诉小红的，也不是小红告诉小明的，而是双方协商计算出来的。第三方只能知道`p=23，g=5，A=8，B=19`，由于不知道双方选的秘密整数`a=6`和`b=15`，因此无法计算出密钥`2`。

用crypto模块实现DH算法如下：
```js
const crypto = require('crypto');

// xiaoming's keys:
let ming = crypto.createDiffieHellman(512);
let ming_keys = ming.generateKeys();

let prime = ming.getPrime();
let generator = ming.getGenerator();

console.log('Prime: ' + prime.toString('hex'));
console.log('Generator: ' + generator.toString('hex'));

// xiaohong's keys:
let hong = crypto.createDiffieHellman(prime, generator);
let hong_keys = hong.generateKeys();

// exchange and generate secret:
let ming_secret = ming.computeSecret(hong_keys);
let hong_secret = hong.computeSecret(ming_keys);

// print secret:
console.log('Secret of Xiao Ming: ' + ming_secret.toString('hex'));
console.log('Secret of Xiao Hong: ' + hong_secret.toString('hex'));
// 运行后，可以得到如下输出：

// $ node dh.js 
// Prime: a8224c...deead3
// Generator: 02
// Secret of Xiao Ming: 695308...d519be
// Secret of Xiao Hong: 695308...d519be
```

注意每次输出都不一样，因为素数的选择是随机的。

### 证书

crypto模块也可以处理数字证书。数字证书通常用在SSL连接，也就是Web的https连接。一般情况下，https连接只需要处理服务器端的单向认证，如无特殊需求（例如自己作为Root给客户发认证证书），建议用反向代理服务器如Nginx等Web服务器去处理证书。

## Determining if crypto support is unavailable

可以在不包括支持 `crypto` 模块的情况下构建 `Node.js`, 这时, 调用 `require('crypto')` 将 导致抛出异常.

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}
```

## Class: Certificate
<!-- YAML
added: v0.11.8
-->

SPKAC 最初是由 Netscape 实现的一种证书签名请求机制, 现在正式成为 [HTML5's `keygen` element][] 的一部分.

`crypto` 模块提供 `Certificate` 类用于处理 SPKAC 数据. 最普遍的用法是处理 HTML5 `keygen` 元素
产生的输出. Node.js 内部使用 [OpenSSL's SPKAC implementation][] 处理.

### new crypto.Certificate()


可以使用 `new` 关键字或者调用 `crypto.Certificate()` 方法创建 `Certificate` 类的实例:
```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```


### certificate.exportChallenge(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {string | Buffer | TypedArray | DataView}
- 返回 {Buffer} 返回 `spkac` 数据结构的 challenge 部分，`spkac` 包含一个公钥和一个 challange。

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Prints: the challenge as a UTF8 string
```

### certificate.exportPublicKey(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {string | Buffer | TypedArray | DataView}
- 返回 {Buffer} 数据结构的公钥部分，`spkac` 包含一个公钥和一个 challange。

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Prints: the public key as <Buffer ...>
```

### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {Buffer | TypedArray | DataView}
- 返回 {boolean} 如果 `spkac` 数据结构是有效的返回 `true`，否则返回 `false`。

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Prints: true 或者 false
```

## Class: Cipher
<!-- YAML
added: v0.1.94
-->

Instances of the `Cipher` class are used to encrypt data. The class can be
used in one of two ways:

- As a [stream][] that is both readable and writable, where plain unencrypted
  data is written to produce encrypted data on the readable side, or
- Using the [`cipher.update()`][] and [`cipher.final()`][] methods to produce
  the encrypted data.

The [`crypto.createCipher()`][] or [`crypto.createCipheriv()`][] methods are
used to create `Cipher` instances. `Cipher` objects are not to be created
directly using the `new` keyword.

Example: Using `Cipher` objects as streams:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = '';
cipher.on('readable', () => {
  const data = cipher.read();
  if (data)
    encrypted += data.toString('hex');
});
cipher.on('end', () => {
  console.log(encrypted);
  // Prints: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
});

cipher.write('some clear text data');
cipher.end();
```

Example: Using `Cipher` and piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const cipher = crypto.createCipher('aes192', 'a password');

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Example: Using the [`cipher.update()`][] and [`cipher.final()`][] methods:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Prints: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
```

### cipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}

Returns any remaining enciphered contents. If `outputEncoding`
parameter is one of `'latin1'`, `'base64'` or `'hex'`, a string is returned.
If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

Once the `cipher.final()` method has been called, the `Cipher` object can no
longer be used to encrypt data. Attempts to call `cipher.final()` more than
once will result in an error being thrown.

### cipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
-->
- `buffer` {Buffer}
- Returns the {Cipher} for method chaining.

When using an authenticated encryption mode (only `GCM` is currently
supported), the `cipher.setAAD()` method sets the value used for the
_additional authenticated data_ (AAD) input parameter.

The `cipher.setAAD()` method must be called before [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->

When using an authenticated encryption mode (only `GCM` is currently
supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing
the _authentication tag_ that has been computed from the given data.

The `cipher.getAuthTag()` method should only be called after encryption has
been completed using the [`cipher.final()`][] method.

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} Defaults to `true`.
- Returns the {Cipher} for method chaining.

When using block encryption algorithms, the `Cipher` class will automatically
add padding to the input data to the appropriate block size. To disable the
default padding call `cipher.setAutoPadding(false)`.

When `autoPadding` is `false`, the length of the entire input data must be a
multiple of the cipher's block size or [`cipher.final()`][] will throw an Error.
Disabling automatic padding is useful for non-standard padding, for instance
using `0x0` instead of PKCS padding.

The `cipher.setAutoPadding()` method must be called before
[`cipher.final()`][].

### cipher.update(data[, inputEncoding][, outputEncoding])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}

Updates the cipher with `data`. If the `inputEncoding` argument is given,
its value must be one of `'utf8'`, `'ascii'`, or `'latin1'` and the `data`
argument is a string using the specified encoding. If the `inputEncoding`
argument is not given, `data` must be a [`Buffer`][], `TypedArray`, or
`DataView`.  If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then
`inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered
data, and can be `'latin1'`, `'base64'` or `'hex'`. If the `outputEncoding`
is specified, a string using the specified encoding is returned. If no
`outputEncoding` is provided, a [`Buffer`][] is returned.

The `cipher.update()` method can be called multiple times with new data until
[`cipher.final()`][] is called. Calling `cipher.update()` after
[`cipher.final()`][] will result in an error being thrown.

## Class: Decipher
<!-- YAML
added: v0.1.94
-->

Instances of the `Decipher` class are used to decrypt data. The class can be
used in one of two ways:

- As a [stream][] that is both readable and writable, where plain encrypted
  data is written to produce unencrypted data on the readable side, or
- Using the [`decipher.update()`][] and [`decipher.final()`][] methods to
  produce the unencrypted data.

The [`crypto.createDecipher()`][] or [`crypto.createDecipheriv()`][] methods are
used to create `Decipher` instances. `Decipher` objects are not to be created
directly using the `new` keyword.

Example: Using `Decipher` objects as streams:

```js
const crypto = require('crypto');
const decipher = crypto.createDecipher('aes192', 'a password');

let decrypted = '';
decipher.on('readable', () => {
  const data = decipher.read();
  if (data)
    decrypted += data.toString('utf8');
});
decipher.on('end', () => {
  console.log(decrypted);
  // Prints: some clear text data
});

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
decipher.write(encrypted, 'hex');
decipher.end();
```

Example: Using `Decipher` and piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const decipher = crypto.createDecipher('aes192', 'a password');

const input = fs.createReadStream('test.enc');
const output = fs.createWriteStream('test.js');

input.pipe(decipher).pipe(output);
```

Example: Using the [`decipher.update()`][] and [`decipher.final()`][] methods:

```js
const crypto = require('crypto');
const decipher = crypto.createDecipher('aes192', 'a password');

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// Prints: some clear text data
```

### decipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}

Returns any remaining deciphered contents. If `outputEncoding`
parameter is one of `'latin1'`, `'ascii'` or `'utf8'`, a string is returned.
If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

Once the `decipher.final()` method has been called, the `Decipher` object can
no longer be used to decrypt data. Attempts to call `decipher.final()` more
than once will result in an error being thrown.

### decipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Returns the {Cipher} for method chaining.

When using an authenticated encryption mode (only `GCM` is currently
supported), the `decipher.setAAD()` method sets the value used for the
_additional authenticated data_ (AAD) input parameter.

The `decipher.setAAD()` method must be called before [`decipher.update()`][].

### decipher.setAuthTag(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Returns the {Cipher} for method chaining.

When using an authenticated encryption mode (only `GCM` is currently
supported), the `decipher.setAuthTag()` method is used to pass in the
received _authentication tag_. If no tag is provided, or if the cipher text
has been tampered with, [`decipher.final()`][] with throw, indicating that the
cipher text should be discarded due to failed authentication.

The `decipher.setAuthTag()` method must be called before
[`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} Defaults to `true`.
- Returns the {Cipher} for method chaining.

When data has been encrypted without standard block padding, calling
`decipher.setAutoPadding(false)` will disable automatic padding to prevent
[`decipher.final()`][] from checking for and removing padding.

Turning auto padding off will only work if the input data's length is a
multiple of the ciphers block size.

The `decipher.setAutoPadding()` method must be called before
[`decipher.final()`][].

### decipher.update(data[, inputEncoding][, outputEncoding])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}

Updates the decipher with `data`. If the `inputEncoding` argument is given,
its value must be one of `'latin1'`, `'base64'`, or `'hex'` and the `data`
argument is a string using the specified encoding. If the `inputEncoding`
argument is not given, `data` must be a [`Buffer`][]. If `data` is a
[`Buffer`][] then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered
data, and can be `'latin1'`, `'ascii'` or `'utf8'`. If the `outputEncoding`
is specified, a string using the specified encoding is returned. If no
`outputEncoding` is provided, a [`Buffer`][] is returned.

The `decipher.update()` method can be called multiple times with new data until
[`decipher.final()`][] is called. Calling `decipher.update()` after
[`decipher.final()`][] will result in an error being thrown.

## Class: DiffieHellman
<!-- YAML
added: v0.5.0
-->

The `DiffieHellman` class is a utility for creating Diffie-Hellman key
exchanges.

Instances of the `DiffieHellman` class can be created using the
[`crypto.createDiffieHellman()`][] function.

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Generate Bob's keys...
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// Exchange and generate the secret...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

// OK
assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
```

### diffieHellman.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])
<!-- YAML
added: v0.5.0
-->
- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}

Computes the shared secret using `otherPublicKey` as the other
party's public key and returns the computed shared secret. The supplied
key is interpreted using the specified `inputEncoding`, and secret is
encoded using specified `outputEncoding`. Encodings can be
`'latin1'`, `'hex'`, or `'base64'`. If the `inputEncoding` is not
provided, `otherPublicKey` is expected to be a [`Buffer`][],
`TypedArray`, or `DataView`.

If `outputEncoding` is given a string is returned; otherwise, a
[`Buffer`][] is returned.

### diffieHellman.generateKeys([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}

Generates private and public Diffie-Hellman key values, and returns
the public key in the specified `encoding`. This key should be
transferred to the other party. Encoding can be `'latin1'`, `'hex'`,
or `'base64'`. If `encoding` is provided a string is returned; otherwise a
[`Buffer`][] is returned.

### diffieHellman.getGenerator([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}

Returns the Diffie-Hellman generator in the specified `encoding`, which can
be `'latin1'`, `'hex'`, or `'base64'`. If  `encoding` is provided a string is
returned; otherwise a [`Buffer`][] is returned.

### diffieHellman.getPrime([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}

Returns the Diffie-Hellman prime in the specified `encoding`, which can
be `'latin1'`, `'hex'`, or `'base64'`. If `encoding` is provided a string is
returned; otherwise a [`Buffer`][] is returned.

### diffieHellman.getPrivateKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}

Returns the Diffie-Hellman private key in the specified `encoding`,
which can be `'latin1'`, `'hex'`, or `'base64'`. If `encoding` is provided a
string is returned; otherwise a [`Buffer`][] is returned.

### diffieHellman.getPublicKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}

Returns the Diffie-Hellman public key in the specified `encoding`, which
can be `'latin1'`, `'hex'`, or `'base64'`. If `encoding` is provided a
string is returned; otherwise a [`Buffer`][] is returned.

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Sets the Diffie-Hellman private key. If the `encoding` argument is provided
and is either `'latin1'`, `'hex'`, or `'base64'`, `privateKey` is expected
to be a string. If no `encoding` is provided, `privateKey` is expected
to be a [`Buffer`][], `TypedArray`, or `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Sets the Diffie-Hellman public key. If the `encoding` argument is provided
and is either `'latin1'`, `'hex'` or `'base64'`, `publicKey` is expected
to be a string. If no `encoding` is provided, `publicKey` is expected
to be a [`Buffer`][], `TypedArray`, or `DataView`.

### diffieHellman.verifyError
<!-- YAML
added: v0.11.12
-->

A bit field containing any warnings and/or errors resulting from a check
performed during initialization of the `DiffieHellman` object.

The following values are valid for this property (as defined in `constants`
module):

* `DH_CHECK_P_NOT_SAFE_PRIME`
* `DH_CHECK_P_NOT_PRIME`
* `DH_UNABLE_TO_CHECK_GENERATOR`
* `DH_NOT_SUITABLE_GENERATOR`

## Class: ECDH
<!-- YAML
added: v0.11.14
-->

The `ECDH` class is a utility for creating Elliptic Curve Diffie-Hellman (ECDH)
key exchanges.

Instances of the `ECDH` class can be created using the
[`crypto.createECDH()`][] function.

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createECDH('secp521r1');
const aliceKey = alice.generateKeys();

// Generate Bob's keys...
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// Exchange and generate the secret...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
// OK
```

### ecdh.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])
<!-- YAML
added: v0.11.14
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}

Computes the shared secret using `otherPublicKey` as the other
party's public key and returns the computed shared secret. The supplied
key is interpreted using specified `inputEncoding`, and the returned secret
is encoded using the specified `outputEncoding`. Encodings can be
`'latin1'`, `'hex'`, or `'base64'`. If the `inputEncoding` is not
provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or
`DataView`.

If `outputEncoding` is given a string will be returned; otherwise a
[`Buffer`][] is returned.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} Defaults to `uncompressed`.

Generates private and public EC Diffie-Hellman key values, and returns
the public key in the specified `format` and `encoding`. This key should be
transferred to the other party.

The `format` argument specifies point encoding and can be `'compressed'` or
`'uncompressed'`. If `format` is not specified, the point will be returned in
`'uncompressed'` format.

The `encoding` argument can be `'latin1'`, `'hex'`, or `'base64'`. If
`encoding` is provided a string is returned; otherwise a [`Buffer`][]
is returned.

### ecdh.getPrivateKey([encoding])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}

Returns the EC Diffie-Hellman private key in the specified `encoding`,
which can be `'latin1'`, `'hex'`, or `'base64'`. If `encoding` is provided
a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.getPublicKey([encoding][, format])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} Defaults to `uncompressed`.

Returns the EC Diffie-Hellman public key in the specified `encoding` and
`format`.

The `format` argument specifies point encoding and can be `'compressed'` or
`'uncompressed'`. If `format` is not specified the point will be returned in
`'uncompressed'` format.

The `encoding` argument can be `'latin1'`, `'hex'`, or `'base64'`. If
`encoding` is specified, a string is returned; otherwise a [`Buffer`][] is
returned.

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Sets the EC Diffie-Hellman private key. The `encoding` can be `'latin1'`,
`'hex'` or `'base64'`. If `encoding` is provided, `privateKey` is expected
to be a string; otherwise `privateKey` is expected to be a [`Buffer`][],
`TypedArray`, or `DataView`.

If `privateKey` is not valid for the curve specified when the `ECDH` object was
created, an error is thrown. Upon setting the private key, the associated
public point (key) is also generated and set in the ECDH object.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Stability: 0 - Deprecated

- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Sets the EC Diffie-Hellman public key. Key encoding can be `'latin1'`,
`'hex'` or `'base64'`. If `encoding` is provided `publicKey` is expected to
be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

Note that there is not normally a reason to call this method because `ECDH`
only requires a private key and the other party's public key to compute the
shared secret. Typically either [`ecdh.generateKeys()`][] or
[`ecdh.setPrivateKey()`][] will be called. The [`ecdh.setPrivateKey()`][] method
attempts to generate the public point/key associated with the private key being
set.

Example (obtaining a shared secret):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// Note: This is a shortcut way to specify one of Alice's previous private
// keys. It would be unwise to use such a predictable private key in a real
// application.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Bob uses a newly generated cryptographically strong
// pseudorandom key pair
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// aliceSecret and bobSecret should be the same shared secret value
console.log(aliceSecret === bobSecret);
```

## Class: Hash
<!-- YAML
added: v0.1.92
-->

The `Hash` class is a utility for creating hash digests of data. It can be
used in one of two ways:

- As a [stream][] that is both readable and writable, where data is written
  to produce a computed hash digest on the readable side, or
- Using the [`hash.update()`][] and [`hash.digest()`][] methods to produce the
  computed hash.

The [`crypto.createHash()`][] method is used to create `Hash` instances. `Hash`
objects are not to be created directly using the `new` keyword.

Example: Using `Hash` objects as streams:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.on('readable', () => {
  const data = hash.read();
  if (data) {
    console.log(data.toString('hex'));
    // Prints:
    //   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
  }
});

hash.write('some data to hash');
hash.end();
```

Example: Using `Hash` and piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('test.js');
input.pipe(hash).pipe(process.stdout);
```

Example: Using the [`hash.update()`][] and [`hash.digest()`][] methods:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('some data to hash');
console.log(hash.digest('hex'));
// Prints:
//   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
```

### hash.digest([encoding])
<!-- YAML
added: v0.1.92
-->
- `encoding` {string}

Calculates the digest of all of the data passed to be hashed (using the
[`hash.update()`][] method). The `encoding` can be `'hex'`, `'latin1'` or
`'base64'`. If `encoding` is provided a string will be returned; otherwise
a [`Buffer`][] is returned.

The `Hash` object can not be used again after `hash.digest()` method has been
called. Multiple calls will cause an error to be thrown.

### hash.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the hash content with the given `data`, the encoding of which
is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or
`'latin1'`. If `encoding` is not provided, and the `data` is a string, an
encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or
`DataView`, then `inputEncoding` is ignored.

This can be called many times with new data as it is streamed.

## Class: Hmac
<!-- YAML
added: v0.1.94
-->

The `Hmac` Class is a utility for creating cryptographic HMAC digests. It can
be used in one of two ways:

- As a [stream][] that is both readable and writable, where data is written
  to produce a computed HMAC digest on the readable side, or
- Using the [`hmac.update()`][] and [`hmac.digest()`][] methods to produce the
  computed HMAC digest.

The [`crypto.createHmac()`][] method is used to create `Hmac` instances. `Hmac`
objects are not to be created directly using the `new` keyword.

Example: Using `Hmac` objects as streams:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.on('readable', () => {
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // Prints:
    //   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
  }
});

hmac.write('some data to hash');
hmac.end();
```

Example: Using `Hmac` and piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream('test.js');
input.pipe(hmac).pipe(process.stdout);
```

Example: Using the [`hmac.update()`][] and [`hmac.digest()`][] methods:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.update('some data to hash');
console.log(hmac.digest('hex'));
// Prints:
//   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
```

### hmac.digest([encoding])
<!-- YAML
added: v0.1.94
-->
- `encoding` {string}

Calculates the HMAC digest of all of the data passed using [`hmac.update()`][].
The `encoding` can be `'hex'`, `'latin1'` or `'base64'`. If `encoding` is
provided a string is returned; otherwise a [`Buffer`][] is returned;

The `Hmac` object can not be used again after `hmac.digest()` has been
called. Multiple calls to `hmac.digest()` will result in an error being thrown.

### hmac.update(data[, inputEncoding])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Hmac` content with the given `data`, the encoding of which
is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or
`'latin1'`. If `encoding` is not provided, and the `data` is a string, an
encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or
`DataView`, then `inputEncoding` is ignored.

This can be called many times with new data as it is streamed.

## Class: Sign
<!-- YAML
added: v0.1.92
-->

The `Sign` Class is a utility for generating signatures. It can be used in one
of two ways:

- As a writable [stream][], where data to be signed is written and the
  [`sign.sign()`][] method is used to generate and return the signature, or
- Using the [`sign.update()`][] and [`sign.sign()`][] methods to produce the
  signature.

The [`crypto.createSign()`][] method is used to create `Sign` instances. `Sign`
objects are not to be created directly using the `new` keyword.

Example: Using `Sign` objects as streams:

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.write('some data to sign');
sign.end();

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Prints: the calculated signature
```

Example: Using the [`sign.update()`][] and [`sign.sign()`][] methods:

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Prints: the calculated signature
```

A `Sign` instance can also be created by just passing in the digest
algorithm name, in which case OpenSSL will infer the full signature algorithm
from the type of the PEM-formatted private key, including algorithms that
do not have directly exposed name constants, e.g. 'ecdsa-with-SHA256'.

Example: signing using ECDSA with SHA256

```js
const crypto = require('crypto');
const sign = crypto.createSign('sha256');

sign.update('some data to sign');

const privateKey =
`-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIF+jnWY1D5kbVYDNvxxo/Y+ku2uJPDwS0r/VuPZQrjjVoAoGCCqGSM49
AwEHoUQDQgAEurOxfSxmqIRYzJVagdZfMMSjRNNhB8i3mXyIMq704m2m52FdfKZ2
pQhByd5eyj3lgZ7m7jbchtdgyOF8Io/1ng==
-----END EC PRIVATE KEY-----`;

console.log(sign.sign(privateKey).toString('hex'));
```

### sign.sign(privateKey[, outputFormat])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
- `privateKey` {string | Object}
  - `key` {string}
  - `passphrase` {string}
- `outputFormat` {string}

Calculates the signature on all the data passed through using either
[`sign.update()`][] or [`sign.write()`][stream-writable-write].

The `privateKey` argument can be an object or a string. If `privateKey` is a
string, it is treated as a raw key with no passphrase. If `privateKey` is an
object, it must contain one or more of the following properties:

* `key`: {string} - PEM encoded private key (required)
* `passphrase`: {string} - passphrase for the private key
* `padding`: {integer} - Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Note that `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function
  used to sign the message as specified in section 3.1 of [RFC 4055][].
* `saltLength`: {integer} - salt length for when padding is
  `RSA_PKCS1_PSS_PADDING`. The special value
  `crypto.constants.RSA_PSS_SALTLEN_DIGEST` sets the salt length to the digest
  size, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (default) sets it to the
  maximum permissible value.

The `outputFormat` can specify one of `'latin1'`, `'hex'` or `'base64'`. If
`outputFormat` is provided a string is returned; otherwise a [`Buffer`][] is
returned.

The `Sign` object can not be again used after `sign.sign()` method has been
called. Multiple calls to `sign.sign()` will result in an error being thrown.

### sign.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Sign` content with the given `data`, the encoding of which
is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or
`'latin1'`. If `encoding` is not provided, and the `data` is a string, an
encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or
`DataView`, then `inputEncoding` is ignored.

This can be called many times with new data as it is streamed.

## Class: Verify
<!-- YAML
added: v0.1.92
-->

The `Verify` class is a utility for verifying signatures. It can be used in one
of two ways:

- As a writable [stream][] where written data is used to validate against the
  supplied signature, or
- Using the [`verify.update()`][] and [`verify.verify()`][] methods to verify
  the signature.

The [`crypto.createVerify()`][] method is used to create `Verify` instances.
`Verify` objects are not to be created directly using the `new` keyword.

Example: Using `Verify` objects as streams:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('RSA-SHA256');

verify.write('some data to sign');
verify.end();

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Prints: true or false
```

Example: Using the [`verify.update()`][] and [`verify.verify()`][] methods:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('RSA-SHA256');

verify.update('some data to sign');

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Prints: true or false
```

### verify.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Verify` content with the given `data`, the encoding of which
is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or
`'latin1'`. If `encoding` is not provided, and the `data` is a string, an
encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or
`DataView`, then `inputEncoding` is ignored.

This can be called many times with new data as it is streamed.

### verify.verify(object, signature[, signatureFormat])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
- `object` {string | Object}
- `signature` {string | Buffer | TypedArray | DataView}
- `signatureFormat` {string}

Verifies the provided data using the given `object` and `signature`.
The `object` argument can be either a string containing a PEM encoded object,
which can be an RSA public key, a DSA public key, or an X.509 certificate,
or an object with one or more of the following properties:

* `key`: {string} - PEM encoded public key (required)
* `padding`: {integer} - Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Note that `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function
  used to verify the message as specified in section 3.1 of [RFC 4055][].
* `saltLength`: {integer} - salt length for when padding is
  `RSA_PKCS1_PSS_PADDING`. The special value
  `crypto.constants.RSA_PSS_SALTLEN_DIGEST` sets the salt length to the digest
  size, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (default) causes it to be
  determined automatically.

The `signature` argument is the previously calculated signature for the data, in
the `signatureFormat` which can be `'latin1'`, `'hex'` or `'base64'`.
If a `signatureFormat` is specified, the `signature` is expected to be a
string; otherwise `signature` is expected to be a [`Buffer`][],
`TypedArray`, or `DataView`.

Returns `true` or `false` depending on the validity of the signature for
the data and public key.

The `verify` object can not be used again after `verify.verify()` has been
called. Multiple calls to `verify.verify()` will result in an error being
thrown.

## `crypto` module methods and properties

### crypto.constants
<!-- YAML
added: v6.3.0
-->

Returns an object containing commonly used constants for crypto and security
related operations. The specific constants currently defined are described in
[Crypto Constants][].

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
-->

The default encoding to use for functions that can take either strings
or [buffers][`Buffer`]. The default value is `'buffer'`, which makes methods
default to [`Buffer`][] objects.

The `crypto.DEFAULT_ENCODING` mechanism is provided for backwards compatibility
with legacy programs that expect `'latin1'` to be the default encoding.

New applications should expect the default to be `'buffer'`. This property may
become deprecated in a future Node.js release.

### crypto.fips
<!-- YAML
added: v6.0.0
-->

Property for checking and controlling whether a FIPS compliant crypto provider is
currently in use. Setting to true requires a FIPS build of Node.js.

### crypto.createCipher(algorithm, password)
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}

Creates and returns a `Cipher` object that uses the given `algorithm` and
`password`.

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On
recent OpenSSL releases, `openssl list-cipher-algorithms` will display the
available cipher algorithms.

The `password` is used to derive the cipher key and initialization vector (IV).
The value must be either a `'latin1'` encoded string, a [`Buffer`][], a
`TypedArray`, or a `DataView`.

The implementation of `crypto.createCipher()` derives keys using the OpenSSL
function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one
iteration, and no salt. The lack of salt allows dictionary attacks as the same
password always creates the same key. The low iteration count and
non-cryptographically secure hash algorithm allow passwords to be tested very
rapidly.

In line with OpenSSL's recommendation to use pbkdf2 instead of
[`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on
their own using [`crypto.pbkdf2()`][] and to use [`crypto.createCipheriv()`][]
to create the `Cipher` object. Users should not use ciphers with counter mode
(e.g. CTR, GCM or CCM) in `crypto.createCipher()`. A warning is emitted when
they are used in order to avoid the risk of IV reuse that causes
vulnerabilities. For the case when IV is reused in GCM, see [Nonce-Disrespecting
Adversaries][] for details.

### crypto.createCipheriv(algorithm, key, iv)
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}

Creates and returns a `Cipher` object, with the given `algorithm`, `key` and
initialization vector (`iv`).

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On
recent OpenSSL releases, `openssl list-cipher-algorithms` will display the
available cipher algorithms.

The `key` is the raw key used by the `algorithm` and `iv` is an
[initialization vector][]. Both arguments must be `'utf8'` encoded strings,
[Buffers][`Buffer`], `TypedArray`, or `DataView`s.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Stability: 0 - Deprecated: Use [`tls.createSecureContext()`][] instead.

- `details` {Object} Identical to [`tls.createSecureContext()`][].

The `crypto.createCredentials()` method is a deprecated function for creating
and returning a `tls.SecureContext`. It should not be used. Replace it with
[`tls.createSecureContext()`][] which has the exact same arguments and return
value.

Returns a `tls.SecureContext`, as-if [`tls.createSecureContext()`][] had been
called.

### crypto.createDecipher(algorithm, password)
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}

Creates and returns a `Decipher` object that uses the given `algorithm` and
`password` (key).

The implementation of `crypto.createDecipher()` derives keys using the OpenSSL
function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one
iteration, and no salt. The lack of salt allows dictionary attacks as the same
password always creates the same key. The low iteration count and
non-cryptographically secure hash algorithm allow passwords to be tested very
rapidly.

In line with OpenSSL's recommendation to use pbkdf2 instead of
[`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on
their own using [`crypto.pbkdf2()`][] and to use [`crypto.createDecipheriv()`][]
to create the `Decipher` object.

### crypto.createDecipheriv(algorithm, key, iv)
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}

Creates and returns a `Decipher` object that uses the given `algorithm`, `key`
and initialization vector (`iv`).

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On
recent OpenSSL releases, `openssl list-cipher-algorithms` will display the
available cipher algorithms.

The `key` is the raw key used by the `algorithm` and `iv` is an
[initialization vector][]. Both arguments must be `'utf8'` encoded strings or
[buffers][`Buffer`].

### crypto.createDiffieHellman(prime[, primeEncoding][, generator][, generatorEncoding])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `prime` argument can be any `TypedArray` or `DataView` now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11983
    description: The `prime` argument can be a `Uint8Array` now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default for the encoding parameters changed
                 from `binary` to `utf8`.
-->
- `prime` {string | Buffer | TypedArray | DataView}
- `primeEncoding` {string}
- `generator` {number | string | Buffer | TypedArray | DataView} Defaults to `2`.
- `generatorEncoding` {string}

Creates a `DiffieHellman` key exchange object using the supplied `prime` and an
optional specific `generator`.

The `generator` argument can be a number, string, or [`Buffer`][]. If
`generator` is not specified, the value `2` is used.

The `primeEncoding` and `generatorEncoding` arguments can be `'latin1'`,
`'hex'`, or `'base64'`.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise
a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string;
otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
- `primeLength` {number}
- `generator` {number | string | Buffer | TypedArray | DataView} Defaults to `2`.

Creates a `DiffieHellman` key exchange object and generates a prime of
`primeLength` bits using an optional specific numeric `generator`.
If `generator` is not specified, the value `2` is used.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
- `curveName` {string}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a
predefined curve specified by the `curveName` string. Use
[`crypto.getCurves()`][] to obtain a list of available curve names. On recent
OpenSSL releases, `openssl ecparam -list_curves` will also display the name
and description of each available elliptic curve.

### crypto.createHash(algorithm)
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}

Creates and returns a `Hash` object that can be used to generate hash digests
using the given `algorithm`.

The `algorithm` is dependent on the available algorithms supported by the
version of OpenSSL on the platform. Examples are `'sha256'`, `'sha512'`, etc.
On recent releases of OpenSSL, `openssl list-message-digest-algorithms` will
display the available digest algorithms.

Example: generating the sha256 sum of a file

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hash = crypto.createHash('sha256');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  const data = input.read();
  if (data)
    hash.update(data);
  else {
    console.log(`${hash.digest('hex')} ${filename}`);
  }
});
```

### crypto.createHmac(algorithm, key)
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}

Creates and returns an `Hmac` object that uses the given `algorithm` and `key`.

The `algorithm` is dependent on the available algorithms supported by the
version of OpenSSL on the platform. Examples are `'sha256'`, `'sha512'`, etc.
On recent releases of OpenSSL, `openssl list-message-digest-algorithms` will
display the available digest algorithms.

The `key` is the HMAC key used to generate the cryptographic HMAC hash.

Example: generating the sha256 HMAC of a file

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  const data = input.read();
  if (data)
    hmac.update(data);
  else {
    console.log(`${hmac.digest('hex')} ${filename}`);
  }
});
```

### crypto.createSign(algorithm)
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}

Creates and returns a `Sign` object that uses the given `algorithm`.
Use [`crypto.getHashes()`][] to obtain an array of names of the available
signing algorithms.

### crypto.createVerify(algorithm)
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}

Creates and returns a `Verify` object that uses the given algorithm.
Use [`crypto.getHashes()`][] to obtain an array of names of the available
signing algorithms.

### crypto.getCiphers()
<!-- YAML
added: v0.9.3
-->

Returns an array with the names of the supported cipher algorithms.

Example:

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()
<!-- YAML
added: v2.3.0
-->

Returns an array with the names of the supported elliptic curves.

Example:

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)
<!-- YAML
added: v0.7.5
-->
- `groupName` {string}

Creates a predefined `DiffieHellman` key exchange object. The
supported groups are: `'modp1'`, `'modp2'`, `'modp5'` (defined in
[RFC 2412][], but see [Caveats][]) and `'modp14'`, `'modp15'`,
`'modp16'`, `'modp17'`, `'modp18'` (defined in [RFC 3526][]). The
returned object mimics the interface of objects created by
[`crypto.createDiffieHellman()`][], but will not allow changing
the keys (with [`diffieHellman.setPublicKey()`][] for example). The
advantage of using this method is that the parties do not have to
generate nor exchange a group modulus beforehand, saving both processor
and communication time.

Example (obtaining a shared secret):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* aliceSecret and bobSecret should be the same */
console.log(aliceSecret === bobSecret);
```

### crypto.getHashes()
<!-- YAML
added: v0.9.3
-->

Returns an array of the names of the supported hash algorithms,
such as `RSA-SHA256`.

Example:

```js
const hashes = crypto.getHashes();
console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
```

### crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)
<!-- YAML
added: v0.5.5
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11305
    description: The `digest` parameter is always required now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4047
    description: Calling this function without passing the `digest` parameter
                 is deprecated now and will emit a warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default encoding for `password` if it is a string changed
                 from `binary` to `utf8`.
-->
- `password` {string}
- `salt` {string}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- `callback` {Function}
  - `err` {Error}
  - `derivedKey` {Buffer}

Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2)
implementation. A selected HMAC digest algorithm specified by `digest` is
applied to derive a key of the requested byte length (`keylen`) from the
`password`, `salt` and `iterations`.

The supplied `callback` function is called with two arguments: `err` and
`derivedKey`. If an error occurs, `err` will be set; otherwise `err` will be
null. The successfully generated `derivedKey` will be passed as a [`Buffer`][].

The `iterations` argument must be a number set as high as possible. The
higher the number of iterations, the more secure the derived key will be,
but will take a longer amount of time to complete.

The `salt` should also be as unique as possible. It is recommended that the
salts are random and their lengths are greater than 16 bytes. See
[NIST SP 800-132][] for details.

Example:

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 512, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...aa39b34'
});
```

An array of supported digest functions can be retrieved using
[`crypto.getHashes()`][].

Note that this API uses libuv's threadpool, which can have surprising and
negative performance implications for some applications, see the
[`UV_THREADPOOL_SIZE`][] documentation for more information.

### crypto.pbkdf2Sync(password, salt, iterations, keylen, digest)
<!-- YAML
added: v0.9.3
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4047
    description: Calling this function without passing the `digest` parameter
                 is deprecated now and will emit a warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default encoding for `password` if it is a string changed
                 from `binary` to `utf8`.
-->
- `password` {string}
- `salt` {string}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}

Provides a synchronous Password-Based Key Derivation Function 2 (PBKDF2)
implementation. A selected HMAC digest algorithm specified by `digest` is
applied to derive a key of the requested byte length (`keylen`) from the
`password`, `salt` and `iterations`.

If an error occurs an Error will be thrown, otherwise the derived key will be
returned as a [`Buffer`][].

The `iterations` argument must be a number set as high as possible. The
higher the number of iterations, the more secure the derived key will be,
but will take a longer amount of time to complete.

The `salt` should also be as unique as possible. It is recommended that the
salts are random and their lengths are greater than 16 bytes. See
[NIST SP 800-132][] for details.

Example:

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 512, 'sha512');
console.log(key.toString('hex'));  // '3745e48...aa39b34'
```

An array of supported digest functions can be retrieved using
[`crypto.getHashes()`][].

### crypto.privateDecrypt(privateKey, buffer)
<!-- YAML
added: v0.11.14
-->
- `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in
    `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`,
    `RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}

Decrypts `buffer` with `privateKey`.

`privateKey` can be an object or a string. If `privateKey` is a string, it is
treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

### crypto.privateEncrypt(privateKey, buffer)
<!-- YAML
added: v1.1.0
-->
- `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in
    `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or
    `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}

Encrypts `buffer` with `privateKey`.

`privateKey` can be an object or a string. If `privateKey` is a string, it is
treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

### crypto.publicDecrypt(publicKey, buffer)
<!-- YAML
added: v1.1.0
-->
- `publicKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in
    `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or
    `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}

Decrypts `buffer` with `publicKey`.

`publicKey` can be an object or a string. If `publicKey` is a string, it is
treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

Because RSA public keys can be derived from private keys, a private key may
be passed instead of a public key.

### crypto.publicEncrypt(publicKey, buffer)
<!-- YAML
added: v0.11.14
-->
- `publicKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in
    `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`,
    `RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}

Encrypts the content of `buffer` with `publicKey` and returns a new
[`Buffer`][] with encrypted content.

`publicKey` can be an object or a string. If `publicKey` is a string, it is
treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

Because RSA public keys can be derived from private keys, a private key may
be passed instead of a public key.

### crypto.randomBytes(size[, callback])
<!-- YAML
added: v0.5.8
-->
- `size` {number}
- `callback` {Function}
  - `err` {Error}
  - `buf` {Buffer}

Generates cryptographically strong pseudo-random data. The `size` argument
is a number indicating the number of bytes to generate.

If a `callback` function is provided, the bytes are generated asynchronously
and the `callback` function is invoked with two arguments: `err` and `buf`.
If an error occurs, `err` will be an Error object; otherwise it is null. The
`buf` argument is a [`Buffer`][] containing the generated bytes.

```js
// Asynchronous
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
```

If the `callback` function is not provided, the random bytes are generated
synchronously and returned as a [`Buffer`][]. An error will be thrown if
there is a problem generating the bytes.

```js
// Synchronous
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} bytes of random data: ${buf.toString('hex')}`);
```

The `crypto.randomBytes()` method will not complete until there is
sufficient entropy available.
This should normally never take longer than a few milliseconds. The only time
when generating the random bytes may conceivably block for a longer period of
time is right after boot, when the whole system is still low on entropy.

Note that this API uses libuv's threadpool, which can have surprising and
negative performance implications for some applications, see the
[`UV_THREADPOOL_SIZE`][] documentation for more information.

### crypto.randomFillSync(buffer[, offset][, size])
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Must be supplied.
* `offset` {number} Defaults to `0`.
* `size` {number} Defaults to `buffer.length - offset`.

Synchronous version of [`crypto.randomFill()`][].

Returns `buffer`

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// The above is equivalent to the following:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

### crypto.randomFill(buffer[, offset][, size], callback)
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Must be supplied.
* `offset` {number} Defaults to `0`.
* `size` {number} Defaults to `buffer.length - offset`.
* `callback` {Function} `function(err, buf) {}`.

This function is similar to [`crypto.randomBytes()`][] but requires the first
argument to be a [`Buffer`][] that will be filled. It also
requires that a callback is passed in.

If the `callback` function is not provided, an error will be thrown.

```js
const buf = Buffer.alloc(10);
crypto.randomFill(buf, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

crypto.randomFill(buf, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

// The above is equivalent to the following:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Note that this API uses libuv's threadpool, which can have surprising and
negative performance implications for some applications, see the
[`UV_THREADPOOL_SIZE`][] documentation for more information.

### crypto.setEngine(engine[, flags])
<!-- YAML
added: v0.11.11
-->
- `engine` {string}
- `flags` {crypto.constants} Defaults to `crypto.constants.ENGINE_METHOD_ALL`.

Load and set the `engine` for some or all OpenSSL functions (selected by flags).

`engine` could be either an id or a path to the engine's shared library.

The optional `flags` argument uses `ENGINE_METHOD_ALL` by default. The `flags`
is a bit field taking one of or a mix of the following flags (defined in
`crypto.constants`):

* `crypto.constants.ENGINE_METHOD_RSA`
* `crypto.constants.ENGINE_METHOD_DSA`
* `crypto.constants.ENGINE_METHOD_DH`
* `crypto.constants.ENGINE_METHOD_RAND`
* `crypto.constants.ENGINE_METHOD_ECDH`
* `crypto.constants.ENGINE_METHOD_ECDSA`
* `crypto.constants.ENGINE_METHOD_CIPHERS`
* `crypto.constants.ENGINE_METHOD_DIGESTS`
* `crypto.constants.ENGINE_METHOD_STORE`
* `crypto.constants.ENGINE_METHOD_PKEY_METHS`
* `crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS`
* `crypto.constants.ENGINE_METHOD_ALL`
* `crypto.constants.ENGINE_METHOD_NONE`

### crypto.timingSafeEqual(a, b)
<!-- YAML
added: v6.6.0
-->
- `a` {Buffer | TypedArray | DataView}
- `b` {Buffer | TypedArray | DataView}

Returns true if `a` is equal to `b`, without leaking timing information that
would allow an attacker to guess one of the values. This is suitable for
comparing HMAC digests or secret values like authentication cookies or
[capability urls](https://www.w3.org/TR/capability-urls/).

`a` and `b` must both be `Buffer`s, `TypedArray`s, or `DataView`s, and they
must have the same length.

*Note*: Use of `crypto.timingSafeEqual` does not guarantee that the
*surrounding* code is timing-safe. Care should be taken to ensure that the
surrounding code does not introduce timing vulnerabilities.

## Notes

### Legacy Streams API (pre Node.js v0.10)

The Crypto module was added to Node.js before there was the concept of a
unified Stream API, and before there were [`Buffer`][] objects for handling
binary data. As such, the many of the `crypto` defined classes have methods not
typically found on other Node.js classes that implement the [streams][stream]
API (e.g. `update()`, `final()`, or `digest()`). Also, many methods accepted
and returned `'latin1'` encoded strings by default rather than Buffers. This
default was changed after Node.js v0.8 to use [`Buffer`][] objects by default
instead.

### Recent ECDH Changes

Usage of `ECDH` with non-dynamically generated key pairs has been simplified.
Now, [`ecdh.setPrivateKey()`][] can be called with a preselected private key
and the associated public point (key) will be computed and stored in the object.
This allows code to only store and provide the private part of the EC key pair.
[`ecdh.setPrivateKey()`][] now also validates that the private key is valid for
the selected curve.

The [`ecdh.setPublicKey()`][] method is now deprecated as its inclusion in the
API is not useful. Either a previously stored private key should be set, which
automatically generates the associated public key, or [`ecdh.generateKeys()`][]
should be called. The main drawback of using [`ecdh.setPublicKey()`][] is that
it can be used to put the ECDH key pair into an inconsistent state.

### Support for weak or compromised algorithms

The `crypto` module still supports some algorithms which are already
compromised and are not currently recommended for use. The API also allows
the use of ciphers and hashes with a small key size that are considered to be
too weak for safe use.

Users should take full responsibility for selecting the crypto
algorithm and key size according to their security requirements.

Based on the recommendations of [NIST SP 800-131A][]:

- MD5 and SHA-1 are no longer acceptable where collision resistance is
  required such as digital signatures.
- The key used with RSA, DSA and DH algorithms is recommended to have
  at least 2048 bits and that of the curve of ECDSA and ECDH at least
  224 bits, to be safe to use for several years.
- The DH groups of `modp1`, `modp2` and `modp5` have a key size
  smaller than 2048 bits and are not recommended.

See the reference for other recommendations and details.

## Crypto Constants

The following constants exported by `crypto.constants` apply to letious uses of
the `crypto`, `tls`, and `https` modules and are generally specific to OpenSSL.

### OpenSSL Options

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Applies multiple bug workarounds within OpenSSL. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html for
    detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Allows legacy insecure renegotiation between OpenSSL and unpatched
    clients or servers. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Attempts to use the server's preferences instead of the client's when
    selecting a cipher. Behavior depends on protocol version. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CISCO_ANYCONNECT</code></td>
    <td>Instructs OpenSSL to use Cisco's "speshul" version of DTLS_BAD_VER.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_COOKIE_EXCHANGE</code></td>
    <td>Instructs OpenSSL to turn on cookie exchange.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CRYPTOPRO_TLSEXT_BUG</code></td>
    <td>Instructs OpenSSL to add server-hello extension from an early version
    of the cryptopro draft.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS</code></td>
    <td>Instructs OpenSSL to disable a SSL 3.0/TLS 1.0 vulnerability
    workaround added in OpenSSL 0.9.6d.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_EPHEMERAL_RSA</code></td>
    <td>Instructs OpenSSL to always use the tmp_rsa key when performing RSA
    operations.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_LEGACY_SERVER_CONNECT</code></td>
    <td>Allows initial connection to servers that do not support RI.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_MICROSOFT_SESS_ID_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_MSIE_SSLV2_RSA_PADDING</code></td>
    <td>Instructs OpenSSL to disable the workaround for a man-in-the-middle
    protocol-version vulnerability in the SSL 2.0 server implementation.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_CA_DN_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_CHALLENGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_COMPRESSION</code></td>
    <td>Instructs OpenSSL to disable support for SSL/TLS compression.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_QUERY_MTU</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION</code></td>
    <td>Instructs OpenSSL to always start a new session when performing
    renegotiation.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv2</code></td>
    <td>Instructs OpenSSL to turn off SSL v2</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv3</code></td>
    <td>Instructs OpenSSL to turn off SSL v3</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TICKET</code></td>
    <td>Instructs OpenSSL to disable use of RFC4507bis tickets.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1</code></td>
    <td>Instructs OpenSSL to turn off TLS v1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_1</code></td>
    <td>Instructs OpenSSL to turn off TLS v1.1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_2</code></td>
    <td>Instructs OpenSSL to turn off TLS v1.2</td>
  </tr>
    <td><code>SSL_OP_PKCS1_CHECK_1</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_PKCS1_CHECK_2</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_DH_USE</code></td>
    <td>Instructs OpenSSL to always create a new key when using
    temporary/ephemeral DH parameters.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_ECDH_USE</code></td>
    <td>Instructs OpenSSL to always create a new key when using
    temporary/ephemeral ECDH parameters.</td>
  </tr>
    <td><code>SSL_OP_SSLEAY_080_CLIENT_DH_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_BLOCK_PADDING_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_D5_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_ROLLBACK_BUG</code></td>
    <td>Instructs OpenSSL to disable version rollback attack detection.</td>
  </tr>
</table>

### OpenSSL Engine Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RSA</code></td>
    <td>Limit engine usage to RSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DSA</code></td>
    <td>Limit engine usage to DSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DH</code></td>
    <td>Limit engine usage to DH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RAND</code></td>
    <td>Limit engine usage to RAND</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ECDH</code></td>
    <td>Limit engine usage to ECDH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ECDSA</code></td>
    <td>Limit engine usage to ECDSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_CIPHERS</code></td>
    <td>Limit engine usage to CIPHERS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DIGESTS</code></td>
    <td>Limit engine usage to DIGESTS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_STORE</code></td>
    <td>Limit engine usage to STORE</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_METHS</code></td>
    <td>Limit engine usage to PKEY_METHDS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_ASN1_METHS</code></td>
    <td>Limit engine usage to PKEY_ASN1_METHS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ALL</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_NONE</code></td>
    <td></td>
  </tr>
</table>

### Other OpenSSL Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>DH_CHECK_P_NOT_SAFE_PRIME</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_CHECK_P_NOT_PRIME</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_UNABLE_TO_CHECK_GENERATOR</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_NOT_SUITABLE_GENERATOR</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>NPN_ENABLED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>ALPN_ENABLED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_SSLV23_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_NO_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_OAEP_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_X931_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_PSS_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_DIGEST</code></td>
    <td>Sets the salt length for `RSA_PKCS1_PSS_PADDING` to the digest size
        when signing or verifying.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_MAX_SIGN</code></td>
    <td>Sets the salt length for `RSA_PKCS1_PSS_PADDING` to the maximum
        permissible value when signing data.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_AUTO</code></td>
    <td>Causes the salt length for `RSA_PKCS1_PSS_PADDING` to be determined
        automatically when verifying a signature.</td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_COMPRESSED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_UNCOMPRESSED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_HYBRID</code></td>
    <td></td>
  </tr>
</table>

### Node.js Crypto Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>defaultCoreCipherList</code></td>
    <td>Specifies the built-in default cipher list used by Node.js.</td>
  </tr>
  <tr>
    <td><code>defaultCipherList</code></td>
    <td>Specifies the active default cipher list used by the current Node.js
    process.</td>
  </tr>
</table>


[`Buffer`]: buffer.html
[`EVP_BytesToKey`]: https://www.openssl.org/docs/man1.0.2/crypto/EVP_BytesToKey.html
[`UV_THREADPOOL_SIZE`]: cli.html#cli_uv_threadpool_size_size
[`cipher.final()`]: #crypto_cipher_final_outputencoding
[`cipher.update()`]: #crypto_cipher_update_data_inputencoding_outputencoding
[`crypto.createCipher()`]: #crypto_crypto_createcipher_algorithm_password
[`crypto.createCipheriv()`]: #crypto_crypto_createcipheriv_algorithm_key_iv
[`crypto.createDecipher()`]: #crypto_crypto_createdecipher_algorithm_password
[`crypto.createDecipheriv()`]: #crypto_crypto_createdecipheriv_algorithm_key_iv
[`crypto.createDiffieHellman()`]: #crypto_crypto_creatediffiehellman_prime_primeencoding_generator_generatorencoding
[`crypto.createECDH()`]: #crypto_crypto_createecdh_curvename
[`crypto.createHash()`]: #crypto_crypto_createhash_algorithm
[`crypto.createHmac()`]: #crypto_crypto_createhmac_algorithm_key
[`crypto.createSign()`]: #crypto_crypto_createsign_algorithm
[`crypto.createVerify()`]: #crypto_crypto_createverify_algorithm
[`crypto.getCurves()`]: #crypto_crypto_getcurves
[`crypto.getHashes()`]: #crypto_crypto_gethashes
[`crypto.pbkdf2()`]: #crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback
[`crypto.randomBytes()`]: #crypto_crypto_randombytes_size_callback
[`crypto.randomFill()`]: #crypto_crypto_randomfill_buffer_offset_size_callback
[`decipher.final()`]: #crypto_decipher_final_outputencoding
[`decipher.update()`]: #crypto_decipher_update_data_inputencoding_outputencoding
[`diffieHellman.setPublicKey()`]: #crypto_diffiehellman_setpublickey_publickey_encoding
[`ecdh.generateKeys()`]: #crypto_ecdh_generatekeys_encoding_format
[`ecdh.setPrivateKey()`]: #crypto_ecdh_setprivatekey_privatekey_encoding
[`ecdh.setPublicKey()`]: #crypto_ecdh_setpublickey_publickey_encoding
[`hash.digest()`]: #crypto_hash_digest_encoding
[`hash.update()`]: #crypto_hash_update_data_inputencoding
[`hmac.digest()`]: #crypto_hmac_digest_encoding
[`hmac.update()`]: #crypto_hmac_update_data_inputencoding
[`sign.sign()`]: #crypto_sign_sign_privatekey_outputformat
[`sign.update()`]: #crypto_sign_update_data_inputencoding
[`tls.createSecureContext()`]: tls.html#tls_tls_createsecurecontext_options
[`verify.update()`]: #crypto_verifier_update_data_inputencoding
[`verify.verify()`]: #crypto_verifier_verify_object_signature_signatureformat
[Caveats]: #crypto_support_for_weak_or_compromised_algorithms
[Crypto Constants]: #crypto_crypto_constants_1
[HTML5's `keygen` element]: http://www.w3.org/TR/html5/forms.html#the-keygen-element
[NIST SP 800-131A]: http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf
[NIST SP 800-132]: http://csrc.nist.gov/publications/nistpubs/800-132/nist-sp800-132.pdf
[Nonce-Disrespecting Adversaries]: https://github.com/nonce-disrespect/nonce-disrespect
[OpenSSL's SPKAC implementation]: https://www.openssl.org/docs/man1.0.2/apps/spkac.html
[RFC 2412]: https://www.rfc-editor.org/rfc/rfc2412.txt
[RFC 3526]: https://www.rfc-editor.org/rfc/rfc3526.txt
[RFC 4055]: https://www.rfc-editor.org/rfc/rfc4055.txt
[initialization vector]: https://en.wikipedia.org/wiki/Initialization_vector
[stream-writable-write]: stream.html#stream_writable_write_chunk_encoding_callback
[stream]: stream.html
