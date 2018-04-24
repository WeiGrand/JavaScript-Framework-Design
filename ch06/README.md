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



   