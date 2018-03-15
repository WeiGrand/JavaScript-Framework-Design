# 种子模块

### 时下流行的3种定义模块的规范：

AMD

```javascript
define(['./aaa', './bbb'], function(a, b) {
    return {
        c: a + b
    }
})
```

CommonJS

```javascript
var a = require('./aaa');
var b = require('./bbb');
module.exports = {
    c: a + b
}
```

ES6 module

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



# 类型的判定

`JavaScirpt` 存在两套类型系统

- 基本数据类型：`undefined`、`string`、`null`、`boolean`、`function`、`object` => 通过 `typeof` 检测 (ES6 加入了 `Symbol`)
- 对象类型 => 通过 `instanceof` 检测



`JavaScript` 自带的识别机制不靠谱

> `IE` 下 `typeof` 会有返回 `unknown` 的情况，可以用于判定某个 `VBscript` 的方法是否存在。

`isArray` 早些年的探索：

```javascript
function isArray(arr) {
    return arr instanceof Array;
}

function isArray(arr) {
    return !!arr && arr.constructor == Array;
}

function isArray(arr) { //Prototype.js
    return arr != null &&
        typeof arr === 'object' &&
        'splice' in arr &&
        'join' in arr;
}

function isArray(arr) {//Douglas Crockford
    return typeof arr.sort === 'function';
}

function isArray(arr) {//kriszyp
    var result = false;
    try {
        new arr.constructor(Math.pow(2, 32));
    } catch(e) {
        result = /Array/.test(e.message);
    }
    return result;
}

function isArray(arr) {//kangax 1
    try {
        Array.prototype.toString.call(arr);
        return true
    } catch(e) {
        return false
    }
}

function isArray(arr) {//kangax 2
    if(arr && typeof arr == 'object' && typeof arr.length == 'number' && isFinite(arr.length)) {
        //上面基本排除剩类数组，下面就是为了区别类数组
        var _origLength = arr.length;
        arr[arr.length] = '__test__'; //如果是数组 length 会增加1
        var _newLength = arr.length; 
        arr.length = _origLength; //这步是为了把刚才用来测试的 __test__ 去掉，但如果是类数组这样去不掉...
        return _newLength == _origLength + 1;
    }
    
    return false;
}
```

其中对 `kriszyp` 的实现，本人做了以下测试

```javascript
const str = 'string';
const num = 123;
function func() {};
const nl = null;
const und = void 0;
const obj = {};
const arr = [];

[str, num, func, nl, und, obj, arr].forEach(el => {
    try {
        new el.constructor(Math.pow(2, 32));
    } catch(e) {
        console.log(e.message);
    }
});

//output
//"Cannot read property 'constructor' of null"
//"Cannot read property 'constructor' of undefined"
//"Invalid array length"
```

所以本人觉得是不是应该用 `/Array/i.test` 才对呢，有待深究



判断 `null`、`undefined`、`NaN` 的方法：

```javascript
function isNaN(obj) {
    return obj !== obj;
}

function isNull(obj) {
    return obj === null;
}

function isUndefined(obj) {
    return obj === void 0;
}
```



`Object.prototype,toString` 直接输出对象内部的 `[[Class]]` 用她基本可以跳过95%的陷阱，但是用于检测 `window` 就有坑了。

```javascript
[object Object] //IE678
[object Window] //IE9 firefox3.6 opera10
[object DOWWindow] //safari4.04
[object global] //chrome5.0.3.22
```

可以看出也是IE678问题比较大，其他浏览器虽然返回不同但起码不会和 `Object` 混淆。

可以用以下方法识别IE678中的 `window`

```javascript
window == document //true
document == window //false
```

### type

jQuery 的 `type` 方法实现

```javascript
var class2type;
jQuery.each('String Number Boolean Object Function Array Date Regexp Error'.split(' '), function(i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});

jQuery.type = function(obj) {
    if(obj == null) {// handle null undefined
        return String(obj);
    }
    
    return typeof obj === 'object' || typeof obj === 'function' ? 
        class2type[core_toString.call(obj)] || 'object' :
    	typeof obj;
}
```

### isPlainObject

> `plain object` 指纯净的 `JavaScript` 对象，既不是 `DOM`、`BOM` 也不是自定义“类”的实例。

大体思路是排除 `DOM`和`window`, 然后检测其`construcor`是否是 `Object`

```javascript
//jQuery 
var toString = class2type.toString;
var getProto = Object.getPrototypeOf;
var hasOwn = class2type.hasOwnProperty;
var fnToString.call = hasOwn.toString;// 函数 to string
var ObjectFunctionString = fnToString.call(Object);
jQuery.isPlainObject = function(obj) {
    if(!obj || toString.call(obj) !== '[object Object]') {
        return false;
    }
    
    var proto = getProto(obj);
    
    //没有 prototype 基本就是 plain (如：Object.create(null))
    if(!proto) {
        return true;
    }
    
    var Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor === 'function' &&
        fnToString(Ctor) === ObjectFunctionToString; //对比constructor是否等于Object
}
```



```javascript
//avalon
avalon.isPlainObject = function(obj) {
    return typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}
```



