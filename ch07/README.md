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



## jQuery 的第3代缓存系统

基于 `Object.defineProperty`

```javascript
function Data() {
    this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {
    cache: function(owner) {
        var value = owner[this.expando];
        
        if(!value) {
            value = {};
            
            // 元素节点、window、document 才会进入此分支
            if(acceptData(owner)) {
                
                if(owner.nodeType) {
                    owner[this.expando] = value;
                }else {
                    Object.defineProperty(owner, this.expando, {
                        value: value,
                        configurable: true
                    })
                }
            }
        }
        
        return value;
    },
    
    set: function(owner, data, value) {
        var prop,
            cache = this.cache(owner);
        
        if(typeof data === 'string') {
            cache[jQuery.camelCase(data)] = value;
        }else {
            for(prop in data) {
                cache[jQuery.camelCase(prop)] = data[prop];
            }
        }
        
        return cache;
    },
    
    //... 省略一些方法
    
    hasData: function(owner) {
        var cache = owner[this.expando];
        
        return cache !== undefined && !jQuery.isEmptyObject(cache);
    }
}
```

其中上面的 `acceptData` 实现

```javascript
var acceptData = function( owner ) {
  return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};
```

`isEmptyObject` 的实现

```javascript
function isEmptyObject(obj) {
    var name;
    
    for(name in obj) {
        return false;
    }
    
    return true;
}
```



## 有容量限制的缓存系统

一个简单的带容量限制的缓存系统

```javascript
function createCache(size) {
    var keys = [];
    
    function cache(key, value) {
        if(keys.push(key + '') > size) {
            delete cache[keys.shift()];
        }
        
        return (cache[key + ''] = value);
    }
    
    return cache;
}
```



`Least Recently User(LRU) 近期最少使用` 缓存算法

```javascript
// https://github.com/rsms/js-lru

function LRU(maxLength) {
    this.size = 0;
    this.limit = maxLength;
    this.head = this.tail = void 0;
    this._keymap = {};
}

LRU.prototype.put = function(key, value) {
    var entry = {
        key: key,
        value: value
    };
    
    this._keymap[key] = entry;
    
    if(this.tail) {
        this.tail.newer = entry;
        entry.older = this.tail;
    }else {
        this.head = entry;
    }
    
    this.tail = entry;
    
    if(this.size === this.limit) {
        this.shift();
    }else {
        this.size++;
    }
    
    return value;
}

LRU.prototype.shift = function() {
    var entry = this.head;
    
    if (entry) {
      // 当数据不止一个时
      if (this.head.newer) {
        // 把倒数第二个数据设为 head
        this.head = this.head.newer;
        this.head.older = undefined;
      } else {
      // 只有一个数据时调用shift，直接设置为 undefined
        this.head = undefined
      }

      // 返回的数据不应该有 newer 和 older 的数据
      entry.newer = entry.older = undefined;
        
      delete this._keymap[entry.key]
    }
}

LRU.prototype.get = functino(key) {
    var entry = this._keymap[key];
    
    if(entry === void 0) {
        return;
    }
    
    if(entry === this.tail) {
        return entry.value;
    }
    
    if(entry.newer) {
        if(entry === this.head) {
            this.head = entry.newer;
        }
        
        entry.newer.older = entry.newer;
    }
    
    if(entry.older) {
        entry.older.newer = entry.newer;
    }
    
    entry.newer = void 0;
    entry.older = this.tail;
    
    if(this.tail) {
        this.tail.newrt = entry;
    }
    
    this.tail = entry;
    
    return entry.value;
}
```



## 本地存储系统

检测是否禁用 `localStorage`

```javascript
function getLocalStorage() {
    if(window.localStorage) {
        try {
            localStorage.setItem('key', 'value');
            localStorage.removeItem('key');
            return localStorage;
        }cache(e) {}
    }
}
```



`store.js` 一个兼容所有浏览器的 `localStorage 适配器`

```javascript
module.exports = (function() {
    // Store.js
    var store = {},
        win = (typeof window != 'undefined' ? window : global),
        doc = win.document,
        localStorageName = 'localStorage',
        scriptTag = 'script',
        storage;
    
    store.disabled = false;
    store.version = '1.3.20';
    
    // 定义接口（空实现，即便浏览器不支持也不会报错）
    store.set = function(key, value) {};
    
    store.get = function(key, defaultVal) {};
    
    store.has = function(key) {
        return store.get(key) !== undefined;
    };
    
    store.remove = function(key) {};
    
    store.clear = function() {};
    
    store.transact = function(key, defaultVal, transactionFn) {
        if(transactionFn == null) {
            transactionFn = defaultVal;
            defaultVal = null;
        }
        
        if(defaultVal == null) {
            defaultVal = {};
        }
        
        var val = store.get(key, defaultVal);
        transctionFn(val);
        store.set(key, val);
    }
    
    store.getAll = function() {
        var ret = {};
        
        store.forEach(function(key, val) {
            ret[key] = val;
        });
        
        return ret;
    }
    
    store.forEach = function() {};
    
    store.serialize = function(value) {
        return JSON.stringify(value);
    }
    
    store.deserialize = function(value) {
        if(typeof value !== 'string') {
            return undefined;
        }
        
        try {
            return JSON.parse(value);
        }cache(e) {
            return value || undefined;
        }
    }
    
    function isLocalStorageNameSupported() {
        try {
            return (localStorageName in win && win[localStorageName]);
        }cache(e) {
            return false;
        }
    }
    
    if(isLocalStorageNameSupported()) {
        storage = win[localStorageName];
        
        store.set = function(key, val) {
            if(val === undefined) {
                return store.remove(key);
            }
            
            storage.setItem(key, store.serialize(val));
            
            return val;
        }
        
        store.get = function(key, defaultVal) {
            var val = store.deserialize(storage.getItem(key));
            
            return (val === undefined ? defaultVal : val);
        }
        
        store.remove = function(key) {
            storage.removeItem(key);
        }
        
        store.clear = function() {
            storage.clear();
        }
        
        store.forEach = function(callback) {
            // 原来 localStorage 有 length 属性和 key 方法
            for(var i = 0; i < storage.length; i++) {
                var key = storage.key(i);
                callback(key, store.get(key));
            }
        }
    }else if(doc && doc.documentElement.addBehavior) { // 支持 addBehavior 代表支持 userData
        // 使用 userData 逻辑
    }
    
    try {
        var testKey = '__storejs__';
        
        store.set(testKey, testKey);
        
        if(store.get(testKey) != testKey) {
            store.disabled = true;
        }
        
        store.remove(testKey);
    }cache(e) {
        store.disabled = true;
    }
    
    store.enabled = !store.disabled;
    
    return store;
}());
```

