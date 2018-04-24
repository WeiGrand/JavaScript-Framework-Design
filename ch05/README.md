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
//两个API的区别 https://stackoverflow.com/questions/24226571/what-is-the-difference-between-node-nextsibling-and-childnode-nextelementsibling
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

4. 兄长选择器

```javascript
function getPrev(el) {
    if('previousElementSibling' in el) {
        return el.previousElementSibling;
    }
    
    while(el = el.previousSibling) {
        if(el.nodeType === 1) {
            return el
        }
    }
    
    return null;
}
```

> |        | 遍历所有子节点  |     遍历所有子元素     |
> | ------ | :-------------: | :--------------------: |
> | 最前的 |   firstChild    |   firstElementChild    |
> | 最后的 |    lastChild    |    lastElementChild    |
> | 前面的 | previousSibling | previousElementSibling |
> | 后面的 |   nextSibling   |   nextElementSibling   |
> | 上面的 |   parentNode    |     parentElement      |
> | 长度   |     length      |   childElementCount    |

## 选择器引擎涉及的通用函数

### isXML

`XML` 与 `HTML` 相比没有 `className` 和 `getElementById`，并且 `nodeName` 区分大小写

`Sizzle` 的实现

```javascript
var isXML = Sizzle.isXML = function(elem) {
    var documentElement = elem && (elem.ownerDocument || elem).documentElement; //获取 html(根节点) 节点
    return documentElement ? documentElement.nodeName !== 'HTML' : false; //XML 的根节点就是 HTML
}
```

`mootools` 的实现

> nodeType === 1 => 元素节点
>
> nodeType === 9 => document节点

```javascript
var isXML = function(document) {
    return (!!document.xmlVersion) ||
        (!!document.xml) || 
        (toString.call(document) == '[object XMLDocument]') ||
        (document.nodeType == 9 && document.documentElement.nodeName != 'HTML');
}
```

利用 `HTMLDocument` 和 `XML` 的 `selectNodes` 判断

```javascript
var isXML = window.HTMLDocument ? function(doc) {
    return !(doc instanceof HTMLDocument); //document instanceof HTMLDocument => true
} : function(doc) {
    return 'selectNodes' in doc;
}
```

功能法，利用 `XML` 不区分大小写的特性

```javascript
var isXML = function(doc) {
    return doc.createElement('p').nodeName !== doc.createElememt('P').nodeName;
}
```



### contains

判断 `节点a` 是否包含 `节点b`

```javascript
//Sizzle 1.10.15
var rnative = /^[^{]+\{\s*\[native \w/, //判断是否原生方法的正则
    hasCompare = rnative.test(docElem.compareDocumentPosition),
    contains = hasCompare || rnative.test(docElem.contains) ?
    function(a, b) {
        var adown = a.nodeType === 9 ? a.documentElement : a,
            bup = b && b.parentNode;
        return a === bup || !!(bup && bup.nodeType === 1 && (
        	adown.contains ?
            adown.contains(bup) : 
            a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16 // 值为 16 时 就是A 包含 B
        ));
    } :
    function(a, b) {
        if(b) {
            while((b = b.parentNode)) {
                if(b === a) {
                    return true;
                }
            }
        }
    }
```

`compareDocumentPosition` 返回值参考

| interger |      说明      |
| :------: | :------------: |
|    0     |    元素一直    |
|    1     | 节点在不同文档 |
|    2     |  B 在 A 之前   |
|    4     |  A 在 B 之前   |
|    8     |    B 包含 A    |
|    16    |    A 包含 B    |
|    32    | 浏览器私有使用 |

> 若两个元素位置满足多种情况，其返回值为多种情况返回值之和



旧版IE不支持 `compareDocumentPosition` 所以有以下兼容

> `sourceIndex` 为IE的私有实现，跟进元素位置从上倒下，从左到右依次加 1
>
> HTML => 0
>
> HEAD => 1 HEAD *(HEAD的子元素) => 3
>
> BODY => 2

```javascript
function compareDocumentPosition(a, b) {
    return a.compareDocumentPosition ? a.compareDocumentPosition(b) :
    a.contains ? (a != b && a.contains(b) && 16) + //若 contains 返回 true 则返回 16
        (a != b && b.contains(a) && 8) +
        (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? //< 0 代表不在 DOM 树
          (a.sourceIndex < b.sourceIndex && 4) +
          (a.sourceIndex > b.sourceIndex && 2) : 1) : 0;
        )
}
```



### 节点排序与去重

排序

