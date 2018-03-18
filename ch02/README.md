# 语言模块

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



