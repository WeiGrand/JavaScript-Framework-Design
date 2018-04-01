/**
 * Created by heweiguang on 2018/4/1.
 */

var JS = {
    VERSION: '2.2.1'
};

JS.Class = function(classDefinition) {

    // 返回一个构造函数
    function getClassBase() {

        return function() {

            if(typeof this['construct'] === 'function' && preventJSBaseConstructorCall === false) {
                this.construct.apply(this, arguments);
            }
        }
    }

    function createClassDefinition(classDefinition) {
        // 保存父类的方法
        var parent = this.prototype['parent'] || (this.prototype['parent'] = {});

        for(var prop in classDefinition) {
            if(prop === 'statics') { // 静态成员
                for(var sprop in classDefinition.statics) {
                    this[sprop] = classDefinition.statics.sprop;
                }
            }else {
                if(typeof this.prototype[prop] === 'function') {
                    var parentMethod = this.prototype[prop];
                    parent[prop] = parentMethod;
                }
                this.prototype[prop] = classDefinition[prop];
            }
        }
    }

    var preventJSBaseConstructorCall = true;
    var Base = getClassBase();
    preventJSBaseConstructorCall = false;

    createClassDefinition.call(Base, classDefinition);

    //继承
    Base.extend = function(classDefinition) {
        preventJSBaseConstructorCall = true;

        var SonClass = getClassBase();
        SonClass.prototype = new this();

        preventJSBaseConstructorCall = false;

        createClassDefinition.call(SonClass, classDefinition);
        SonClass.extend = this.extend;

        return SonClass;
    };

    return Base;
};