```javascript
//让元素节点按它们在 DOM 树出现的顺序排序
var sortNodes = function(a, b) {
    var p = 'parentNode',
        ap = a[p],
        bp = b[p];
    
    if(a === b) {
        return 0
    }else if(ap === bp) {
        while(a.nextSibling) {
            if(a === b) { //证明 a 在 b 前面 所以不用换位 return -1
                return -1
            }
        }
        return 1
    }else if(!ap) { //ap 不存在证明 bp 存在 所以 a 比 b 更高一级 不用换位
        return -1
    }else if(!bp) { //bp 不存在证明 ap 存在 所以 b 比 a 更高一级 要换位
        return 1
    }
    
    //a !== b 且 ap !== bp 的情况下
    //先各自找到各自的根节点 (HTML)
    var al = [],
        ap = a;
    while(ap && ap.nodeType === 1) {
        al[al.length] = ap
        ap = ap[p]
    }
    
    var bl = [],
        bp = b;
    while(bp && bp.nodeType === 1) {
        bl[bl.length] = bp
        bp = bp[p]
    }
    
    //然后去掉公共的祖先元素
    ap = al.pop();
    bp = bl.pop();
    
    while(ap === bp) {
        ap = al.pop();
    	bp = bl.pop();
    }
    
    if(ap && bp) {
        while(a.nextSibling) {
            if(a === b) { //证明 a 在 b 前面 所以不用换位 return -1
                return -1
            }
        }
        return 1
    }
    
    return ap ? 1 : -1
}

//usage: [el1, el2, ..., eln].sort(sortNodes);
```

`Mootools` 的 `Slick` 引擎对节点排序的实现

```javascript
features.documentSorter = (root.compareDocumentPosition) ? function(a, b) {
    if(!a.compareDocumentPostion || !b.compareDocumentPosition) 
        return 0;
    // 4 代表 a 在 b 前面 其余情况 按位与 4 结果都为 0 ，只需判断 a 是否和 b 相等
    return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
} : ('sourceIndex' in root) ? function(a, b) {
    if(!a.sourceIndex || !b.sourceIndex) 
        return 0
    return a.sourceIndex - b.sourceIndex;
} : (document.createRange) ? function(a, b) {
    if(!a.ownerDocument || !b.ownerDocument) 
        return 0;
    var aRange = a.ownerDocument.createRange(),
        bRange = b.ownerDocument.createRange();
    
    aRange.setStart(a, 0);
    aRange.setEnd(a, 0);
    bRange.setStart(b, 0);
    bRange.setEnd(b, 0);
    return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
} : null;
```

排序加去重

`mass Framework` 的 `Icarus` 引擎的实现

```javascript
function unique(nodes) {
    if(nodes.length < 2) {
        return nodes;
    }
    
    var result = [],
        array = [],
        uniqResult = {},
        node = nodes[0],
        index,
        ri = 0,
        sourceIndex = typeof node.sourceIndex === 'number',
        compare = typeof node.compareDocumentPosition == 'function';
    
    //用于旧版 IE 的 XML
    //另外通过这个 polyfill 可以加深对 sourceIndex 的理解
    if(!sourceIndex && !compare) {
        var all = (node.ownerDocument || node).getElementByTagName('*');
        for(var index = 0; node = all[index]; index++) {
            node.setAttribute('sourceIndex', index);
        }
        sourceIndex = true;
    }
    if(sourceIndex) { //IE opera
        for(var i = 0, n = nodes.length; i < n; i++) {
            node = nodes[i];
            index = (node.sourceIndex || node.getAttribute('sourceIndex')) + 1e8;
            if(!uniqResult[index]) { //去重
                (array[ri++] = new String(index))._ = node;
                uniqResult[index] = 1;
            }
        }
        array.sort(); //sort 的默认排序顺序是根据字符串Unicode码点
        
        while(ri)
            result[--ri] = array[ri]._;
        
        return result;
    }else {
        nodes.sort(sortOrder);
        if(sortOrder.hasDuplicate) {
            for(i = 1; i < nodes.length; i++) {
                if(nodes[i] === nodes[i - 1]) {
                    nodes.split(i--, 1);
                }
            }
        }
        sortOrder.hasDuplicate = false;
        return nodes;
    }
}

function sortOrder(a, b) {
    if(a === b) {
        sortOrder.hasDuplicate = true; //决定是否需要去重
        return 0;
    }
    
    if(!a.compareDocumentPosition || !b.compareDocumentPosition) {
        return a.compareDocumentPosition ? -1 : 1;
    }
    
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
}
```



## 迷你选择器

```javascript
function $(query) {
    var res = [];
    
    if(document.querySelectorAll) {
        res = document.querySelectorAll(query);
    }else {
        var firstStyleSheet = document.styleSheets[0] || document.createStyleSheet();
        query = query.split(',');
        for(var i = 0, len = query.length; i < len; i++) {
            firstStyleSheet.addRule(query[i], 'Hack:ie'); //eg: div {Hack: ie}
        }
        
        for(var i = 0, len = document.all.length; i < len; i++) {
            var item = document.all[i];
            item.currentStyle.Hack && res.push(item);
        }
        
        firstStyleSheet.removeRule(0); //应该是 remove 掉最后那个才对
    }
    
    var ret = [];
    for(var i = 0, len = res.length; i < len; i++) {
        ret.push(res[i]);
    }
    
    return ret;
}
```

