# 节点模块

- [节点的创建](#节点的创建)
- [节点的插入](#节点的插入)
- [节点的复制](#节点的复制)
- [节点的移除](#节点的移除)
- [`innerHTML、innerText、outerHTML、outerText`的兼容处理](#innerHTML、innerText、outerHTML、outerText 的兼容处理)

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
    html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>", // <:nav></:nav> IE创建无法识别的element会变成这样
    noCloneEvent: true //不会复制事件, 默认为 true
}

var div = document.createElement('div');

if(div.attachEvent) {
    div.attachEvent('onclick', function() {
        support.onCloneEvent = false;
    });
    
    div.cloneNode(true).click(); //如果复制了事件，noCloneEvent将变为 false
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

//解决（IE下）复制节点的一些bug
//1. attachEvent 添加的事件会被复制
//2. 无法复制 object 的子节点
//3. 无法复制 checkbox 和 radio 的 checked/defaultChecked 属性和 value
//4. 无法复制 option 的 selected/defaultSelected 属性
//5. 无法复制 input[type="text"] 和 textarea 的 defaultValue 属性
function fixCloneNodeIssues(src, dest) {
    var nodeName,
        e,
        data;
    
    //只处理元素节点
    if(dest.nodeType !== 1) {
        return;
    }
    
    nodeName = dest.nodeName.toLowerCase();
    
    if(!support.noCloneEvent && dest[jQuery.expando]) { //jQuery.expando 是类似 jQuery1113019103134822535606 (jQuery + 时间戳) 的 uuid 元素如果有这个 key 代表 被 jQuery 绑定过事件或数据
        data = jQuery._data(dest);//"{"data":{"foo":"123"},"events":{"click":[{"type":"click","origType":"click","guid":207,"namespace":""},{"type":"click","origType":"click","guid":208,"namespace":""}]}, "handle: f(a)"}"
        
        for(e in data.events) {
            jQuery.removeEvent(dest, e, data.handle);
        }
        
        dest.removeAttribute(jQuery.expando);
    }
    
    //IE 下通过 cloneNode 无法复制 script 的 text
    if(nodeName === 'script' && dest.text !== src.text) {
        disableScript(dest).text = src.text; // 阻止 script 的执行，原理是将 script 的 type 属性改为不会立即执行的 type
        restoreScript(dest); //还原 type
    }else if(nodeName === 'object') { //同样是IE的bug，无法复制 object 的子节点
        if(dest.parentNode) {
            dest.outerHTML = src.outerHTML;
        }
        
        if(support.html5Clone && (src.innerHTML && jQuery.trim(dest.innerHTML))) {
            dest.innerHTML = src.innerHTML;
        }
    }else if(nodeName === 'input' && rcheckableType.test(src.type)) { //checkbox|radio
        dest.defaultChecked = dest.checked = src.checked;
        
        if(dest.value !== src.value) {
            dest.value = src.value;
        }
    }else if(nodeName === 'option') {
        dest.defaultSelected = dest.selected = src.defaultSelected;
    }else if(nodeName === 'input' || nodeName === 'textarea') {
        dest.defaultValue = src.defaultValue;
    }
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

`jQuery` 的实现因为要兼容 IE 所以显得很复制，对于不需要兼容 IE 的项目可以直接用 `zepto` 的实现

```javascript
clone: function() {
    return this.map(function() {
        return this.cloneNode(true);
    });
}
```



## 节点的移除

一个不需要知道父节点，移除节点的方法

```javascript
var f = document.createDocumentFragment();
function clearChild(node) {
    f.appendChild(node);
    f.removeChild(node);
    return node;
}
```

```javascript
var removeNode = IE6 || IE7 ? function() {
    var d;
    return function(node) {
        if(node && node.tagName != 'BODY') {
            d = d || document.createElement('div');
            d.appendChild(node);
            d.innerHTML = '';
        }
    }() : function(node) {
        if(node && node.parentNode && node.tagName != 'BODY') {
            node.parentNode.removeChild(node);
        }
    }
}
```

IE6~8 存在 `DOM超空间`，当元素移出 `DOM树`，又有 `JavaScript` 关联时元素不会消失，被保存在 `超空间` 中，可以用 `parentNode` 来判定元素是否存在 `超空间`

jQuery提供了3种移除节点的方法：`remove`、`empty`、`detach`，其中 `detach` 只是用于临时移出 `DOM树`，不会移除数据和事件

```javascript
'remove,empty,detach'.replace(/[^, ]/g, function(method) {
    $.fn[method] = function() {
        var isRemove = method !== 'empty'; ['remove', 'detach']
        for(var i = 0, node; node = this[i++]) {
            if(node.nodeType === 1) {
                var array = $.slice(node[TAGS]('*')).concat(isRemove ? node : []);
                if(method !== 'detach') {
                    array.forEach(cleanNode);
                }
            }
            
            if(isRemove) {
                if(node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }else {
                while(node.firstChild) {
                    node.removeChildl(node.firstChild);
                }
            }
        }
        
        return this;
    }
});
```



实现一个清空元素内部的 `API`

- 传统方式

  ```javascript
  function clearNode(node) {
      while(node.firstChild) {
          node.removeChild(node.firstChild)''
      }
      
      return node;
  }
  ```

- 使用 `deleteContents`

  ```javascript
  var deleteRange = document.createRange();
  function clearChild(node) {
      deleteRange.setStartBefore(node.firstChild);
      deleteRange.setEndAfter(node.lastChild);
      deleteRange.deleteContents();
      return node;
  }
  ```

- 使用 `textContent`

  ```javascript
  function clearChild(node) {
      node.textContent = '';
      return node;
  }
  ```




### 回调的实现

#### Mutation Event

- `DOMNodeRemoved`: 节点被包含其的父节点移除时触发

- `DOMNodeRemovedFromDocument`: 节点被包含其的父节点或其祖先节点移除时触发，显然这个API更好用

  ```javascript
  if(window.chrome) {
      var root = documeny.documentElement;
      root.addEventListener('DOMNodeRemovedFromDocument', function(e) {
          setTimeout(function() { //判定永久移除还是临时的节点挪动
              if(root.contains(e.target)) { //如果还在DOM树，说明是永久删除
                  // 执行回调
              }
          })
      })
  }
  ```



#### Mutaion Observer

监视 `DOM` 变动的接口，异步触发

```javascript
//兼容处理
var MutationObserver = window.MutationObserver
|| window.WebKitMutationObserver
|| window.MozMutationObserver;

var observerMutationSupoort = !!MutationObserver;
```



```javascript
var observer = new MutationObserver(callback);

//接受两个参数
//监听的起点，配置对象（要监听那些类型的变动 可配置的值参考 https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver#MutationObserverInit）
observer.observe(document.documentElement, {
    childList: true,
    attributes: true
});
```

使用 `Mutation Observer` 实现一个新的 `remove` 监听方法

```javascript
function onRemove(element, onDetachCallback) {
    var observer = new MutationObserver(function() {
        function isDetached(el) {
            if(el.parentNode === document) { //html
                return false
            }else if(el.parentNode === null) {
                return true
            }else {
                return isDetached(el.parentNode);
            }
        }
        
        if(isDetached(element)) {
            onDetachCallback();
        }
    });
    
    observer.observe(document, {
        childList: true,
        subtree: true
    })
}
```



#### 更多候选方案

方案一：自定义元素

https://www.html5rocks.com/zh/tutorials/webcomponents/customelements

`自定义元素的生命周期方法`

| 回调名称                                           | 调用时间点                 |
| -------------------------------------------------- | -------------------------- |
| createdCallback                                    | 创建元素实例               |
| attachedCallback                                   | 向文档插入实例             |
| detachedCallback                                   | 从文档中移除实例           |
| attributeChangedCallback(attrName, oldVal, newVal) | 添加，移除，或修改一个属性 |

```javascript
var tags = {};
function byCustomElement(name) {
    if(tag[name]) 
        return;
    var prototype = Object.create(HTMLElement.prototype);
    tags[name] = prototype;
    prototype.detachedCallback = function() {
        //执行回调
    }
    
    document.registerElement(name, pprototype);
}
```

方案二：使用 [Mutation Event](#mutation-event)

方案三：IE9或以上可以使用暴露的 `Node构造器` ，改写一些常用的 `DOM` 操作方法

```javascript
function byRewritePrototype() {
    if(byRewritePrototype.execute) {
        return;
    }
    
    byRewritePrototype.execute = true;
    
    var p = Node.prototype;
    function rewrite(name, fn) {
        var cb = p[name];
        p[name] = function(a, b) {
            return fn.call(this, cb, a, b);
        }
    }
    
    rewrite('removeChild', function(fn, a) {
        fn.call(this, a);
        
        if(a.nodeType === 1) {
            setTimeout(function() {
                doSomethingWith(a);
            });
        }
        
        return a;
    });
    
    rewrite('replaceChild', function(fn, a, b) {
        fn.call(this, a, b);
        
        if(a.nodeType === 1) {
            setTimeout(function() {
                doSomethingWith(a);
            });
        }
        
        return a;
    });
    
    rewrite('innerHTML', function(fn, html) {
        var all = this.getElementsByTagName('*');
        fn.call(this, a, b);
        doSomethingWith(all);
    });
    
    rewrite('innerHTML', function(fn, html) {
        var all = this.getElementsByTagName('*');
        fn.call(this, a, b);
        doSomethingWith(all);
    });
    
    rewrite('appendChild', function(fn, a) {
        fn.call(this, a);
        
        if(a.nodeType === 1 && this.nodeType === 11) { // 11 => DocumentFragment 节点 如果 this.nodeType 为 1 a 节点并没有被移除
            setTimeout(function() {
                doSomethingWith(a);
            });
        }
        
        return a;
    });
    
    rewrite('insertBefore', function(fn, a) {
        fn.call(this, a);
        
        if(a.nodeType === 1 && this.nodeType === 11) {
            setTimeout(function() {
                doSomethingWith(a);
            });
        }
        
        return a;
    });
}
```

方案四：简单粗暴的轮询

```javascript
var checkDisposeNodes = {};
var checkID = 0;

function byPolling(dom) {
    avalon.Array.ensure(checkDisposeNodes, dom); // https://rubylouvre.gitbooks.io/avalon/content/api.html#arrayensure
    
    if(!checkID) {
        checkID = setInterval(function () {
            for(var i = 0, el; el = checkDisposeNodes[i++];) {
                if(false === doSomethingWith(el)) {
                    avalon.Array.removeAt(checkDisposeNodes, i);
                    --i;
                }
            }
            
            if(checkDisposeNodes.length === 0) {
                clearInterval(checkID);
                checkID = 0;
            }
        }, 1000);
    }
}
```



##`innerHTML、innerText、outerHTML、outerText`的兼容处理

`innerText` 和 `textContent` 的区别

- `textContent` 会获取所有元素的 `content`，包括 `<script>` 和 `<style>` 元素

  ```html
  <p>p-content：<a href="" rel="nofollow">a-content </a><script>script-content</script></p>
  ```

  ```javascript
  $0.textContent //p-content：a-content script-content
  $0.innerText //p-content：a-content 
  ```

- `innerText` 不会获取 `display: none` 的元素

- `innerText` 会触发 `reflow`

- `innerText` 返回值会被格式化 （剔除格式信息和合并连续的空格，因此\t、\r、\n和连续的空格生效。）

  ```html
  <p>1           2</p>
  ```

  ```javascript
  $0.textContent //1           2
  $0.innerText //1 2
  ```



各 API 兼容方案

```javascript
var p = typeof HTMLElement !== 'undefine' && HTMLElement.prototype;

if(!('outerHTML' in p)) {
    p.__defineSetter__('outerHTML', function(s) {
        var r = this.ownerDocument.createRange();
        
        r.setStartBefore(this);
        
        var df = r.createContextualFragment(s);
        
        this.parentNode.replaceChild(df, this);
        
        return s;
    });
    
    p.__defineGetter__('outerHTML', function() {
        var a = this.attributes, str = '<' + this.tagName, i = 0;
        
        for(; i < a.length; i++) {
            if(a[i].specified) {
                str += ' ' + a[i].name + '=' + JSON.stringify(a[i].value);
            }
        }
        
        if(!this.canHaveChildren) {
            return str + '/>';
        }
        
        return str + '>' + this.innerHTML + '</' + this.tagName + '>';
    });
    
    p.__defineGetter__('canHaveChildren', function() {
        return !/^(area|base|basefont|col|frame|hr|img|br|input|isindex|link|meta|param)$/i.test(this.tagName);
    });
    
    if(!('innerText' in p)) {
        p.__defineSetter__('innerText', function(sText) {
            var parsedText = document.createTextNode(sText);
            
            this.innerHTML = '';
            this.appendChild(parsedText);
            
            return parsedText;
        });
        
        p.__defineGetter__('innerText', function() {
            var r = this.ownerDocument.createRange();
            
            r.selectNodeContents(this);
            
            return r.toString();
        });
    }
    
    if(!('outerText' in p)) {
        p.__defineSetter__('outerText', function(sText) {
            var parsedText = document.createTextNode(sText);
            
            this.parentNode.replaceChild(parsedText, this);
            
            return parsedText;
        });
        
        p.__defineGetter__('outerText', function() {
            var r = this.ownerDocument.createRange();
            
            r.selectNodeContents(this);
            
            return r.toString();
        });
    }
}

// nodeValue 在节点为 文本节点 和 注释节点 的时候存在
function outerHTML(el) {
    switch(el.nodeType + '') {
        case '1':
        case '9':
            return 'xml' in el ? el.xml : new XMLSerializer().serializeToString(el);
        case '3':
            return el.nodeValue;
        case '8':
            return '<!--' + el.nodeValue + '-->';
        default:
            return '';
    }
}

function innerHTML(el) {
    for(var i = 0, c, ret = []; c = el.childNodes[i++];) {
        ret.push(outerHTML(c));
    }
    
    return ret.join('');
}

function getText() {
    
    return function getText(nodes) {
        for(var i = 0, ret = '', node; node = nodes[i++]) {
            if(node.nodeType === 3 || node.nodeType === 4) { // 4 的情况已经废弃
                ret += node.nodeValue;
            }else if(node.nodeType !== 8) {
                ret += getText(node.childNodes);
            }
        }
    }
}()
```



