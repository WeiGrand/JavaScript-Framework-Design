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

讲一个字符串重复 N 次

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



