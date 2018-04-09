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



## 属性描述符



### Object.getOwnPropertyNams

获取对象 `可遍历` 与 `不可遍历` 的属性（不包括原型链上）

```javascript
//与 Object.keys 的区别在于 Object.keys 只获取可枚举的属性
var obj = {
    aa: 1,
    toString: function() {
        return '1';
    }
}

if(Object.defineProperty && Object.seal) {
    Object.defineProperty(obj, 'name', {
        value: 2
        //enumerable 默认为 false 所以该属性是不可枚举的
    })
}

console.log(Object.getOwnPropertyNames(obj)); // ['aa', 'toString', 'name']
console.log(Object.keys(obj)); //['aa', 'toString']
```



### Object.getPrototypeOf

获取对象内部属性 `[[Protortpe]]`

```javascript
console.log(Object.getPrototypeOf(function() {}) === Function.prototype); //true
console.log(Object.getPrototypeOf({}) === Object.prototype); //true
```



### Object.defineProperty

- 访问器属性：`set` `get` `configurable` `enumerable`
- 数据属性：`configurable` `enumerable` `value` `writable`

```javascript
var obj = {}
Object.defineProperty(obj, 'a', {
    value: 37, //值
    writable: true, //是否能被 赋值运算符 改变 默认为 false
    enumerable: true, //是否能被枚举
    configurable: true //是否能改变描述符，以及该属性是否能被删除 默认为 false
    //set
    //get
});
```

> 其中 `value` 和 `writable` 不能与 `get` 和 `set` 同时存在

`defineProperty` 的第三个参数并没有使用 `hasOwnProperty` 进行取值，所以一旦 `Object.prototype` 被污染，

就容易程序崩溃。

下面提供一种解决方法

```javascript
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function defineProperty(obj, key, desc) {
    var d = Object.create(null); //没有继承的属性
    d.configurable = hasOwn(desc, 'configurable');
    d.enumerable = hasOwn(desc, 'enumerable');
    if(hasOwn(desc, 'value')) {
        d.writeable = hasOwn(desc, 'writable');
        d.value = desc.value;
    }else {
        d.get = hasOwn(desc, 'get') ? desc.get : undefined;
        d.set = hasOwn(desc, 'set') ? desc.set : undefined;
    }
    return Object.defineProperty(obj, key, d);
}

var obj = {};
defineProperty(obj, 'aaa', {
    value: 'OK'
});
```

模拟 `Object.defineProperty`

```javascript
if(typeof Object.defineProperty !== 'function') {
    Object.defineProperty = function(obj, prop, desc) {
        if('value' in desc) {
            obj[prop] = desc.value;
        }
        if('get' in desc) {
            obj.__defineGetter__(prop, desc.get);
        }
        if('set' in desc) {
            obj.__defineSetter__(prop, desc.set);
        }
        return obj;
    }
}
```



### Object.defineProperties

`Object.defineProperty` 的加强版，可以处理多个属性。

模拟 `Object.defineProperties`

```javascript
if(typeof Object.defineProperties !== 'function') {
    Object.defineProperties = function(obj, descs) {
        for(var prop in descs) {
            if(descs.hasOwnProperty(prop)) {
                Object.defineProperty(obj, prop, descs[prop]);
            }
        }
    }
}
```



### Object.getOwnPropertyDescriptor

获取某个对象的本地属性的配置对象

```javascript
var obj = {};
obj.a = 123;
console.log(Object.getOwnPropertyDescriptor(obj, 'a')); //{value: 123, writable: true, enumerable: true, configurable: true}
```

使用场景

```javascript
function mixin(receiver, supplier) {
    if(Object.getOwnPropertyDescriptor) {
        Object.keys(supplier).forEach(function(property) {
            Object.defineProperty(receiver, property, Object.getOwnPropertyDescriptor(supplier, prop));
        });
    }else {
        for(var property in supplier) {
            if(supplier.hasOwnProperty(property)) {
                receiver[property] = supplier[property];
            }
        }
    }
}
```



### Object.create

用于创建 `子类的原型`，其中第一个参数为 `父类的原型`

模拟 `Object.create`

```javascript
if(typeof Object.create !== 'function') {
    Object.create = function(prototype, descs) {
        function F() {};
        F.prototype = prototype;
        var obj = new F();
        if(descs != null) {
            Object.defineProperty(obj, descs);
        }
        return obj;
    }
}
```

可以用来继承

```javascript
function Animal(name) {
    this.name = name;
}

Animal.prototype.getName = function() {
    return this.name;
}

function Dog(name, age) {
    Animal.call(this, name);
    this.age = age;
}

Dog.prototype = Object.create(Animal.prototype, {
    getAge: {
        value: function() {
            return this.age;
        }
    },
    setAge: {
        value: function(age) {
            this.age = age;
        }
    }
});
```



### Object.preventExtesions

阻止 `添加` 本地属性

但允许 `修改` 、`删除` 原有的属性



### Object.seal

阻止 `添加` 、`删除` 本地属性

但允许 `修改` 原有的属性



### Object.freeze

阻止 `添加` 、`修改`、`删除` 本地属性



## 真类降临

`ES6` 中的 `Classes` 是在 `JavaScript` 现有的 `原型继承` 的基础上引入的「语法糖」。

因为 `ES6` 的规范并没有被浏览器广泛支持，所以需要通过 [Babel](https://babeljs.io) 编译为 `ES5` 才能在大多数浏览器中运行，

因此可以通过 `Babel` 一窥 `ES6` 中的 `Class` 是如何实现的。

```javascript
//ES6
class View {
	constructor(options) {
    	this.model = options.model;
    }
  
  	render() {
    	console.log('render');
    }
}
```

```javascript
//编译为 ES5 后
'use strict';

var _createClass = function () { 
    function defineProperties(target, props) { 
        for (var i = 0; i < props.length; i++) { 
            var descriptor = props[i]; 
            descriptor.enumerable = descriptor.enumerable || false; 
            descriptor.configurable = true; 
            if ("value" in descriptor) 
                descriptor.writable = true; 
            Object.defineProperty(target, descriptor.key, descriptor); 
        } 
    } 
    return function (Constructor, protoProps, staticProps) { 
        if (protoProps) 
            defineProperties(Constructor.prototype, protoProps); 
        if (staticProps) 
            defineProperties(Constructor, staticProps); 
        return Constructor; 
    }; 
}();

// 检测是否有用 new 创建实例
function _classCallCheck(instance, Constructor) { 
    if (!(instance instanceof Constructor)) { 
        throw new TypeError("Cannot call a class as a function"); 
    } 
}

var View = function () {
  function View(options) {
    _classCallCheck(this, View);

    this.model = options.model;
  }

  _createClass(View, [{
    key: 'render',
    value: function render() {
      console.log('render');
    }
  }]);

  return View;
}();
```

可以看出 `ES6` 的 `Class` 本质还是构造函数，通过 `_createClass` 将 `原型方法` 和 `静态方法` 通过 `Object.defineProperty` 分别加到 `Class.prototype` 和 `Class` 上。

