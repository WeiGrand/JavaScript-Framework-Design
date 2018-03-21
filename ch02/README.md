# 语言模块

- [字符串的扩展与修复](#字符串的扩展与修复)
- [数组的扩展与修复](#数组的扩展与修复)
- [数值的扩展与修复](#数值的扩展与修复)
- [函数的扩展与修复](#函数的扩展与修复)

## 字符串的扩展与修复

字符串方法分为

- 当前原型链的标签方法：`anchor`、`big`、`blink`、`bold`、`fixed`、`fontcolor`、`italics`、`link`、`small`、`strike`、`sub`、`sup`
- 当前原型链的非标签方法：`charAt`、`charAtCode`、`concat`、`indexOf`、`lastIndexOf`、`localeCompare`、`match`、`replace`、`search`、`slice`、`split`、`substr`、`substring`、`toLocaleLowerCase`、`toLocaleUpperCase`、`toLowerCase`、`toUpperCase`
- 上级原型链的方法：`toString`、`valueOf`

> 数值的 `toString` 有一个参数，通过它可以转换为对应进值的数值
>
> ```javascript
> (907).toString(32) //'sb'
> ```

avalon 为字符串添加了如下扩展：

### contains

判断一个字符串是否包含另一个字符串

```javascript
function contains(target, it) {
    return target.indexOf(it) !== -1; //search, lastIndexOf也可以
}

//mootools
function contains(target, str, separator) {
    return separator ?
        (separator + target + separator).indexOf(separator + str + separator) > -1 :
    	target.indexOf(str) > -1;
}
```



### startsWith

判断字符串是否位于原字符串的开始之处

```javascript
function startsWith(target, str, ignorecase) {
    var start_str = target.substr(0, str.length);
    
    return ignorecase ? start_str.toLowerCase() === str.toLowerCase() : start_str === str;
}
```



### endsWith

与 `startsWith` 相反

```javascript
function endsWith(target, str, ignorecase) {
    var end_str = target.substring(target.length - str.length);
    
    return ignorecase ? end_str.toLowerCase() === str.toLowerCase() : end_str === str;
}
```



### repeat

将一个字符串重复 N 次

```javascript
//version 1
function repeat(target. n) {
    return (new Array(n + 1)).join(target); //每次创建数组，性能低
}

//version 2
function repeat(target, n) {
    return Array.prototype.join.call({ //每次都在原型链寻找方法和创建对象，性能也不好
        length: n + 1
    }, target);
}

//version 3
var repeat = (function() {
    var join = Array.prototype.join, obj = {}; //缓存原型链方法和类数组对象
    
    return function(target, n) {
        obj.length = n + 1;
        return join.call(obj, target);
    }
})();

//version 4
function repeat(target, n) {
    var s = target, total = [];
    
    while(n > 0) {
        if(n % 2 === 1)
            total[total.length] = s;
        
        if(n === 1)
            break;
        
        s += s;
        n = n >> 1; //Math.floor(n / 2)
    }
    
    return total.join('');
}

//version 5
function repeat(target, n) { //省去version 4 中创建数组和使用 join
    var s = target, c = s.length * n;// 最终字符串的长度
    
    do {
        s += s;
    } while(n = n >> 1);
    
    return s.substring(0, c);
}

//version 6 在各浏览器得分最高
function repeat(target, n) {
    var s = target, total = ''; //version 4 中是数组，这里直接用字符串
    
    while(n > 0) {
        if(n % 2 === 1)
            total += s;
        
        if(n === 1)
            break;
        
        s += s;
        n = n >> 1; //Math.floor(n / 2)
    }
    
    return total;
}

//version 7 使用递归
function repeat(target, n) {
    if(n === 1) {
        return target;
    }
    
    var s = repeat(target, Math.floor(n / 2));
    s += s;
    
    if(n % 2) {
        s += target;
    }
    
    return s;
}

//version 8 反例
function repeat(target, n) {
    return n <= 0 ? '' : target.concat(repeat(target, --n));
}
```



### byteLen

取得一个字符串所有字节的长度。

```javascript
//version 1 Unicode <= 255 占一个字节，> 255 占两个字节
function byteLen(target) {
    var byteLength = target.length, i = 0;
    for(; i < target.length; i++) {
        if(target.charCodeAt(i) > 255) {
            byteLength++;
        }
    }
    return byteLength;
}

//version 2 使用正则，并支持自定义字节数
function byteLen(target, fix) {
    fix = fix ? fix : 2;
    var str = new Array(fix + 1).join('-'); // '-' 可以换成其她占位符
    return target.replace(/[^\x00-\xff]/g, str).length;
}

//version 3 腾讯的解决方案
function byteLen(str, charset) {
    var total = 0;
    var charCode;
    var i;
    var len;
    charset = charset ? charset.toLowerCase() : '';
    //UTF-16 大部分使用2个字节， 超过65535使用4字节
    //000000 - 00FFFF -> 2
    //010000 - 10FFFF -> 4
    if(charset === 'utf-16' || charset === 'utf16') {
        for(i = 0, len = str.length; i < len; i++) {
            charCode = str.charCodeAt(i);
            if(charCode <= 0xffff) {
                total += 2;
            }else {
                total += 4;
            }
        }
    //UTF-8 有4种情况
    //000000 - 00007F -> 1
    //000080 - 0007FF -> 2
    //000800 - 00D7FF 00E000 - 00FFFF -> 3
    //010000 - 10FFFF -> 4    
    }else {
        for(i = 0, len = str.length; i < len; i++) {
            charCode = str.charCodeAt(i);
            if(charCode <= 0x007f) {
                total += 1;
            }else if(charCode <= 0x07ff) {
                total += 2;
            }else if(charCode <= 0xffff) {
                total += 3;
            }else {
                total += 4;
            }
        }
    }
    
    return total;
}
```



### truncate

对字符串进行截断处理，超过限定长度，默认添加3个点号

```javascript
function (target, length, truncation) {
    length = length || 30;
    truncation = truncation === void 0 ? '...' : truncation;
    return target.length > length ?
        target.slice(0, length - truncation.length) + truncation : String(target);
}
```



### camelize

转换为驼峰风格

```javascript
function camelize(target) {
    if(target.indexOf('-') < 0 && target.indexOf('_') < 0) {
        return target;
    }
    
    return target.replace(/[-_][^-_]/g, function(match) {
        return match.charAt(1).toUpperCase();
    });
}
```



### underscored

转换为下划线风格

```javascript
function underscored(target) {
    return target.replace(/[a-z/d][A-Z]/g, '$1_$2')
    			.replace(/\-/g, '_');
}
```



### dasherize

转换为连字符风格

```javascript
function dasherize(target) {
    return underscored(target).replace(/_/g, '-');
}
```



### capitalize

```javascript
function capitalize(target) {
    return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
}
```



### stripTags

移除字符串中的 `html` 标签

```javascript
var rtag = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi;
function stripTags(target) {
    return String(target || '').replace(rtag, '')''
}
```



### stripScripts

移除字符串中的 `scirpt` 标签

```javascript
function stripScripts(target) {
    return String(target || '').replace(/<script[^>]*>([\S\s]*?)<\/script>/img, '');
}
```



### escapeHTML 和 unescapeHTML

`html` 转义/还原，防止 `XSS`

```javascript
function escapeHTML(target) {
    return target.replace(/&/g, '&amp;')
    			.replace(/</g, '&lt;')
    			.replace(/>/g, '&gt;')
    			.replace(/"/g, '&quot;')
    			.replace(/'/g, '&#39;');
}

function unescapeHTML(target) {
    return String(target)
        .replace(/&#39;/g, '\'')
        .replace(/&quot;/g, '"')
    	.replace(/&lt;/g, '<')
    	.replace(/&gt;/g, '>')
    	.replace(/&amp;/g, '&');
}

//Prototype.js 建议使用原生API innerHTML, innerText
```



### escapeRegExp

将字符串安全格式化为正则表达式

```javascript
function escapeRegExp(target) {
    return target.replace(/([-.*+?^${}()|[\]\/\\])/g, '//$1');
}
```



### pad

为字符串某一端添加字符串，一般为补 `0`

```javascript
//target 多为 Number 所以可以看到下面多数用了 toString 
//version 1
function pad(target, n) {
    var zero = new Array(n).join('0'); //这里实际上应该是 n + 1，否则 pad('', n) 结果是不对的
    var str = zero + target;
    var result = str.substr(-n);
    return result;
}

//version 2
function pad(target, n) {
    return new Array((n + 1) - target.toString().split('').length).join('0') + target;
}

//version 3 二进制法
function pad(target, n) {
    //Math.pow(10, n) === (1 << n).toString(2)
    return (Math.pow(10, n) + '' + target).slice(-n); //如果 target为 '' ,这个方法一样有bug
}

// ...省略几个差不多的 而且都有 bug 的方法

//version 7 质朴长存法
function pad(target, n) {
    var len = target.toString().length;
    while(len < n) {
        target = '0' + target;
        len++;
    }
    
    return target;
}

//version 8 
function pad(target, n, filling, right, radix) {
    var num = target.toString(radix || 10);
    filling = filling || '0';
    while(num.length < n) {
        if(!right) {
            num = filling + num;
        }else {
            num = num + filling;
        }
    }
    
    return num;
}
```



### format

类似 `C` 的 `printf`

```javascript
function format(str, object) {
    var array = Array.prototype.slice.call(arguments, 1);
    return str.replace(/\\?\#{([^{}]+)\}/gm, function(match, name) {
        if(match.charAt(0) === '\\') { // '\\'.length === 1
            return match.slice(1); // 表示不需要format
        }
        var index = Number(name);
        if(index >= 0) {
            return array[index];
        }
        if(array && array[name] !== void 0) {
            return object[name];
        }
        
        return '';
    });
}

var a = format('Result is #{0}, #{1}', 22, 33);
//"Result is 22, 33"
var b = format('#{name} is a #{sex}', {
    name: 'John',
    sex: 'man'
});
//"John is a man"
```



### quote

在字符串两端加双引号

```javascript
//暂不实现
```



### tirm

去除两端空白

```javascript
//version 1
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

//version 2
function trim(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}

//version 3
function trim(str) {
    return str.substring(Math.max(str.search(/\S/) || 0), str.search(/\S\s*$/) + 1);
}

//version 4
function trim(str) {
    return str.replace(/^\s+|\s+$/g, ''); //看起来优雅 但失去了浏览器优化的机会
}

//version 5
function trim(str) {
    str = str.match(/\S+(?:\s*\S)*/); //["test", index: 0, input: "test"]
    return str ? str[0] : '';
}

//version 6 效率差
function trim(str) {
    return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1');
}

//version 7 使用非捕获组对 version 6 进行优化
function trim(str) {
    return str.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, '$1');
}

//version 8
function trim(str) {
    return str.replace(/^\s*((?:[\S\s]*\S)?)\s*$/, '$1');
}

//version 9
function trim(str) {
    return str.replace(/^\s*([\S\s]*?)\s*$/, '$1');
}

//version 10 最优 把可能的空白符全部列出来，第一次遍历去掉前面的空白，第二次去掉后面的空白，没有使用正则
function trim(str) {
    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\n\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    //第一次遍历去掉前面的空白
    for(var i = 0; i < str.length; i++) {
        if(whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }
    
    //第二次去掉后面的空白
    for(var i = str.length - 1; i >= 0; i--) {
        if(whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}

//version 11 10的压缩版，使用了正则
function trim(str) {
    str = str.replace(/^\s+/, '');
    for(var i = str.length; i >= 0; i--) {
        if(/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    
    return str;
}

//version 12 作者觉得的易记版 前后寻找第一个非空白字符的索引
function trim(str) {
    var m = str.length;
    for(var i = -1; str.charCodeAt(++i) <= 32) //32 之前都不是「正常」字符
        for(var j = m - 1; str.charCodeAt(j) <= 32; j--)
            return str.slice(i, j + 1);
}
```



### 数组的扩展与修复

- `substring`、`slice`、`substr`常用于转换类数组对象为真正的数组

- `remove` 是基于 `splice` 实现的

- `reduce` 和 `reduceRight` 的实现

  ```javascript
  Array.prototype.reduce = function(fn, lastResult, scope) {
      if(this.length === 0) {
          return lastResult;
      }
      //有 lastResult 就从第 0 个开始遍历，否则将第 0 个当作 lastResult 从第 1 个开始遍历
      var i = lastResult !== undefined ? 0 : 1;
      var result = lastResult !== undefined ? lastResult : this[0];
      for(var n = this.length; i < n; i++)
          result = fn.call(scope, result, this[i], i, this); // this 代表整个数组
      return result;
  }

  Array.prototype.reduceRight = function(fn, lastResult, scope) {
      var array = this.concat().reverse();
      return array.reduce(fn, lastResult, scope);
  }
  ```



avalon 为数组添加了如下扩展：

### contains

同 `字符串 `使用 `indexOf` 判断

### removeAt / remove

移除指定位置元素，返回布尔值

```javascript
function removeAt(target, index) {
    return !!target.splice(index, 1).length;
}

function remove(target, item) {
    var index = target.indexOf(item);
    if(~index) { // 不懂
        return removeAt(target, index);
    }
    return false;
}
```

### shuffle

洗牌

```javascript
function shuffle(target) {
    var i = target.length;
    var j;
    for(; i > 0; j = parseInt(Math.random() * i)) {
        x = target[--i];
        target[i] = target[j];
        target[j] = x;
    }
    return target;
}
```



### flatten

扁平化

```javascript
function flatten(target) {
    var result = [];
    target.forEach(function(item) {
        if(Array.isArray(item)) {
            result = result.concat(flatten(item));
        }else {
            result.push(item);
        }
    });
    return result;
}
```



### unique

去重的最原始实现

```javascript
function unique(target) {
    var result;
    loop: for(var i = 0, n = target.length; i < n; i++) {
        for(var x = i + 1; x < n; x++) {
            if(target[x] === target[i]) {
                continue loop;
            }
            result.push(target[i]);
        }
    }
    return result;
}
```



### groupBy

根据指定条件进行分组

看实现推测这个方法是用于元素为对象的数组

```javascript
function groupBy(target, val) {
    var result = [];
    var iterator = $.isFunction(val) ? val : function(obj) {
        return obj[val];
    }
    target.forEach(function(value, index) {
        var key = iterator(value, index);
        (result[key] || result[key] = []).push(value);
    });
    return result;
}
```



### unshift

IE6, 7 `unshift` 不返回数组长度，可以用 `函数劫持` 进行修复

```javascript
if([].unshift(1) !== 1) {
    var _unshift = Array.prototype.unshift;
    Array.prototype.unshift = function() {
        _unshift.call(this, arguments);
        return this.length;
    }
}
```



使用 `splice` 实现 `unshift`

```javascript
//splice 接受 3 个参数，起始索引，终止索引，插入值
var _slice = Array.prototype.slice;
Array.prototype.unshift = function() {
    this.splice.apply(this, [0, 0].concat(_slice.call(arguments)));
    return this.length;
}
```



### 数组的空位

>```javascript
>0 in [undefined, undefined, undefined] //true
>0 in [, , ,] //false
>```

`ECMA262V5` 大部分会忽略空位

`ECMA262V6` 则明确将空位转为 `undefined`

空位的处理规则非常不统一，应该避免出现空位



# 数值的扩展与修复



### toInteger

```javascript
var toInteger = function(n) {
    n = +n; //undefined 和 NaN 都会转为 NaN
    if(n !== n) { // isNaN
        n = 0;
    }else if(n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}
```



### limit

确保数值在 [n1, n2] 闭区间内

```javascript
function limit(target, n1, n2) {
    var a = [n1, n2].sort(); //升序
    if(target < a[0])
        target = a[0];
    if(target > a[1])
        target = a[1];
    return target;
}
```



### nearer

求出距离指定数值最近的数

```javascript
function nearer(target, n1, n2) {
    var diff1 = Math.abs(target - n1),
        diff2 = Math.abs(target - n2);
    return diff1 < diff2 ? n1 : n2;
}
```



### 修复 toFixed

一些浏览器没有四舍五入

```javascript
if(0.9.toFixed(0) !== '1') {
    Number.prototype.toFixed = function(n) {
        var power = Math.pow(10, n);
        var fixed = (Math.round(this * power) / power).toString();
        if(n == 0)
            return fixed;
        if(fixed.indexOf('.') < 0)
            fixed += '.';
        var padding = n + 1 - (fixed.length - fixed.indexOf('.'));
        for(var i = 0; i < padding; i++)
            fixed += '0';
        return fixed;
    }
}
```



在 `JavaScript` 中数值有3种保存方式

- 字符串形式
- `IEEE 754` 标准双精度浮点数（64位）
- 32位整数

大数相加出问题是由于 `精度不足`

小数相加出问题是由于 `禁止转算是产品误差`



# 函数的扩展与修复

