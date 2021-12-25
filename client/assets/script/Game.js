window.g_head = require('./public/Head');
window.g_msgbox = require('./public/MsgBox');

const config = require('./Config');
const utility = require('./public/Utility');
const wxcloud = require('./public/WXCloud');

cc.Class({
    extends: cc.Component,

    start() {
        if (utility.IsWeinXinPlatform()) {
            wx.showShareMenu({ withShareTicket: true });
            wx.onShareAppMessage(function () {
                let length = config.shareImgs.length;
                let idx = utility.Random(0, length - 1);
                return {
                    title: config.shareImgs[idx].title,
                    imageUrlId: config.shareImgs[idx].id,
                    imageUrl: config.shareImgs[idx].url
                }
            })
            wxcloud.Init();
        }

        let nodeBlockGame = this.node.getChildByName('BlockGame');
        nodeBlockGame.x = 0, nodeBlockGame.y = this.node.height;
        nodeBlockGame.width = this.node.width;
        nodeBlockGame.height = this.node.height;
        nodeBlockGame.active = true;

        let nodeResult = this.node.getChildByName('Result');
        nodeResult.x = 0, nodeResult.y = this.node.height;
        nodeResult.width = this.node.width;
        nodeResult.height = this.node.height;
        nodeResult.active = true;

        this.node.getChildByName('Rank').active = false;

        this.UpdateLocation(true);
    },

    UpdateLocation(isLobby) {
        this.node.getChildByName('Lobby').active = isLobby;
        if (!isLobby) {
            let nodeBlockGame = this.node.getChildByName('BlockGame');
            let jsBlockGame = nodeBlockGame.getComponent('BlockGame');
            jsBlockGame.PlayEnterAction();
            nodeBlockGame.y = 0;
        }
    },
});
