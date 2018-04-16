# 选择器引擎

## getElementsBySelector

先来看看这个最古老的 `选择器引擎`

```javascript
function getAllChildren(e) {
    return e.all ? e.all : e.getElementsByTagName('*');
}

document.getElementsBySelector = function(selector) {
    //不支持 getElementsByTagName 则直接返回空数组
    if(!document.getElementsByTagName) {
        return new Array();
    }
    
    //切割 CSS 选择符
    var tokens = selector.split(' ');
    var currentContext = new Array(document); // 大概是代表当前根节点
    
    for(var i = 0; i < tokens.length; i++) {
        //去掉两边的空白 应该是防止 '#a     .b   .c' 这种情况...
        token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
        
        //简单粗暴地判断是否包含ID选择器...
        if(token.indexOf('#') > -1) {
            var bits = token.split('#');
            var tagName = bits[0];
            var id = bits[1];
            
            var element = document.getElementById(id);
            if(tagName && element.nodeName.toLowerCase() != tagName) {
                return new Array();
            }
            
            currentContext = new Array(element); //更新当前根节点
            
            continue;
        }
        
        //同样的方法判断是否包含类选择器
        if(token.indexOf('.') > -1) {
            var bits = token.split('#');
            var tagName = bits[0];
            var className = bits[1];
            
            if(!tagName) {
                tagName = '*';
            }
            
            var found = new Array;
            var foundCount = 0;
            
            //先找出所有子孙元素
            for(var h = 0; h < currentContext.length; h++) {
                var elements;
                
                if(tagName == '*') {
                    elements = getAllChildren(currentContext[h]);
                }else {
                    elements = currentContext[h].getElementsByTagName(tagName);
                }
                
                for(var j = 0; j < elements.length; j++) {
                    found[foundCount++] = elements[j];
                }
            }
            
            currentContext = new Array;
            var currentContextIndex = 0;
            
            for(var k = 0; k < found.length; k++) { //其实可以直接用 foundCount 吧...
                if(found[k].className && found[k].className.match(new RegExp('\\b' + className + '\\b'))) {
                    currentContext[currentContextIndex++] = found[k];
                }
            }
            
            continue;
        }
        
        // tag[attr(~|^$*)=val] 或 [attr(~|^$*)=val] 情况
        if(token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"])*)"?\)$/)) { //书中少些了一个 ] ...
            var tagName = RegExp.$1; //(\w*)
            var attrName = RegExp.$2; //(\w+)
            var attrOperator = RegExp.$3; //([=~\|\^\$\*]?)
            var attrValue = RegExp.$4; //([^\]"])*)
            
            if(!tagName) {
                tagName = '*';
            }
            
            //和类选择器情况类似
            var found = new Array;
            var foundCount = 0;
            
            for(var h = 0; h < currentContext.length; h++) {
                var elements;
                
                if(tagName == '*') {
                    elements = getAllChildren(currentContext[h]);
                }else {
                    elements = currentContext[h].getElementsByTagName(tagName);
                }
                
                for(var j = 0; j < elements.length; j++) {
                    found[foundCount++] = elements[j];
                }
            }
            
            currentContext = new Array;
            var currentContextIndex = 0;
            var checkFunction; //用于筛选元素的方法
            
            switch (attrOpertator) {
                case '=': //相等
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName) == attrValue);
                    };
                    break;
                case '~': //包含 attrValue 单词
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName).match(new RegExp('\\b' + attrValue + '\\b')));
                    }
                    break;
                case '|': //以attrValue 或者 attrValue- 开头
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?')));
                    }
                    break;
               	case '^': //以 attrValue 开头
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName).indexOf(attrValue) == 0);
                    }
                    break;
                case '$': //以 attrValue 结尾
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName).lastIndexOf(attrValue) === e.getAttribute(attrName).length - attrValue.length);
                    }
                    break;
                case '*': //包含 attrValue 不一定是一个单词
                    checkFunction = function(e) {
                        return (e.getAttribute(attrName).index(attrValue) > -1);
                    }
                    break;
                default:
                    checkFunction = function(e) {
                        return e.getAttribute(attrName);
                    }
            }
            
            //不知道为什么重新赋值一次...
            currentContext = new Array;
            var currentContextIndex = 0;
            
            for(var k = 0; k < found.length; k++) {
                if(checkFunction(found[k])) {
                    currentContext[currentContextIndex++] = found[k];
                }
            }
            
            continue;
        }
        
        tagName = token;
        var found = new Array;
        var foundCount = 0;
        
        for(var h = 0; h < currentContext.length; h++) {
            var elements = currentContext[h].getElementsByTagName(tagName);
            for(var j = 0; j < elements.length; j++) {
                found[foundContext++] = elements[i];
            }
        }
        
        currentContext = found;
    }
    
    return currentContext;
}
```



## 选择器引擎涉及的知识点

`选择符` 分为 `4大类16种`:

- `并联选择器`: `逗号`
- `简单选择器`: `ID`、`标签`、`类`、`属性`、`通配符`
- `关系选择器`: `亲子(E > F)`、`后代(E F)`、`相邻(E + F)`、`兄长(E ~ F)`
- `伪类`: `动作伪类`、`目标伪类`、`语言伪类`、`状态伪类`、`结构伪类`、`取反伪类`

> `.abc` 可以用 `[class~=abc]` 来选择



### 关系选择器

1. 后代选择器
2. 亲子选择器

```javascript
function getChildren(el) {
    if(el.childElementCount) {
        return [].slice.call(el.children);
    }
    
    //为了兼容 XML
   	var ret = [];
    for(var node = el.firstChild; node; node = node.nextSibling) {
        node.nodeType == 1 && ret.push(node);
    }
    
    return ret;
}
```

3. 相邻选择器

```javascript
function getNext(el) {
    if('nextElementSibling' in el) {
        return el.nextElementSibling;
    }
    
    while(el = el.nextSibling) {
        if(el.nodeType === 1) {
            return el;
        }
    }
    
    return null;
}
```

