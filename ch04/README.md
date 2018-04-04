# 类工厂

## JavaScript 对类的支持

`JavaSctipt` 允许我们直接在构造函数内指定其方法，这叫做 `特权方法`。如果是属性，就叫 `特权属性`。

### 原型继承

```javascript
function A() {};
A.prototype = {
    aa: function() { //作者直接取名为 aa 我觉得不好，没有语义
        alert(1);
    }
}

//连接父类和子类的原型
function bridge() {};
bridge.prototype = A.protortpe;

function B() {};
B.prototype = new bridge();
B.prototype.constructor = B;

//如果使用 __proto__ 可以更轻松实现
//B.prototyp.__proto__ = A.prototype;

//ES5 内置的 Object.create 来实现原型继承
//简单地实现 Object.create
Object.create = function(o) { //o 相当于 A.prototype
    function F() {}; //F 相当于 bridge
    F.prototype = o;
    return new F();
}
```

以上代码还没有让子类继承父类的 `类成员` 和 `特权成员`

所有下面给出更完善的方法

```javascript
function extend(destination, source) {
    for(var property in source)
        destination[property] = source[property];
    return destination;
}

/*
 * init: 子类构造函数
 * Parent: 父类构造函数
 * proto: 子类原型对象
 */
function inherit(init, Parent, proto) {
    function Son() {
        Parent.apply(this, argument); //先继承父类的特权成员
        init.apply(this, argument); //再执行自己的构造函数
    }
    
    Son.prototype = Object.create(Parent.prototype, {});
    Son.prototype.toString = Parent.prototype.toString; //IE bug
    Son.prototype.valueOf = Parent.prototype.valueOf; //IE bug
    Son.constructor = Son; //确保构造起指向自身而不是 Object
    extend(Son.prototype, proto); //添加子类的原型成员
    extend(Son, Parent); //继承父类的类成员
    
    return Son;
}
```



### `new` 操作时发生了什么事

1. 创建一个空对象 `instance`
2. `instance.__proto__` = `instanceClass.prototype`
3. 将构造函数里面的 `this` = `instance`
4. 执行构造器里面的代码
5. 有返回值且类型为 `Object` , `Array` 等复合数据类型就返回该对象，否则返回 `this` （实例）

```javascript
//近似的实现 https://segmentfault.com/q/1010000005141424
function NewFunc(func) {
    var ret = {};
    if(func.prototype !== null) {
        ret.__proto__ = func.prototype;
    }
    var ret1 = func.apply(ret, Array.prototype.slice.call(arguments, 1));
    if((typeof ret1 === 'object' || typeof ret1 === 'function') ret1 !== null ) {
        return ret1;
    }
    return ret;
}
```

类的实例并不是通过 `instance.prototype` 回溯到原型链的，而是使用 `instance.__proto__`



## 各种类工厂的实现

`Gof` 认为 `组合` 由于 `继承` 

### P.js 的实现

```javascript
// 参见 P.js
```



### JS.Class 的实现

```javascript
// 参见 JS.Class.js
```



### simple-inheritance 的实现

```javascript
(function() {
    
    var initializing = false,
        // 判断函数是否能通过 toString 转为字符串，如果可以就用 /\b_super\b/ 检测函数里面有没有 _super 语句
        fnTest = /xyz/.test(function() {
            xyz;
        }) ? /\b_super\b/ : /.*/;
    
    this.Class = function() {}; //这里的 this 就是 window
    
    Class.extend = function(prop) { //所以不用 this.Class 也能访问
        var _super = this.prototype;
        
        initializing = true;
        var prototype = new this(); //创建子类的原型
        initializing = false;
        
        for(var name in prop) {
            prototype[name] = typeof prop[name] === 'function' &&
                typeof _super[name] === 'function' && fnTest.test(prop[name]) ?
                (function(name, fn) {
                    return function() {
                        //当调用 this._super 的时候，其实是想调用 父类的同名方法[name]
                        //而不是真的存在 this._super 这个方法
                        var tmp = this._super;
                        this._super = _super[name];
                        
                        var ret = fn.apply(this, arguments);
                        
                        this._super = tmp;
                        
                        return ret;
                    }
            })(name, prop[name]) : 
            prop[name];
        }
        
        function Class() {
            //继承的时候会在 new this() 之前将 initializing 设置为 true
            //防止触发init
            if(!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        }
        
        Class.prototype = prototype;
        Class.prototype.constructor = Class; //确保原型的 constructor 正确指向自身
        Class.extend = arguments.callee;
        
        return Class;
    }
})();
```



## def.js 的实现

```javascript
(function(global) {
    var deferred; //是一个函数，实现柯里化
    
    //继承
    function extend(source) {
        var prop,
            target = this.prototype;
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                prop = target[key] = source[key];
                // 如果是函数类型，保存函数名和当前类
                if('function' == typeof prop) {
                    prop._name = key;
                    prop._class = this; // 用于下方 base 函数访问当前类
                }
            }
        }
        return this;
    }
    
    //用于切断子类与父类的原型连接
    function Subclass() {}
    
    //这行父类的同名函数
    //init: function() {this._super();} 相当于执行 父类.init();
    function base() {
        var caller = base.caller; // 调用 base 的函数
        return caller._class._super.prototype[caller._name].apply(this, arguments.length ? arguments : caller.arguments);
    }
    
    function def(context, klassName) {
        klassName || (klassName = context, context = global);
        
        var Klass = context[klassName] = function Klass() {
            if(context != this) { //new 的时候执行
                return this.init && this.init.apply(this, arguments);
            }
            
            deferred._super = Klass;
            deferred._props = arguments[0] || {};
        }
        
        Klass.extend = extend;
        
        function deferred = function(props) {
            return Klass.extend(props);
        }
        
        //重写 valueOf 在 def('Dog') < Animal({}) 的时候触发
        //< 操作符的目的是让两边计算自身
        deferred.valueOf = function() {
            var Superclass = deferred._super;
            
            if(!Superclass) {
                return Klass;
            }
            
            Subclass.prototype = Superclass.prototype;
            var proto = Klass.prototype = new Subclass;
            //引用自身与父类
            Klass._class = Klass;
            Klass._super = Superclass;
            
            Klass.toString = function() {
                return klassName;
            }
            
            proto.constructor = Klass;
            
            proto._super = base;
            
            deferred(deferred._props);
        }
        
        return deferred;
    }
    
    global.def = def;
}(this));
```

