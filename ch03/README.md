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
      ('a~b'.split(/(~)/))[1] == 'b' || //正常的返回 ["a", "~", "b"]
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

