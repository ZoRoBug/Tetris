// --------------------------------------------------------
// MessageBox弹窗
// --------------------------------------------------------
// options = {
//      width(弹窗宽度，<=1按照父节点宽度百分比计算), 
//      height(弹窗宽度，<=1按照父节点高度百分比计算), 
//      各类型按钮文本，如BT_OK = '自定义按钮文本',
//      countdownBtnType(倒计时按钮类型，如BT_OK), 
//      countdownMSTime(倒计时按钮毫秒，如10000), 
// }
// --------------------------------------------------------
"use strict";

function CallBack(mbNode, callback, result) {
    if (cc.isValid(mbNode)) mbNode.destroy();
    if (typeof callback === 'function') callback(result);
}

function DoShow(prefab, owner, tips, type, callback, options) {
    let msgbox = cc.instantiate(prefab);
    owner.addChild(msgbox);

    options = options || [];
    let bgNode = msgbox.getChildByName('Bg');
    let width = owner.width, height = owner.height;
    let bgWidth = options['width'], bgHeight = options['height'];
    if (!bgWidth) bgWidth = 420;
    if (!bgHeight) bgHeight = bgWidth * 0.65;
    if (bgWidth <= 1) bgWidth = width * bgWidth;
    if (bgHeight <= 1) bgHeight = height * bgHeight;
    bgNode.setContentSize(bgWidth, bgHeight);
    bgNode.setPosition(0, 0);

    let tipsNode = bgNode.getChildByName('Tips');
    tipsNode.getComponent(cc.Label).string = tips;

    let btnType1Node = bgNode.getChildByName('BtnType1');
    let btnType2Node = bgNode.getChildByName('BtnType2');
    let btnType3Node = bgNode.getChildByName('BtnType3');
    let btnType4Node = bgNode.getChildByName('BtnType4');
    btnType1Node.active = (type === this.MB_OK);
    btnType2Node.active = (type === this.MB_YESNO);
    btnType3Node.active = (type === this.MB_OKCANCEL);
    btnType4Node.active = (type === this.MB_YESNOCANCEL);

    let btnNode = btnType1Node;
    if (type === this.MB_YESNO) {
        btnNode = btnType2Node;
    } else if (type === this.MB_OKCANCEL) {
        btnNode = btnType3Node;
    } else if (type === this.MB_YESNOCANCEL) {
        btnNode = btnType4Node;
    }

    let labelOkNode = btnNode.getChildByName('Label' + this.BT_OK);
    let labelYesNode = btnNode.getChildByName('Label' + this.BT_YES);
    let labelNoNode = btnNode.getChildByName('Label' + this.BT_NO);
    let labelCancelNode = btnNode.getChildByName('Label' + this.BT_CANCEL);
    if (options[this.BT_OK] && labelOkNode) {
        labelOkNode.getComponent(cc.Label).string = options[this.BT_OK];
    }
    if (options[this.BT_YES] && labelYesNode) {
        labelYesNode.getComponent(cc.Label).string = options[this.BT_YES];
    }
    if (options[this.BT_NO] && labelNoNode) {
        labelNoNode.getComponent(cc.Label).string = options[this.BT_NO];
    }
    if (options[this.BT_CANCEL] && labelCancelNode) {
        labelCancelNode.getComponent(cc.Label).string = options[this.BT_CANCEL];
    }

    let btnOkNode = btnNode.getChildByName('Btn' + this.BT_OK);
    let btnYesNode = btnNode.getChildByName('Btn' + this.BT_YES);
    let btnNoNode = btnNode.getChildByName('Btn' + this.BT_NO);
    let btnCancelNode = btnNode.getChildByName('Btn' + this.BT_CANCEL);
    if (btnOkNode) {
        btnOkNode.on(cc.Node.EventType.TOUCH_END, function () {
            clearInterval(options.timerCountdown);
            CallBack(msgbox, callback, this.BT_OK);
        }, this);
    }
    if (btnYesNode) {
        btnYesNode.on(cc.Node.EventType.TOUCH_END, function () {
            clearInterval(options.timerCountdown);
            CallBack(msgbox, callback, this.BT_YES);
        }, this);
    }
    if (btnNoNode) {
        btnNoNode.on(cc.Node.EventType.TOUCH_END, function () {
            clearInterval(options.timerCountdown);
            CallBack(msgbox, callback, this.BT_NO);
        }, this);
    }
    if (btnCancelNode) {
        btnCancelNode.on(cc.Node.EventType.TOUCH_END, function () {
            clearInterval(options.timerCountdown);
            CallBack(msgbox, callback, this.BT_CANCEL);
        }, this);
    }

    if (options.countdownBtnType && options.countdownMSTime) {
        function UpdateCountdownBtn(remainTime) {
            let nodeName = 'Label' + options.countdownBtnType;
            let labelNode = btnNode.getChildByName(nodeName);
            if (labelNode) {
                if (!options.countdownBtnTxt)
                    options.countdownBtnTxt = labelNode.getComponent(cc.Label).string;
                remainTime = Math.floor(Math.max(0, remainTime) / 1000);
                let newString = options.countdownBtnTxt + '(' + remainTime + ')';
                labelNode.getComponent(cc.Label).string = newString;
            }
        }
        UpdateCountdownBtn(options.countdownMSTime);
        options.startTimestamp = new Date().getTime();
        options.timerCountdown = setInterval(function () {
            let nowTimestamp = new Date().getTime();
            let diffTimestamp = nowTimestamp - options.startTimestamp;
            UpdateCountdownBtn(options.countdownMSTime - diffTimestamp);
            if (options.countdownMSTime - diffTimestamp <= 0) {
                clearInterval(options.timerCountdown);
                CallBack(msgbox, callback, options.countdownBtnType);
            }
        }, 100);
    }

    bgNode.scaleX = 0.01, bgNode.scaleY = 0.01;
    bgNode.runAction(cc.scaleBy(0.2, 100));
}

const msgbox = {
    MB_OK: 1, // 确定弹窗
    MB_YESNO: 2, // 是.否弹窗
    MB_OKCANCEL: 3, // 确定.取消弹窗
    MB_YESNOCANCEL: 4, // 是.否.取消弹窗

    BT_OK: 1, // 确定按钮
    BT_YES: 2, // 是按钮
    BT_NO: 3, // 否按钮
    BT_CANCEL: 4, // 取消按钮

    Show: function (owner, tips, type, callback, options) {
        owner = owner || cc.find('Canvas');
        if (!(owner instanceof cc.Node)) return;

        let prefab = cc.loader.getRes("msgbox", cc.Prefab);
        if (prefab instanceof cc.Prefab) {
            DoShow.call(this, prefab, owner, tips, type, callback, options);
            return;
        }

        if (!this.msgboxList) this.msgboxList = new Array();
        this.msgboxList.push([owner, tips, type, callback, options]);

        if (this.isLoadingPrefab) return;
        this.isLoadingPrefab = true;

        cc.loader.loadRes("msgbox", cc.Prefab, function (err, prefab) {
            if (err) {
                let errMsg = err.message || err;
                console.error('加载MsgBox预制错误：', errMsg);
            } else {
                for (let i = 0, len = this.msgboxList.length; i < len; ++i) {
                    let mb = this.msgboxList[i];
                    DoShow.call(this, prefab, mb[0], mb[1], mb[2], mb[3], mb[4]);
                }
                this.msgboxList = [];
            }
        }.bind(this));
    },
};

module.exports = msgbox;