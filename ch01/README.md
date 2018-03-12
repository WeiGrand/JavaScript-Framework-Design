# 种子模块

### 时下流行的3种定义模块的规范：

//AMD

```javascript
define(['./aaa', './bbb'], function(a, b) {
    return {
        c: a + b
    }
})
```

//CommonJS

```javascript
var a = require('./aaa');
var b = require('./bbb');
module.exports = {
    c: a + b
}
```

//es6 module

```javascript
import a from './aaa';
import b from './bbb';
var c = a + b;
export { c }
```

**种子模块**也叫**核心模块**，是框架最先执行的部分。

作者认为种子模块应该包含如下功能：

### 对象扩展

`对象扩展` 一般命名为 `extend` 或 `mixin` 。

一个简单的实现如下：

```javascript
//Prototype.js
function extend(destination, source) {
    for(var property in source) {
        destination[property] = source[property];
    }
    
    return destination;
}
```

旧版IE在这里有问题，无法遍历名为 `valueOf` 、`toString` 的属性名（Object的原型方法）。

这里随便提到了 `Object.keys` 的模拟实现

```javascript
//其中 for(...) 里面每次循环相当于给 a[n] 赋值 所以 a.length 不断增大
Object.keys = Object.keys || function(obj) {
    var a = [];
    for(a[a.length] in obj);
    return a;
}
```

以下是 `avalon` 对 `对象扩展`的实现 (几乎照搬 `jQuery.extend`)

```javascript
//参见 ch01/extend.js
```

