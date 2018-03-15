/**
 * Created by heweiguang on 2018/3/15.
 */

//定义一个命名空间
const avalon = {};
avalon.fn = {};

//noop
avalon.noop = function() {};

//bind 不实现
avalon.bind = function() {};

let readyList = [];
let DOC = self.document;
let W3C = DOC.dispatchEvent;
let html = DOC.documentElement;

avalon.ready = function(fn) {
    if(readyList) {
        readyList.push(fn);
    }else {
        fn();
    }
};

function fireReady() {
    readyList.forEach(fn => {
        fn();
    });

    readyList = null;

    fireReady = avalon.noop;
}

/**
 * IE hack
 */
function doScrollCheck() {
    try {
        html.doScroll('left');
        fireReady();
    } catch(e) {
        setTimeout(doScrollCheck);
    }
}

//Firefox 3.6之前，不存在 readyState 属性
let readyState;
const ready = W3C ? 'DOMContentLoaded' : 'readystatechange';
if(!DOC.readyState) {
    readyState = DOC.readyState = DOC.body ? 'complete' : 'loading';
}

if(DOC.readyState === 'complete') {
    fireReady();
}else {
    avalon.bind(DOC, ready, function() {
        if(W3C || DOC.readyState === 'complete') {
            fireReady();

            if(readyState) { // 即通过 DOC.body 判断的
                DOC.readyState = 'complete';
            }
        }
    });

    if(html.doScroll) {
        try {
            if(self.eval === parent.eval) { //排除跨域的情况
                doScrollCheck();
            }
        } catch(e) {
            doScrollCheck();
        }
    }
}