### isWindow

`avalon` 的实现

```javascript
avalon.isWindow = function(obj) {
    if(!obj)
        return false;
    
    //用于检测IE678
    return obj == document && document != obj;
}

var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/;
function isWindow(obj) { //检测 window 的同时检测是否 IE678
    return rwindow.test(toString.call(obj));
}

if(isWindow(window)) { //不是IE678则用regexp判断
    avalon.isWindow = isWindow;
}
```



### isNumeric

```javascript
//jQuery 1.71~1.72
jQuery.isNumeric = function(obj) {
    return !isNaN(parseFloat(obj)) &&
        isFinite(obj);
}

//jQuery 2.1
jQuery.isNumeric = function(obj) {
    return obj - parseFloat(obj) >= 0;
}
```



### isArrayLike

识别类数组的手段是它应该有一个 `>=0` 的整形 `length` 属性。此外，`window`与函数和元素节点不算类数组。

jQuery的实现：

```javascript
//jQuery2.0
function isArrayLike(obj) {
    var length = obj.length, type = jQuery.type(obj);
    if(jQuery.isWindow(obj))
        return false;
    if(obj.nodeType === 1 && length)
        return true;
    
    return type === 'array' ||
        type !== 'function' && (length === 0 || 
                                typeof length === 'number' && length > 0 && (length - 1) in obj);
}

//jQuery3.0
function isArrayLike(obj) {
    var length = !!obj && 'length' in obj && obj.length,
        type = jQuery.type(obj);
    
    if(type === 'function' || jQuery.isWindow(obj))
        return false;
    
    return type === 'array' ||
        length === 0 ||
        typeof length === 'number' && length > 0 && (length - 1) in obj;
}
```

avalon的实现

```javascript
//avalon 1.4
var toString = class2type.toString;
var rarrayLike = /(Array|List|Collection|Map|Arguments)\]$/;
var rfunction = /^\s*\bfunction\b/;
function isArrayLike(obj) {
    if(!obj)
        return false;
    var n = obj.length;
    if(n === (n >>> 0)) { //非负整数的判断方法 相对于 typeof n === 'number' && n >= 0
        var type = toString.call(obj).slice(8, -1);
        if(rarrayLike.test(type)) //感觉逻辑有问题
            return false; //为什么return false ?
        if(type === 'Array')
            return true;
        try {//IE的NodeList会报错
            if({}.propertyIsEnumerable.call(obj, 'length') === false) { //原生对象
                return rfunction.test(obj.item ||
                                     obj,callee);
            }
            
            return true;
        } catch(e) {
            return !obj.window //IE678 window
        }
    }
    
    return false;
}

//avalon.mobile
function isArrayLike(obj) {
    if(obj && typeof obj === 'object') {
        var n = obj.length, str = toString.call(obj);
        
        if(rarrayLike.test(str))
            return true;
        else if(str === '[object Object]' && n === (n >>> 0))
            return true;
    }
    
    return false;
}
```



# domReady

`DOMContentLoaded` 事件的别称，具体实现策略：

- 对于支持 `DOMContentLoaded` 事件的使用 `DOMContentLoaded` 事件，但如果 `script` 是动态加载的，在插入 `DOM树` 的时候， `DOM树` 已经建完了，这是需要监听 `onload` 和判断 `document.readyState` 是否为 `complete`，不过 `document.readyState` 在 `FirxFox` 中有兼容问题。

  ```javascript
  //avalon 实现参见 domReady.js
  ```

- 旧版本IE使用 `Diego Perini` 发现的 `hack`

  ```javascript
  function IEContentLoaded(w, fn) {
      var d = w.document, done = false;
      
      function init() {
          if(!done) {
              done = true;
              fn();
          }
      }
      
      (function() {
          try {
              d.documentElement.doScroll('left');
          } catch(e) {
              setTimeout(arguments.calle, 50);
              return;
          }
          
          init();
      })();
      
      d.onreadystatechange = function() {
          if(d.readyState == 'complete') {
              d.onreadystatechange = null;
              init();
          }
      }
  }
  ```

  此外，IE还可以通过 `script defer hack` 进行判定

  ```javascript
  documemt.write("<script id=__ie_onload defer src=//0><\/scr" + "ipt>");
  var script = document.getElementById('__ie_onload');
  script.onreadystatechange = function() {
      if(this.readyState == 'complete') {
          //init
      }
  }
  ```



# 无冲突处理

以 `jQuery` 为例，`无冲突处理` 其实就是把 `$` 让给其她库，自己则使用 `jQuery(selector)`

```javascript
//在初始化的前缓存 window 上 的 $ 和 jQuery，等初始化之后再将原来的 $ 和 jQuery 赋值回 window 上。

var window = this,
    _jQuery = window.jQuery, //undefined or other lib
    _$ = window.$, //undefined or other lib
    jQuery = window.jQuery = window.$ = function(selector, context) {
        return new jQuery.fn.init(selector, context);
    }

jQuery.extend({
    noConflict: function(deep) {
        window.$ = _$;
        if(deep) {
            window.jQuery = _jQuery;
        }
        
       	return jQuery;
    }
});
```

