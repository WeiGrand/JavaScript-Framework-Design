/**
 * Created by heweiguang on 2018/3/31.
 */

var P = (function(prototype, ownProperty, undefined) {

    function isObject(o) {
        return typeof o === 'object';
    }

    function isFunction(f) {
        return typeof f === 'function';
    }

    function BareConstructor() {};

    function P(_superclass, definition) {
        //如果没有 definition
        if(definition === undefined) {
            definition = _superclass;
            _superclass = Object;
        }

        /**
         * 生产出来的 Class
         * @constructor
         */
        function C() {
            var self = this instanceof C ? this : new Bare;
            self.init.apply(self, arguments);
            return self;
        }

        function Bare() {} //为了让 C 不用 new 就能返回实例

        C.Bare = Bare;

        //父类的原型
        //为了防止子类的改动影响到父类，先将父类的原型赋给中介者 Bare
        var _super = BareConstructor[prototype] = _superclass[prototype];

        //子类的原型
        var proto = Bare[prototype] = C[prototype] = new BareConstructor;
        proto.constructor = C;

        C.mixin = function(def) {
            return P(C, def);
        }

        return (C.open = function(def) {
            if(isFunction(def)) {
                def = def.call(C, proto, _super, C, _superclass);
            }

            if(isObject(def)) {
                for(var key in def) {
                    if(ownProperty.call(def, key)) {
                        proto[key] = def[key];
                    }
                }
            }

            // 确保 init 存在 且为函数
            if(!('init' in proto)) {
                proto.init = _superclass;
            }

            return C;
        })(definition);

    }

    return P;
})('prototype', ({}).hasOwnProperty);
