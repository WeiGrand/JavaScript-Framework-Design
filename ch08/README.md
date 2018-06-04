# 样式模块

`样式模块` 分为两大块

- 精确获取样式
- 设置样式

在标准浏览器下是使用 `getComputedStyle`，`IE6~IE8` 下使用 `currentStyle`

```javascript
var getStyle = function(el, name) {
    if(el.style) {
        name = name.replace(/\-(\w)/g, function(all, letter) {
            return letter.toUpperCase();
        });
        
        if(window.getComputedStyle) {
            return el.ownerDocument.getComputedStyle(el, null)[name];
        }else {
            return el.currentStyle[name];
        }
    }
}
```

**本章围绕 `avalon` 的 `css` 模块展开**



## 主体架构

```javascript
avalon.fn.css = function(name, value) {
    if(avalon.isPlainObject(name)) {
        for(var i in name) {
            avalon.css(this, i, name[i]);
        }
    }else {
        var ret = avalon.css(this, name, value);
    }
    
    return ret !== void 0 ? ret : this;
}
```

```javascript
avalon.css = function(node, name, value) {
    if(node instanceof avalon) {
        node = node[0];
    }
    
    var prop = avalon.camelize(name),
        fn;
    
    name = avalon.cssName(prop) || prop;
    
    // 获取样式
    if(value === void 0 || typeof value === 'boolean') { // value 为布尔表示去掉单位
        fn = cssHook[prop + ':get'] || cssHook['@:get'];
        
        if(name === 'background') {
            name = 'backgroundColor';
        }
        
        var val = fn(node, name);
        
        return value === true ? parseFloat(val) || 0 : val;
    }else if(value === '') { // 清楚样式
        node.style[name] = '';
    }else { // 设置样式
        if(value == null || value !== value) { // NaN
            return;
        }
        
        if(isFinite(value) && !avalon.cssNumber[prop]) {
            value += 'px';
        }
        
        fn = cssHook[prop + ':set'] || cssHook['@:set'];
        
       	fn(node, name, value);
    }
}

cssHook['@:set'] = function(node, name, value) {
    try {
        // node.style.width = NaN; node.style.width = 'xxx'; node.style.width = undefine 低版本 `IE` 报错
        node.style[name] = value;
    }cache(e) {}
}

if(window.getComputedStyle) {
    cssHook['@:get'] = function(node, name) {
        if(!node || !node.style) {
            throw new Error('getComputedStyle 要求传入一个节点 ' + node);
        }
        
        var ret,
            styles = getComputedStyle(node, null);
        
        if(styles) {
            ret = name === 'filter' ? styles.getPropertyValue(name) : styles[name];
            
            if(ret === '') {
                ret = node.style[name]; // 其他浏览器需要手动取内联样式
            }
        }
        
        return ret;
    }
}else {
    // 兼容 IE 的逻辑
}
```



## 样式名修正

- `float` 对应 `JavaScript` 属性存在兼容性问题

  > `float` 是一个关键字，不能直接用，`IE` 对应的是 `styleFloat`，`W3C` 对应的是 `cssFloat`

- `CSS3` 私有前缀

- `IE` 私有前缀不合流

`avalon.cssName` 的实现

```javascript
var camlize = avalon.camelize,
    root = document.documentElement,
    prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-'],
    cssMap = { // 缓存检查过的属性
        'float': window.Range ? 'cssFloat' : 'styleFloat'
    };

avalon.cssName = function(name, bost, camelCase) {
    if(cssMap[name]) {
        return cssMap[name];
    }
    
    host = host || root.style || {};
    
    for(var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = camelize(prefixes[i] + name);
        
        if(camelCase in host) {
            return (cssMap[name] = camelCase);
        }
    }
    
    return null;
}
```

