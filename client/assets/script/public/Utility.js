// --------------------------------------------------------
// 公共方法
// --------------------------------------------------------
// 
// --------------------------------------------------------
"use strict";

const utility = {
    // 随机给定范围整数
    Random: function (min, max) {
        if (typeof min !== 'number') return;
        if (typeof max !== 'number') return;
        if (min >= max) return min;
        let random = Math.random();
        return (min + Math.round(random * (max - min)));
    },

    // 用指定字符串分割数字或字符串
    SplitStr: function (data, strSplit) {
        let strFomat = '';
        strSplit = strSplit || ',';
        if (typeof data === 'number') {
            strFomat = data.toString();
        } else if (typeof data === 'string') {
            strFomat = data;
        } else {
            return data;
        }
        let re = /(?=(?!\b)(\d{3})+$)/g;
        return strFomat.replace(re, strSplit);
    },

    // 格式化时间为字符串
    FormatDate: function (fmt, date) {
        date = date || new Date();
        const opt = {
            "Y+": date.getFullYear().toString(),
            "m+": (date.getMonth() + 1).toString(),
            "d+": date.getDate().toString(),
            "H+": date.getHours().toString(),
            "M+": date.getMinutes().toString(),
            "S+": date.getSeconds().toString()
        };
        let ret;
        for (let k in opt) {
            ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length == 1) ?
                    (opt[k]) : (opt[k].padStart(ret[1].length, "0")));
            }
        };
        return fmt;
    },

    // 节点坐标转换为微信坐标
    NodeToWXPos: function (node) {
        if (node.__classname__ !== "cc.Node") return;
        let sysInfo = wx.getSystemInfoSync();
        let rect = node.getBoundingBoxToWorld();
        let ratio = cc.view._devicePixelRatio;
        let scale = cc.view.getScaleX();
        let factor = scale / ratio;
        return {
            x: rect.x * scale,
            y: (sysInfo.screenHeight - (rect.y + rect.height) * factor) * ratio,
            width: rect.width * scale,
            height: rect.height * scale
        }
    },

    // 是否为微信小游戏平台
    IsWeinXinPlatform: function () {
        return (cc.sys.platform === cc.sys.WECHAT_GAME);
    },

    // 获得玩家微信信息
    GetWeiXinUserInfo: function (callback, options) {
        if (!this.IsWeinXinPlatform()) {
            callback();
            return;
        }

        function CreatAuthBtn() {
            const res = wx.getSystemInfoSync();
            let factor = cc.view.getScaleX() / cc.view._devicePixelRatio;
            let width = res.screenWidth, height = res.screenHeight;
            let rtNode = options.node.getBoundingBoxToWorld();
            let btnWidth = 120, btnHeight = 40;
            let btnAuth = wx.createUserInfoButton({
                type: 'text', text: options.text,
                style: {
                    left: (width - btnWidth) / 2,
                    top: height - (rtNode.y + rtNode.height / 2) * factor - btnHeight / 2,
                    width: btnWidth, height: btnHeight, lineHeight: btnHeight,
                    backgroundColor: '#4c4c4c', color: '#ffffff',
                    textAlign: 'center', fontSize: 16, borderRadius: 4
                }
            });
            btnAuth.onTap(function (res) {
                btnAuth.destroy();
                callback(res.userInfo);
            });
            return btnAuth;
        }

        wx.getUserInfo({
            fail: function () {
                let btnAuth = CreatAuthBtn();
                callback(null, btnAuth);
            }.bind(this),
            success: function (res) {
                callback(res.userInfo);
            }.bind(this)
        });
    }
};

module.exports = utility;