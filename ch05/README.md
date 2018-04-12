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
    }
}
```

