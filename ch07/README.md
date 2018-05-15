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



## jQuery 的第2代缓存系统

`jQuery` 第2代缓存系统的实现方法是 `valueOf` 的重写

```javascript
function Data() {
    this.cache = {};
}

Data.uid = 1;

Data.prototype = {
    // owner 为 元素节点、文档对象、window对象
    locker: function(owner) {
        var oValueOf,
        
        // 检测 valueOf 是否被重写，返回 Object 证明没有
        unlock = owner.valueOf(Data);
        
        if(typeof unlock !== 'string') {
            unlock = jQuery.expando + Data.uid++;
            oValueOf = owner.valueOf;
            
            Object.defineProperty(owner, 'valueOf', {
                value: function(pick) {
                    if(pick === Data) {
                        return unlock;
                    }
                    
                    return oValueOf.apply(owner);
                }
            });
        }
        
        if(!this.cache[unlock]) {
            this.cache[unlock] = {};
        }
        
        return unlock;
    },
    
    set: function(owner, data, value) {
        var prop,
            cache,
            unlock;
        
        unlock = this.locker(owner);
        cache = this.cache[unlock];
        
        if(typeof data === 'string') {
            cache[data] = value;
        }else { // data 为 对象 的情况
            if(jQuery.isEmptyObject(cache)) { // 如果没添加过任何对象
                cache = data;
            }else {
                for(prop in data) {
                    cache[prop] = data[prop];
                }
            }
        }
        
        this.cache[unlock] = cache;
        
        return this;
    },
    
    get: function(owner, key) {
        var cache = this.cache[this.locker(owner)];
        
        return key === undefined ? cache : cache[key];
    },
    
    access: function(owner, key, value) {
        if(key === undefined || ((key && typeof key === 'string') && value === undefined)) {
            return this.get(owner, key);
        }
        
        this.set(owner, key, value);
        return value !== undefined ? value : key;
    },
    
    remove: function(owner, key) {
        var unlock = this.locker(owner),
            cache = this.cache[unlock)];
        
        delete cache[key];
        
        this.cache[unlock] = cache;
    },
    
    // 检查是否缓存了数据
    hasData: function(owner) {
        return !jQuery.isEmptyObject(this.cache[this.locker(owner)]);
    },
    
    // 删除缓存数据
    discard: function(owner) {
        delete this.cache[this.locker(owner)];
    }
}

var data_user = new Data(), // 用户数据
    data_priv = new Data(); // 私有数据

jQuery.extend({
    expando: 'jQuery' + (core_version + Math.random()).replace(/\D/g, ''),
    
    acceptData: function() {
        return true;
    },
    
    hasData: function(elem) {
        return data_user.hasData(elem) || data_priv.hasData(elem);
    },
    
    // 读写 用户数据
    data: function(elem, name, data) {
        return data_user.access(elem, name, data);
    },
    
    // 删 用户数据
    removeData: function(elem, name) {
        return data_user.remove(elem, name);
    },
    
    // 读写 私有数据
    _data: function(elem, name, data) {
        return data_priv.access(elem, name, data);
    },
    
    // 删 私有数据
    _removeData: function(elem, name) {
        return data_priv.remove(elem, name);
    }
})
```

