// --------------------------------------------------------
// 头像信息管理
// --------------------------------------------------------
// 
// --------------------------------------------------------
"use strict";

let headList = new Array();

function LoadHead(url) {
    if (headList[url].loading) return;
    headList[url].loading = true;
    cc.loader.load({ url: url, type: 'jpg' }, function (err, tex) {
        if (err) {
            let errMsg = err.message || err;
            console.error('加载%s头像错误：%s', url, errMsg);
        } else {
            headList[url].head = new cc.SpriteFrame(tex);
        }
        for (let i = 0; i < headList[url].callbacks.length; ++i) {
            if (typeof headList[url].callbacks[i] === 'function') {
                headList[url].callbacks[i](headList[url].head);
            }
        }
        headList[url].loading = false;
    });
}

const head = {
    Load: function (url, callback) {
        if (typeof url !== 'string' || url.length === 0) return;
        if (!headList[url]) headList[url] = { callbacks: new Array() };
        if (headList[url].head) {
            let isFunction = (typeof callback === 'function');
            if (isFunction) callback(headList[url].head);
        } else {
            headList[url].callbacks.push(callback);
            LoadHead.call(this, url);
        }
    },

    To64: function (head) {
        if (typeof head !== 'string' || head.length === 0) return head;
        return head.slice(0, head.lastIndexOf('132')) + '64';
    },

    To46: function (head) {
        if (typeof head !== 'string' || head.length === 0) return head;
        return head.slice(0, head.lastIndexOf('132')) + '46';
    },
};

module.exports = head;