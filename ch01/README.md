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

由于功能很常用，在ES6中对它进行了支持，于是有了 `Object.assign` 。要在低端浏览器中使用的话需要使用以下 `polyfill` (指复制缺少API和API功能的行为)：

```javascript
module.exports = Object.assign || function(target, source) {
    const to = (target === null || target === void 0) ? 
        throw new TypeError('Object.assign can not be called with null or undefined') :
    	Object(target);
    
    const argLength = arguments.length;
    
    for(let i = 1; i < argLength; i++) {
        let from = Object(arguments[i]);
        let keys = Object.keys(from);
        let keysLength = keys.length;
        
        for(let j = 0; j < keysLength; j++) {
            to[key[j]] = from[key[j]];
        }
    }
    
    return to;
}
```



# 数组化

浏览器中存在的类数组对象有：

`function` 里的 `arguments`

`document.forms`

`form.elements`

`documents.links`

`select.options`

`document.getElementsByName`

`document.getElementsByTagName`

`childNodes`

`children`

```javascript
const arrayLike = {
    0: 'a',
    1: '1',
    2: '2',
    length: 3
}
```

通常使用 `Array.prototype.slice.call` 对类数组进行转换，但旧版IE的 `HTMLCollection` 和 `NodeList` 不是 `Object` 的子类，所以会报错。不同库有各自的解决方案。

jQuery 的处理如下

```javascript
var makeArray = function(array) {
    var ret = [];
    if(array != null) {
        var i = array.length;
        
        // 其中 window, string, function 也有 length 属性，要排除
        if(i == null || //没有 length
           typeof array === 'string' || //string
           jQuery.isFunction(array) || //function
           array.setInterval //window
          ) {
            ret[0] = array;
        }else {
            while(i) {
                ret[--i] = array[i];
            }
        }
    }
    
    return ret;
}
```

Prototype.js 的处理如下

```javascript
function $A(iterable) {
    if(!iterable)
        return [];
    if(iterable.toArray
        return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while(length--)
        results[length] = iterable[length];
    return results;
}
```

mootools 的处理如下

```javascript
function $A(iterable) {
    if(iterable.item) { //用于区分是否 HTMLCollection 因为 HTMLCollection 有 item 方法，用于获取元素 h.item(0) => 第一个元素
        var l = iterable.length, array = new Array(l);
        while(l--)
            array[l] = iterable[l];
        return array;
    }
    
    return Array.prototype.slice.call(iterable);
}
```

avalon 的处理如下

```javascript
//参见 slice.js
```





