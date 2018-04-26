# 节点模块

## 节点的创建

### createElement

```javascript
//生成带 name 属性的元素，解决在 IE67中 input 和 iframe 的 name 属性只读的问题
function createNameElement(type, name) {
    var element = null;
    
    try {
        //在 IE 中能正常执行，而在现代浏览器中会报错
        element = document.createElement('<' + type + ' name="' + name + '">');
    }catch(e) {}
    
    //现代浏览器的方法
    if(!element || element.nodeName != type.toUpperCase()) {
        element = document.createElement(type);
        element.name = name;
    }
    
    return element;
}
```

### innerHTML

`innerHTML` 的创建效率比 `createElement` 高

`IE` 下有些元素节点的 `innerHTML` 是只读的，如: `HTML`、`HEAD`、`STYLE` 等

`innerHTML` 不会执行 `script` 标签里面的脚本

```javascript
//avalon 的解决方法
//将scirpt节点取出来用 document.createElement('script') 生成的节点代替
var scriptNode = document.createElement('script');
var scriptTypes = avalon.oneObject(['', 'text/javascript', 'text/ecmascript', 'application/ecmascript', 'application/javascript']) //将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象

function fixScript(wrapper) {
    var els = wrapper.getElementsByTagName('script');
    if(els.length) {
        for(var i = 0, el; el = els[i++]) {
            if(scriptTypes[el.type]) {
                var neo = scriptNode.cloneNode(false); //「浅拷贝」子元素不被拷贝
                Array.prototype.forEach.call(el.attributes, function(attr) { //el.attributes 类数组
                    if(attr && attr.specified) { //specified just means the attribute is present in the original HTML or has been set by script using setAttribute()
                        neo[attr.name] = attr.value;
                        neo.setArrribute(attr.name, attr.value);
                    }
                })
                
                neo.text = el.text;
                el.parentNode.replaceChild(neo, el);
            }
        }
    }
}
```

浏览器会自动补全闭合标签 

(包括`body`、`colgroup`、`dd`、`dt`、`head`、`html`、`li`、`optgroup`、`option`、`p`、`tbody`、`td`、`tfoot`、`th`、`thead`、`tr`)

```javascript
var div = document.createElement('div');
div.innerHTML = '<table><tbody><tr></tr>';
console.log(div.getElementsByTagName('tr').length); //1
```

### insertAdjacentHTML

可以将元素插刀另一个元素内部的最前面(`afterBegin`)、最后面(`beforeEnd`)和另一个元素的前面(`beforeBegin`)、后面(`afterEnd`)

```javascript
var one = document.getElementById('one'); 
one.insertAdjacentHTML('afterend', '<div id="two">two</div>');
```

如果浏览器不支持 `insertAdjacentHTML` ，可以用 `createContextualFragment` 来模拟

```javascript
if(typeof HTMLElemnt !== 'undefined' && !HTMLElemnt.prototype.insertAdjacentElement) {
    HTMLElemnt.prototype.insertAdjacentElement = function(where, parsedNode) {
        switch(where.toLowerCase()) {
            case 'beforbegin':
                this.parentNode.insertBefore(parsedNode, this);
                break;
            case 'afterbegin':
                this.insertBefore(parsedNode, this.firstChild);
                break;
            case 'beforeend':
                this.appendChild(paresdNode);
                break;
            case 'afterend':
                if(this.nextSibling)
                    this.parentNode.insertBefore(parsedNode, this.nextSibling);
                else
                    this.parentNode.appendChild(parsedNode);
                break;
        }
    }
    
    HTMLElemnt.prototype.insertAdjacentHTML = function(where, htmlStr) {
        var r = this.ownerDocument.createRange();
        r.setStartBefore(this); //不知道有什么用...
        var parsedHTML = r.createContextualFragment(htmlStr); // html 字符串 生成 文档片段 DocumentFragment
        this.insertAdjacentElement(where, parsedHTML);
    }
    
    HTMLElemnt.prototype.insertAdjacentText = function(where, txtStr) {
        var parsedText = document.createTextNode(txtStr);
        this.insertAdjacentElement(where, parsedText);
    }
}
```

### template

`字符串` 转 `文档碎片`

```javascript
var a = document.createElement('template')
a.innerHTML = '<div></div><div></div>';
a.content
//#document-fragment 
//<div></div>
//<div></div>
//普通标签没有 content
var b = document.createElement('div')
b.innerHTML = '<div></div><div></div>';
b.content
//undefined
```

### avalon 的 parseHTML 实现

