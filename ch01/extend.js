/**
 * Created by heweiguang on 2018/3/12.
 */

//定义一个命名空间
const avalon = {};
avalon.fn = {};

//简单实现 isFunction
avalon.isFunction = function(target) {
    return target instanceof Function;
};

//简单实现 isPlainObject
avalon.isPlainObject = function(target) {
    return typeof target === 'object';
};

avalon.min = avalon.fn.min = function() {
    let i = 1; //用于定位 source 对象, 默认是第二个参数
    let target = arguments[0]; //被extend的变量，默认是第一个参数
    let deep = false; //是否深拷贝
    const length = arguments.length; //参数的个数
    
    //如果第一个参数为 boolean, 判断是否深拷贝
    if(typeof  target === 'boolean') {
        deep = target;
        target = arguments[1] || {}; //此时 target 仍有可能是一个函数
        i++;
    }

    //确保 target 为 {}
    if(typeof target !== 'object' && !avalon.isFunction(target)) {
        target = {};
    }

    //如果只有一个参数，extend 到 min所在对象上
    if(i === length) {
        target = this;
        i--;
    }

    //主要的逻辑
    for(; i < length; i++) {
        let options = arguments[i], src, copy;

        if(options !== null) {
            for(let name in options) {
                try { //这里的 try catch 作者说是为了防止 VBS 对象报错
                    src = target[name];
                    copy = options[name];
                } catch (e) {
                    continue;
                }

                // 防止环引用
                if(target === copy) {
                    continue;
                }

                let copyIsArray = false;
                let clone;

                //处理深拷贝
                if(deep && copy && (avalon.isPlainObject(copy)) || (copyIsArray = Array.isArray(copy))) {
                    if(copyIsArray) {
                        copyIsArray = false; //作者这里将 copyIsArray 重置为 false，个人感觉不必要
                        clone = src && Array.isArray(src) ? src : []
                    }else {
                        clone = src && avalon.isPlainObject(src) ? src : {};
                    }

                    //递归
                    target[name] = avalon.mix(deep, clone, copy);
                }else if(copy !== void 0) { // void 0 === undefined
                    target[name] = copy;
                }
            }
        }
    }

    return target;
};
