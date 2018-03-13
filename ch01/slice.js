/**
 * Created by heweiguang on 2018/3/13.
 */

//定义一个命名空间
const avalon = {};
avalon.fn = {};

const _slice = Array.prototype.slice; // 缓存原生的 Array.prototype.slice 原型方法

try {
    _slice.call(document.documentElement); //IE < 9 报错
} catch(e) {
    Array.prototype.slice = function(begin, end) {
        const len = this.length;

        end = (typeof end !== 'undefined') ? end : len;

        if(Array.isArray(this)) {
            return _slice.call(this, begin, end);
        }

        let start = begin || 0;
        start = (start >= 0) ? start : len + start;

        let upTo = (end) ? end: len;
        if(end < 0) {
            upTo = len + end;
        }

        const size = upTo - start;

        const cloned = size > 0 ? new Array(size) : [];

        if(size > 0) {
            for(let i = 0; i < size; i++) {
                cloned[i] = this.charAt ? this.charAt(start + i) : this[start + i];
            }
        }

        return cloned;
    }
}

avalon.slice = function(nodes, start, end) {
    return _slice.call(nodes, start, end);
};