```javascript
//带长度限制的缓存体
function Cache(size) {
    var keys = [];
    var cache = {};
    
    this.get = function(key) {
        return cache[key + ' '];
    }
    
    this.put = function(key, value) {
        if(keys.push(key + ' ') > size) { //原来 push 会返回数组长度，一直没留意...
            delete cache[keys.shift()]; 
        }
        
        return (cache[key + ' '] = value);
    }
    
    return this;
}

var fixScript = require('./fixScript'); //上文提到的解决 script 标签执行问题的方法

var rtagName = /<([\w+:]+)/;
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig; //(?!exp) 匹配后面跟的不是exp的位置 
var rhtml = /<|&#?\w;/;
var htmlCache = new Cache(128);
var templateHook = document.createElement('template');

//tagHooks 和 svgHooks 用于嵌套的母元素 有点多 懒得打

avalon.parseHTML = function(html) {
    var fragment = document.createDocumentFragment(), firstChild;
    
    if(typeof html !== 'string') {
        return fragment;
    }
    
    if(!rhtml.test(html)) {
        fragment.appendChild(document.createTextNode(html));
        return fragment;
    }
    
    html = html.replace(rxhtml, '<$1></$2>').trim();
    var hasCache = htmlCache.get(html);
    if(hasCache) {
        return hasCache.cloneNode(true);
    }
    
    var tag = (rtagName.exec(html) || ['', ''])[1].toLowerCase();
    var wrapper = svgHooks[tag];
    if(wrapper) { // svgHooks
        wrapper.innerHTML = html;
    }else if(templateHook) {
        templateHook.innerHTML = html;
        wrapper = templateHook.content;
    }else {
        wrapper = tagHooks[tag] || tagHooks._default; //div
        wrapper.innerHTML = html;
    }
    
    fixScript(wrapper);
    
    if(templateHook) {
        fragment = wrapper;
    }else {
        while(firstChild = wrapper.firstChild) {
            fagment.appendChild(firstChild);
        }
    }
    
    if(html.length < 1024) {
        htmlCache.put(html, fragment.cloneNode(true));
    }
    
    return fragment;
}
```



## 节点的插入

一般用 `insertBefore`、`appendChild`、`replaceChild`

一般工具库还会有 `insertAfter`

```javascript
function insertAfter(newElement, targetElement) {
    var parent = targetElement.parentNode;
    if(parent.lastChild == targetElement) {
        parent.appendChild(newElement);
    }else {
        parent.insertBefore(newElement, targetElement.nextSiblings);
    }
}
```

非一般的还有 `insertAdjacentHTML`、`insertAdjacentText`、`insertAdjacentElement`

参数都相同，第一个是插入位置，第二个是插入的内容

### `IE` 的 `applyElement` 实现

`applyElement` 用法

- `neo.applyElement(old, 'outside')` 为当前元素提供一个父节点，此父节点将动态插入原节点的父亲底下
- `neo.applyElement(old, 'inside')` 为当前元素插入一个新节点，然后将它之前的孩子挪到新节点底下

```javascript
if(!document.documentElement.applyElement && typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.removeNode = function(deep) {
        var parent = this.parentNode;
        var childNodes = this.childNodes;
        var fragment = this.ownerDocument.createElementFragment();
        while(childNodes.length) {
            fragment.appendChild(childNodes[0]);
        }
        
        if(!!deep) { //如果 deep 为 true 整个删除
            parent.removeChild(this);
        }else { // 只删除目标节点，而保留子节点
            parent.replaceChild(this, fragment);
        }
    }
    
    HTMLElement.prototype.applyElement = function(newNode, where) {
        newNode = newNode.removeNode(false);
        var range = this.ownerDocument.createRange();
        var where = ((where || 'outside').toLowerCase());
        var method = where === 'inside' ? 'selectNodeContents' : where === 'outside' ? 'selectNode' : 'error';
        if(method === 'error') {
            throw new Error('DOMException.NOT_SUPPORTED_ERR(9)');
        }else {
            range[method](this);
            range.surroundContents(newNode);
            range.detach();
        }
        
        return newNode;
    }
}
```



## 节点的复制

### jQuery 的实现

步骤大致为：

1. 复制节点的基本属性
2. 复制节点的数据和事件
3. 将 script 标记为已执行

```javascript
//dataAndEvents 是否复制数据和事件
//deepDataAndEvents 是否它的子孙的数据和事件
jQuery.fn.clone = function(dataAndEvents, deepDataAndEvents) {
	dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
    deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
    return this.map(function() {
        return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
    })
}
```

```javascript
support = {
    html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>"; // <:nav></:nav> IE创建无法识别的element会变成这样
}
var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video"
var rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i");

//获取节点下所有子孙节点
function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== core_strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== core_strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

jQuery.clone = function(elem, dataAndEvents, deepDataAndEvents) {
    var clone, 
        destElements, 
        srcElements, 
        i, 
        node,
        inPage = jQuery.contains(elem.ownerDocument, elem);

    if(support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test("<" + elem.nodeName + ">")) { //如果支持 cloneNode 就用 cloneNode
        clone = elem.cloneNode(true);
    }else {
        fragmentDiv.innerHTML = elem.outerHTML;
        fragmentDiv.removeChild(clone = fragmentDiv.firstChild);
    }
    
    if((!support.noCloneEvent || !support.noCloneCheck) && (elem.nodeType === 1 || elem.nodeType === 11)) {
        //IE6~8 使用 attachEvent 添加的事件也会被复制
        //input[type=radio] 的 checked 属性可能无法复制
        destElements = getAll(clone);
        srcElements = getAll(elem);
        
        for(i = 0; (node = srcElement[i] != null; ++i)) {
            if(destElement[i]) {
                fixCloneNodeIssues(node, destElements[i]);
            }
        }
    }
    
    if(dataAndEvents) {
        if(deepDataAndEvents) {
            srcElements = srcElements || getAll(elem);
            destElements = destElements || getAll(elem);
            
            for(i = 0; (node = srcElement[i] != null; ++i)) {
                if(destElement[i]) {
                    cloneCopyEvent(node, destElements[i]);
                }
            }
        }else {
            cloneCopyEvent(elem, clone);
        }
    }
    
    //复制的 script 和 innerHTML 插入的 script 一样，不会执行脚本或发出请求
    destElements = getAll(clone, "script");
    if(destElements.length > 0) {
        setGlobalEval(destElements, !inPage & getAll(elem, "script"));
    }
    
    destElements = srcElements = node = null; //防止内存泄露
    
    return clone;
}
```



