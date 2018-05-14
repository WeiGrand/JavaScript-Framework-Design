# 数据缓存模块

## jQuery 的第1代缓存系统

`jQuery` 的缓存系统是把所有数据都放在 `$.cache` 上，然后为每个使用缓存系统的`元素节点`，`文档对象`，`window对象` 分配一个 `UUID` 

```javascript
var expando = 'jQuery' + (new Date()).getTime(), // key
    uuid = 0, // value
    windowData = {}; // 用于存放 window 对象的缓存数据

jQuery.extend({
    cache: {},
    data: function(elem, name, data) {
        elem = elem == window ? windowData : elem;
        var id = elem[expando];
        
        if(!id) {
            id = elem[expando] = ++uuid;
        }
        
        if(name && !jQuery.cache[id]) {
            jQuery.cache[id] = {};
        }
        
        // 有第3个参数就是 写操作
        if(data !== undefined) {
            jQuery.cache[id][name] = data;
        }
        
        return name ? jQuery.cache[id][name] : id;
    },
    
    removeData: function(elem, name) {
        elem = elem == window ? windowData : elem;
        var id = elem[expando];
        
        if(name) {
            if(jQuery.cache[id]) {
                delete jQuery.cache[id][name];
                name = '';
                
                // 判断 jQuery.cache[id] 是否还有缓存，如果没有就把 elem 清除
                // 遍历缓存体，如果不为空，name会被赋值
                for(name in jQuery.cache[id]) {
                    break;
                }
                
                if(!name) {
                    jQuery.removeData(elem);
                }
            }
        }else {
            // IE 下对元素使用 delete 会抛错
            try {
                delete elem[expando];
            }cache(e) {
                if(elem.removeAttribute) {
                    elem.removeAttribute(expando);
                }
                
                delete jQuery.cache[id];
            }
        }
    }
})
```

顺便认识一下 `queue` 和 `dequeue` 两个方法

`queue` 用于缓存一组数据

`dequeue` 用于从一组数据中删掉一个

```javascript
jQuery.extend({
    queue: function(elem, type, data) {
        if(elem) {
            type = (type || 'fx') + 'queue'; // fx 代表 jQuery 的 fx 模块
            var q = jQuery.data(elem, type);
            if(!q || jQuery.isArray(data)) {
                q = jQuery.data(elem, type, jQuery.makeArray(data));
            }else if(data) {
                q.push(data);
            }
        }
        
        return q;
    },
    
    dequeue: function(elem, type) {
        var queue = jQuery.queue(elem, type),
            fn = queue.shift();
        
        if(!type || type === 'fx') {
            fn = queue[0];
        }
        
        if(fn !== undefined) {
            fn.call(elem);
        }
    }
})
```

