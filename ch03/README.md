# 浏览器嗅探与特征侦测

`特征侦测`：判断某个原生对象有没有此方法或属性

## 浏览器判定

### jQuery.browser

```javascript
//参见 jQuery.browser.js
```



### mass Framework 解决方案

```javascript
define('browser', function() {
    var w = window,
        ver = w.opera ? (opera.version.replace(/\d$/, '') - 0) : 
    parseFloat(/(?:IE |fox\/|ome\/ion\/)(\d+\.\d)/.exec(navigator.userAgent) || [, 0])[1] // 取数组第二项
    return {
        ie: !!w.VBArray && Math.max(document.documentMode || 0, ver), //内核 trident
        firefox: !!w.netscape && ver, //内核 Gecko
        opera: !!w.opera && ver,
        chrome: !!w.chrome && ver,
        safari: /apple/i.test(navigator.vendor) && ver //内核 WebCore
    }
});
```



### 作者收集的一些判定方法

```javascript
const ie = !!document.recalc || 
      !!window.VBArray ||
      !!window.ActiveXObject ||
      !!window.createPopup ||
      /*@cc_on!@*/!1 ||
      document.expando ||
      (function() { //在IE10中失效
          var v = 3,
              div = document.createElement('div');
          while(div.innerHTML = '<!--[if gt IE ' + (++v) + ']><br><![endif]-->', div.innerHTML);
          
          return v > 4 ? v : !v;
      })();

const ie678 = !+"\v1" ||
      !-[1, ] ||
      '\v' == 'v' ||
      ('a~b'.split(/(~)/))[1] == 'b' || //正常的返回 ["a", "~", "b"] 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/split Example: (Capturing parentheses) 捕获组的匹配结果也会包含在数组中
      0.9.toFixed(0) == '0' || //正常返回 '1'
      /\w/.test('\u0130') ||
      0//@cc_on+1;

const ie67 = !'1'[0]; //字符串不能使用数组下标

const ie8 = window.toStaticHTML || !!window.XDomainRequest;
const ie9 = window.msPerformance || documemt.documentMode && document.documentMode === 9;

//还有一些关于IE的忽略了...

const opera = !!window.opera;
const firefox = !!window.GeckoActiveXObject ||
      !!window.netscape ||
      !!window.Components ||
      !!window.updateCommands;
const safari = !!(navigator.vendor && navigator.vendor.match(/Apple/)) ||
      window.openDatebase && !window.chrome;
const chrome = !!(window.chrome && window.google);
```

我觉得吧，在实际应用中直接上网查就得了，没必要花时间记。



## document.all 趣闻

`document.all` 最早用于检测IE

`undetected document.all` 可以正常使用，但无法（其实还是可以）检测到它的存在

> An undetected object is a special class of JS Object:
>
> `typeof` operator returns undefined, ToBoolean returns false.
>
> Otherwise it behaves like a normal JS Object.

```javascript
console.log(document.all + ""); //[object HTMLAllCollection]
//看似无法检测
console.log(typeof documemt.all); //"undefined"
console.log(documemt.all == undefined); //true
//其实还是可以检测
console.log(documemt.all === undefined); //false
console.log('all' in documemt); //true
```



## 事件的支持侦测

`Prototype` 的实现

```javascript
var isEventSupport = (function() {
    var TAGNAMES = [ //特定元素才有的相关事件
        'select': 'input', 
        'change': 'input',
        'submit': 'form',
        'reset': 'form',
        'error': 'img',
        'load': 'img',
        'abort': 'img'
    ];
    function isEventSupport(eventName) {
        var el = document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName; //只支持了 DOM0
        var isSupported = (eventName in el);//光这个判断还不够
        if(!isSupported) {
            el.setAttrbute(eventName, 'return;');
            isSupported = typeof el[eventName] == 'function';
        }
        el = null; //防止内存泄漏
        return isSupported;
    }
    return isEventSupport;
})();
```



对 `focusin` 的

```javascript
$.support.focusin = !!window.attachEvent;
$(function() {
    var div = documemt.createElement('div');
    div.innerHTML = '<a href="#"></a>';
    if(!$.support.focusin) {
        a = div.firstChild;
        a.dddEventListener('focusin', function() {
            $.support.focusin = true;
        }, false);
        a.focus();
    }
});
```



`transition end` 侦测

```javascript
//bootstrap
$.support.transition = (function() {
	var transitionEnd = (function() {
        var el = document.createElement('bootstrap'),
            transEndEventNames = {
                'WebkitTransition': 'webkitTransitionEnd',
                'MozTransition': 'mozTransitionEnd',
                'OTransition': 'oTransitionEnd',
                'transtion': 'transitionend'
            };
        
        for(var name in transEndEventNames) {
            if(el.style[name] !== undefined) {
                return transEndEventNames[name];
            }
        };
	}());
    return transitionEnd && {
        end: transitionEnd
    };
})();
```



`animation end` 侦测

```javascript
//avalon
var checker = {
    'AnimationEvent': 'animationend',
    'WebkitAnimationEvent': 'webkitAnimationEnd'
}
var ani, 
    supportAnimation = false, 
    animationEndEvent;
for(var name in checker) {
    if(window[name]) {
        ani = checker[name];
        break;
    }
}
if(typeof ani === 'string') {
    supportAnimation = true;
    animationEndEvent = ani;
}
```



## 样式的支持侦测

```javascript
//avalon
var prefixes = ['', '-webkit-', '-moz', '-o-', '-ms-'];
var cssMap = {};
function cssName(name, host) {
    if(cssMap[name]) {
        return cssMap[name];
    }
    host = host || document.documentElement;
    for(var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = $.String.camelize(prefixes[i], name);
        if(camelCase in host) {
            return (cssMap[name] = camelCase);
        }
    }
    return null;
}
```

若要侦测某个样式名是否支持某个样式值可以用 `CSS.supports`

```javascript
//https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
CSS.supports("display", "flex"); //true
CSS.supports("( transform-origin: 5% 5% )"); //true
```

